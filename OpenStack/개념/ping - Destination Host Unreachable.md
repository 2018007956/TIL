ping 통신이 안되는 경우 2가지 상황이 존재한다.
1. 아무 출력도 없이 멈춰있는 경우
2. Destination Host Unreachable 메시지가 뜨는 경우

두 가지의 의미를 각각 알아보자

### 1. 응답 메시지가 없는 경우
**ARP(2계층)** 단계에서부터 막힌 것
##### 🔍 의미
- 인스턴스가 게이트웨이(10.1.201.1)의 MAC 주소를 모름
- ARP 요청(`Who has 10.1.201.1?`)을 브로드캐스트했는데, **게이트웨이 LRP(L3 포트)** 가 응답하지 않음    
- 따라서 **패킷이 라우터까지 도달조차 못함**
##### ⚙️ 원인 예시

| 원인                        | 설명                                                      |
| ------------------------- | ------------------------------------------------------- |
| LRP (10.1.201.1) 포트가 down | `ovn-nbctl list logical_router_port` 에서 `enabled=false` |
| Geneve 터널 연결 실패           | compute ↔ network 간 터널 down                             |
| 포트 바인딩 잘못됨                | 인스턴스 포트가 잘못된 섀시에 붙음                                     |
| 보안 그룹에서 egress 차단         | ICMP나 ARP까지 막을 수 있음                                     |

즉, **아무 반응도 없다는 건 “2계층(링크 계층)”에서 이미 막힌 것**

---
### 2. Destination Host Unreachable 출력 되는 경우

> `From 10.1.201.156 icmp_seq=1 Destination Host Unreachable`

이건 한 단계 더 나아가서, **ARP는 성공했지만 3계층(네트워크 계층)** 에서 목적지로 가는 경로가 없거나 응답이 오지 않는 상황
##### 🔍 의미
- 인스턴스가 게이트웨이의 MAC 주소를 이미 알고 있다 (즉, ARP OK)
- 하지만 게이트웨이가 패킷을 전달할 **라우팅 경로가 없거나, ICMP 응답이 돌아오지 않음**
##### ⚙️ 원인 예시

|원인|설명|
|---|---|
|라우터 LRP가 존재하지만 NAT/SNAT 누락|L3 포워딩이 중단됨|
|br-int ↔ LRP 연결 문제|LSP/LRP 연결 누락|
|ovn-controller sync 문제|SB에 라우팅 플로우 미전파|
|LRP는 alive지만 flow가 없음|`ovn-sbctl dump-flows` 에서 `lr_in_ip_input` 플로우 누락|

즉, **“ARP는 됐는데 라우팅이 안 된다”** 뜻

---
### 정리

|단계|상태|ping 증상|
|---|---|---|
|(1) ARP 실패|MAC 응답 없음|아무 출력 없음|
|(2) ARP 성공, 라우팅 실패|라우터 응답 없음|`Destination Host Unreachable`|
|(3) 라우팅 성공, 응답 없음|상대방이 ICMP 응답을 안 줌|ping 계속 “Request timed out”|
|(4) 완전 성공|ICMP reply 수신|정상 ping 응답|
