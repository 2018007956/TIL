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

**문제 분석**
메모리가 부족한 상황이 오면 `OOM killer`가 `OOM Scoring`을 통해 가장 나쁜 점수를 가진 프로세스를 종료한다. 아래 top 명령어 결과를 보면 메모리를 가장 많이 차지하는 프로세스가 neutron-server인 것을 볼 수 있고, 그래서 OOM killer의 대상이 되어 계속 종료되고 있는 것이다.
![[Pasted image 20250928031947.png]]


**해결 과정 1) OOM killer 회피하기**
neutron-server는 OOM killer의 대상이 되면 안되므로, 회피 방법을 사용한다.
```
$ echo -17 > /proc/<pid>/oom_adj
```
`OOM killer`를 끌 수는 없지만 `OOM killer`의 `OOM scoring` 대상에서 벗어나는 것은 가능하다. 위의 명령으로 `oom_adj` 값을 -17로 설정하는 것이다. -17 값은 OOM_DISABLE의 상수 값이다. 

> neutron-server가 OOM으로 죽고 재시작되면서 PID가 계속 바뀜
> 그래서 개별 PID에 echo로 쓰는 방식은 레이스에 취약함

=> service 단위로 영구 설정하는 방법 사용
`sudo systemctl edit neutron-server`
![[Pasted image 20250928033802.png|450]]

저장 확인
	`systemctl cat neutron-server`
적용
	`sudo systemctl daemon-reload`
	`sudo systemctl restart neutron-server`
![[Pasted image 20250928034714.png]]

**결과**
계속 OOM에 잡아먹히는 중
그리고 kill 되는 속도가 더 빨라진 것 같아서, 다시 복구함
- `neutron-server`에 걸린 **cgroup 메모리 제한**(예: `MemoryMax=2G`)을 **프로세스가 초과** → OOM Killer가 반복 종료
- `MemoryMax` 해제 (또는 상향) 후 재시작

---

**문제 분석 2**
- `anon-rss` (실제 메모리 사용) 이 `11GB+` 까지 치솟음.
- `total-vm` 값도 12GB 이상.
- MemoryMax 제한을 풀었으니, 이제는 전체 시스템 RAM이 다 차서 커널이 OOM Killer를 호출하는 상황

메모리 사용을을 추적해보면,
```
ps -o pid,rss,cmd -C neutron-server
pmap -x <PID> | tail -n 20
```
![[Pasted image 20250929002309.png]]
- `RSS` = **9729572 KB (약 9.7 GB)** → neutron-server가 여전히 엄청난 메모리를 점유 중.
- `pmap`의 합계: **~11 GB 사용** (`total kB 11216464`).

openstack 명령어도 안 먹음
![[Pasted image 20250930000446.png]]
[nova-api → neutron-server(9696) 호출 → 연결 실패] 라서 nova-api가 500을 리턴

=> 즉, **제한 문제가 아니라 neutron-server 자체가 비정상적으로 메모리를 계속 잡아먹고 있고, 그래서 서비스가 제대로 동작하지 못하는 상황**

[neutron 로그 분석]
![[Pasted image 20250929230059.png]]
`Bridge br-ex for physical network phynet2 does not exist. Agent terminated!`
- neutron-openvswitch-agent(OVS agent)가 `phynet2 → br-ex` 매핑을 요구하는데, 해당 호스트에 br-ex가 없어서 에이전트가 종료됨

위 에러를 분석해보면,
- `neutron-server`는 DB와 RabbitMQ를 통해 네트워크 상태를 전달 
	→ L2/L3 Agent가 `neutron-server`와 동기화하며 자신이 관리할 브리지나 포트를 세팅 
	→ 만약 `neutron-server`가 죽어 있거나 통신이 불가하면, Agent는 “내가 설정해야 할 bridge가 없다” 또는 “네트워크 정보가 유효하지 않다”는 식으로 종료할 수 있음

**가능한 원인**
1. OVS/OVN 브리지 설정이 잘못되었을 경우
2. neutron-server 자체가 동작하지 않는 상태인 경우 에이전트가 필요한 정보를 못 받아서 에러 발생

`ss -lntp | grep 9696`을 해보면 neutron-server(9696)가 리슨이 안되는 상황이므로,
2번이 원인일 것으로 추측.

