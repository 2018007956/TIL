**문제 상황**
컨트롤러의 화면이 킬 프로세스로 가득 찼다
![[Pasted image 20250928025007.png]]
![[Pasted image 20250928025059.png]]
neutron 서비스가 계속 kill 돼서 그런지, 대시보드에도 아무 정보가 안뜨는 상황
![[Pasted image 20250928025543.png]]
오류 메시지 : 인스턴스를 찾지 못 했습니다.
Unexpected API Error. Please report this at http://bugs.launchpad.net/nova/ and attach the Nova API log if possible. <class 'keystoneauth1.exceptions.connection.ConnectFailure'> (HTTP 500) (Request-ID: req-602655bc-b9f0-4fe8-9e1b-6e0567161ed4)

neutron-server 상태는 active로 올라와있는데, 계속 죽고 다시 살아나니까 순간적으로는 running으로 뜸
![[Pasted image 20250928025754.png]]
진짜 상태를 보려면 `journalctl`에서 확인해야 한다.
`journalctl -u neutron-server -n 100 음

**문제 원인**
버가 메모리가 부족한 상황이 오면 `OOM killer`가 `OOM Scoring`을 통해 가장 나쁜 점수를 가진 프로세스를 종료한다. 아래 top 명령어 결과를 보면 메모리를 가장 많이 차지하는 프로세스가 neutron-server인 것을 볼 수 있고, 그래서 OOM killer의 대상이 되어 계속 종료되고 있는 것이다.
![[Pasted image 20250928031947.png]]


**해결 과정**
neutron-server는 OOM killer의 대상이 되면 안되므로, 회피 방법을 사용한다.
`$ echo -17 > /proc/<pid>/oom_adj`
`OOM killer`를 끌 수는 없지만 `OOM killer`의 `OOM scoring` 대상에서 벗어나는 것은 가능하다. 위의 명령으로 `oom_adj` 값을 -17로 설정하는 것이다. -17 값은 OOM_DISABLE의 상수 값이다. 

> neutron-server가 OOM으로 죽고 재시작되면서 PID가 계속 바뀜. 
> 그래서 개별 PID에 echo로 쓰는 방식은 레이스에 취약하다

=> service 단위로 영구 설정하는 방법 사용
`sudo systemctl edit neutron-server`
![[Pasted image 20250928033802.png|450]]

저장 확인
	`systemctl cat neutron-server`
적용
	`sudo systemctl daemon-reload`
	`sudo systemctl restart neutron-server`
![[Pasted image 20250928034714.png]]

그렇게 해도 계속 OOM에 잡아먹히는 중
![[Pasted image 20250928035219.png]]

`/etc/neutron/plugins/ml2/ml2_conf.ini`에서 flat_networks, securitygroup, ovn 지정 안되어있었고, mechanism_drivers 을 openvswitch에서 ovn 으로 수정함
```
[ml2_type_flat]
flat_networks = phynet2

[securitygroup]
enable_security_group = true

