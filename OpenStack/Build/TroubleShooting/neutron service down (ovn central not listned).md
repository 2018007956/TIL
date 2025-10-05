**문제 상황**
라우터 게이트웨이까지 통신이 안되는 문제를 해결하기 위해 
1. 컨트롤러/네트워크의 `ml2_conf.ini` 파일에 [ovn] bridge_mappings = phynet2:br-ex 추가
2. Neutron/OVN 서비스 재시작
   `systemctl restart neutron-server ovn-controller ovn-northd`
3. 라우터 게이트웨이 포트 재생성 
   `openstack router unset --external-gateway private-router`
   `openstack router set --external-gateway public-network private-router`
했더니 갑자기 대시보드 끊기고, neutron 서버가 죽는 상황 발생
![[Pasted image 20251005120719.png]]
로그를 살펴보면, `ovsdb-client: failed to connect to "tcp:192.168.50.121:6641" (Connection refused)`
![[Pasted image 20251005120326.png]]
`neutron-server`가 **OVN NB DB(6641)** 에 붙지 못해서 **프로세스가 종료**되는 상태
즉, OVN Central(ovsdb-server-nb/sb, ovn-northd)가 리슨하지 않거나, 접속 주소/;포트가 ml2 설정과 불일치함

**해결 과정**
`systemctl status ovn-nb-ovsdb` 하면 inactive 되어있는 것을 볼 수 있음
![[Pasted image 20251005120933.png]]
이걸 start 해주고,
![[Pasted image 20251005121026.png]]
`ovn-sb-ovsdb`도 같은 방식으로 켜줌
![[Pasted image 20251005120847.png]]

**결과**
neutron 서버를 다시 켜줘도 죽지 않고, NB/SB oVSDB가 6641/6642로 리슨 중인 것을 볼 수 있음
![[Pasted image 20251005121142.png]]

ovn 설정까지 적용돼서 router_gateway status=Active 로 바뀐 것을 볼 수 있음
![[Pasted image 20251005131532.png|500]]

**문제 원인 분석**
`systemctl restart neutron-server ovn-controller ovn-northd` 이 부분이 문제 원인.
systemd 유닛 간의 잘못된 의존 관계 때문에, 
OVN northd 재시작 시 NB/SB OVSDB 서버가 자동으로 내려가 버림

| 구성 요소                           | 역할                  | 정상 동작 조건                  |
| ------------------------------- | ------------------- | ------------------------- |
| **ovn-nb-ovsdb / ovn-sb-ovsdb** | OVN 중앙 DB 프로세스      | 데이터베이스 파일 존재, 리슨 주소 유효    |
| **ovn-northd**                  | NB→SB 동기화 엔진        | NB/SB 둘 다 연결 가능해야 함       |
| **ovn-controller**              | 하이퍼바이저 노드 플로우 관리    | SB DB에 접속 되어 있어야 함        |
| **neutron-server**              | NB DB 를 조작하는 API 서버 | NB DB (6641)에 접속 되어 있어야 함 |

`systemctl restart ovn-northd`를 하면:
1. systemd가 “Requires” 관계인 `ovn-nb-ovsdb`, `ovn-sb-ovsdb`를 **정지(stop)** 시킴
2. 그다음 `ovn-northd`를 정지시키고 재시작하려 함
3. 하지만 NB/SB는 oneshot 타입이라 **다시 자동 기동되지 않음**, 상태가 inactive로 남음
4. 결국 northd가 다시 올라가도 DB에 붙을 수 없어 실패
그래서 `ovn-northd restart`를 하면 NB/SB가 같이 죽어버림


NB/SB가 꺼지는 이유들을 정리하면,
1. **순서 문제**
	- `ovn-northd`가 NB/SB DB보다 먼저 기동하면 DB 연결 실패로 즉시 종료됨
	- 그 상태에서 systemd가 oneshot 성격의 `ovn-nb-ovsdb`유닛을 inactive로 표시
	  → 결국 NB/SB가 꺼져 보임
2. **systemd 유닛 타입 특징**
	- 많은 배포판에서 `ovn-nb-ovsdb.service` 와 `ovn-sb-ovsdb.service` 는 `Type=oneshot`, `RemainAfterExit=no` 이기 때문에 **성공적으로 DB를 시작해도 즉시 inactive 표시** 됨
	- 실제 `ovsdb-server` 프로세스는 돌고 있지만 systemctl status는 비활성처럼 보임
3. **의존성 (After/Requires)**
	- `ovn-northd` 유닛이 NB/SB 유닛과 연결되어 있지 않으면, restart 시 NB/SB 를 종료 시킨 뒤 다시 못 살림
4. **DB 파일 락 충돌**
	- 동시에 세 프로세스를 죽였다가 올리면 NB/SB DB 파일이 잠시 락돼서 “database is locked” 오류 → 서버 죽음
5. **데몬 관리 스크립트 혼용**
	- `ovn-ctl` 로 관리하는 배포에서 systemctl 로 NB/SB를 건드리면 중복 제어 → 충돌 종료