**해결 과정 2) ML2 플러그인 설정 파일 수정**
`/etc/neutron/plugins/ml2/ml2_conf.ini`에서, 아래 정보 수정 후 neutron-server 재시작
- flat_networks, securitygroup, ovn 지정
- mechanism_drivers = openvswitch -> ovn
- vni_ranges = 1:16777215 -> 1:65535
```
[ml2]
mechanism_drivers = ovn

[ml2_type_flat]
flat_networks = phynet2

[ml2_type_geneve]
vni_ranges = 1:65535

[securitygroup]
enable_security_group = true

[ovn]
ovn_nb_connection = tcp:192.168.98.11:6641
ovn_sb_connection = tcp:192.168.98.11:6642
ovn_l3_scheduler = leastloaded
```

**결과**
9696 포트가 리스닝되고, 메모리 누수 출력이 없어짐
![[Pasted image 20250930000225.png]]
그리고 확인해보니, ==vni_ranges 설정 부분이 메모리 누수 원인==이었음

### 왜 vni_ranges 가 메모리 릭으로 이어졌나 : ML2 동작 원리
1) ML2/OVN에서 `vni_ranges`는 **사용 가능한 Geneve 네트워크의 개수(capacity)** 를 정한다.
	OVN은 VNI의 숫자값 자체는 무시하고, 이 범위의 길이만큼을 할당 가능한 세그먼트 풀로 간주한다. `1:16777215`는 최대 16,777,215개 네트워크를 허용한다는 뜻이다.
2) Neutron은 이 세그먼트 풀을 DB/메모리로 관리한다.
	ML2의 type driver(여기선 Geneve 드라이버)는 “세그먼트 상태”를 관리하고, 프로젝트 네트워크를 만들 때 빈 세그먼트 하나를 할당한다. 이 세그먼트 풀은 `ml2_conf.ini`의 범위를 읽어서 서버 기동 시 재적재되고, 기본 세그먼트 범위가 내부 상태로 반영된다.
	-> 즉, 설정한 범위가 큰 만큼 Neutron이 관리해야 하는 “가용 세그먼트 ID 상태”도 커진다
3) 범위가 클수록 초기 동기화/관리 비용이 커진다
   Neutron은 기동하면서 이 범위를 읽어들여 세그먼트 할당 테이블(예: Geneve/VXLAN allocations류)을 동기화하고, 여러 API 워커들이 동시에 이 상태를 로드 및 검증한다. 
	범위가 1,677만 개면:
	- DB 동기화/검증 쿼리 양이 폭증
	- ORM/캐시/객체 생성 등 프로세스 메모리 사용량 급증
	- 워커 수만큼(여러 프로세스) 메모리 복제
	- 결과적으로 RSS가 빠르게 치솟아 OOM → `neutron-server`가 죽고 9696 리슨 실패 → nova-api에서 Neutron 호출 실패(HTTP 500)로 연쇄 오류

한마디로, 거대한 세그먼트 풀을 다루느라 과도한 메모리 소비가 발생하는 것
https://docs.openstack.org/neutron/train/admin/config-network-segment-ranges.html?utm_source=chatgpt.com 공식 문서의 Default network segment ranges 부분을 보면,
A set of `default` network segment ranges are created out of the values defined in the ML2 config file: `network_vlan_ranges` for ml2_type_vlan, `vni_ranges` for ml2_type_vxlan, `tunnel_id_ranges` for ml2_type_gre and `vni_ranges` for ml2_type_geneve. They will be reloaded when Neutron server starts or restarts. 

“범위는 서버 재시작 시 기본 ‘네트워크 세그먼트 범위’로 로드된다”라고 적혀 있음(= 값이 클수록 관리 집합이 커짐)

범위를 1:65535로 줄이면,
- **상태 공간 축소**: 관리 대상이 약 256분의 1로 감소 → 초기 로드/검증/캐시 메모리 급감
- **워커 중복 부담도 완화**: 같은 범위를 여러 워커가 읽더라도 총량 자체가 작아지니 OOM 경계에서 멀어짐
	- `neutron-server` 는 `api_workers`, `rpc_workers` 설정 값에 따라 여러 **프로세스(worker)** 를 띄움
	- 워커 프로세스들이 **각자 동일한 세그먼트 풀을 메모리에 로드하기 때문에**,
	- 범위가 클수록 워커 수에 비례해 메모리 사용량이 곱절로 커짐
	- 범위를 줄이면 워커가 많아도 총량이 manageable 해지고, OOM 위험에서 벗어남
- 결과적으로 `neutron-server`가 정상 기동 → **9696 리슨** → nova-api ↔ Neutron 연동 복구

---

cf) 장기적으로 OVN **Southbound DB의 MAC_Binding 테이블**이 비대해지며 Neutron RSS가 커지는 이슈도 보고된 바 있음(대규모/장시간 환경). vni_ranges 설정을 변경하지 않았는데도, 나중에 증상이 재현되면 이 방향도 모니터링 포인트.