[ovn]
ovn_nb_connection = tcp:192.168.98.11:6641
ovn_sb_connection = tcp:192.168.98.11:6642
ovn_l3_scheduler = leastloaded
```

`sudo systemctl enable --now neutron-server`

이렇게 **openvswitch 설정을 ovn으로 바꿔주니까** OOM killer 동작 안했음.
정확히 확인해보려고 다시 mechanism_dirvers = openvswitch로 바꿨는데 또 killed porcess가 떴고, 이게 맞구나 생각하고 다시 ovn으로 돌렸는데 안 멈춤. reboot 했는데 더 심해짐; 

원인 : `neutron-server`에 걸린 **cgroup 메모리 제한**(예: `MemoryMax=2G`)을 **프로세스가 초과** → OOM Killer가 반복 종료.
- `MemoryMax` 해제 (또는 상향) 후 재시작
![[Pasted image 20250929001510.png]]
천천히 출력됨
`anon-rss`가 11.7GB 이상까지 올라간 걸 보면 확실히 **프로세스 자체의 메모리 누수 또는 과도한 사용**이 원인

---
다시 제자리.

**상태 분석**
- `anon-rss` (실제 메모리 사용) 이 `11GB+` 까지 치솟음.
- `total-vm` 값도 12GB 이상.
- MemoryMax 제한을 풀었으니, 이제는 전체 시스템 RAM이 다 차서 커널이 OOM Killer를 호출하는 상황.
- 즉, **제한 문제가 아니라 neutron-server 자체가 비정상적으로 메모리를 계속 잡아먹고 있는 상태**.

메모리 사용 추적해보면,
```
ps -o pid,rss,cmd -C neutron-server
pmap -x <PID> | tail -n 20
```
![[Pasted image 20250929002309.png]]
- `RSS` = **9729572 KB (약 9.7 GB)** → neutron-server가 여전히 엄청난 메모리를 점유 중.
- `pmap`의 합계: **~11 GB 사용** (`total kB 11216464`).

**가능한 원인**
1. **워커 수 과다**
    - `api_workers`, `rpc_workers` 기본값은 CPU 코어 수만큼 잡히는데, VM 환경에서 워커 수가 많으면 메모리가 선형 증가
    - CPU 코어 수가 많으면, 워커마다 DB 커넥션 풀/캐시/큐 클라이언트가 독립적으로 생겨 메모리 사용량이 선형 증가
    - 예: 8코어라면 기본 워커 8개 × DB connection pool × RPC thread → 수 GB 금방 잡아먹음
    => 테스트 환경에서는 워커가 많을 필요 없으니 `1`로 줄여야 한다
	```
	# /etc/neutron/neutron.conf
	[DEFAULT]
	api_workers = 1
	rpc_workers = 1
	```
			재시작 `systemctl restart neutron-server` 

2. **DB 마이그레이션 불완전
    - 이전에 보였던 `ml2_geneve_allocations` 테이블 오류처럼, DB 스키마가 꼬여 있으면 재시도 루프가 돌면서 메모리 계속 증가
	=> DB 마이크레이션 강제 적용 `neutron-db-manage upgrade heads`
	![[Pasted image 20250929001927.png|450]]
3. **메시지 큐(MQ) 연결 불안정
    - RabbitMQ 연결 불가/재시도 무한 루프가 있으면 로그 버퍼가 쌓이고 메모리 누수처럼 보일 수 있음

위 세 가지 시도해 봤지만 상태 변화 없음

4. **OVN/OVS 설정 꼬임
    - OVN NB/SB DB 연결 실패 시 재시도 loop → memory leak 현상 유발
	- 에러 로그가 없는데 메모리가 계속 오르는 경우 → 반복적인 요청이나 캐시가 해제되지 않는 상황일 수 있음.
	- 예: OVN/OVS와 통신이 꼬여서 지속적인 RPC 호출이 돌고 있는데, 이게 로그 레벨이 INFO라 ERROR로 안 찍히는 경우.
	- 또는 DB 마이그레이션 불완전으로 retry 루프 → WARNING/ERROR 없이 루프만 도는 경우도 있음.

[OVN 상태에서 보이는 문제]
![[Pasted image 20250929003325.png]]
- `ovn-nbctl show` 결과:
    - `port provnet-... type: localnet` 의 **addresses: ["unknown"]**  
        → Provider 네트워크 포트 주소가 제대로 안 잡힘
- `ovn-sbctl show` 결과:
    - Compute 노드(`os-compute`)는 `Encap vxlan`/`Encap geneve`가 잘 잡혀 있고, IP `192.168.50.122`로 표시됨
    - 하지만 Controller ↔ Compute 사이의 **Port_Binding**이 완전히 매칭되지 않은 상태일 수 있음
즉, NB DB(Southbound DB 포함)와 실제 OVS/OVN 매핑이 불완전해서 neutron-server가 계속 binding 시도 → 메모리 누적 → OOM 가능성

[OVS/OVN 매핑이 어떻게 되어야 하는가?]
