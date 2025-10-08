[[Open vSwitch (OVS)]] 안에서 만들어지는 통합 브리지(Integration Bridge)이다.
[[OVN]]이 VM, 라우터, 네트워크 노드들을 연결할 때 모든 내부 트래픽이 가장 먼저 지나가는 중앙 가상 스위치이다.

| 구분           | 설명                                                                |
| ------------ | ----------------------------------------------------------------- |
| **위치**       | 각 **Compute, Network 노드** 안에 존재                                   |
| **역할**       | 해당 노드에서 VM, 터널(Geneve), DHCP, Router Logical Port들을 모두 연결         |
| **핵심 기능**    | ① VM ↔ 논리 스위치 간 L2 브리지<br>② Geneve 터널 송수신<br>③ LSP/LRP 연결 포인트 관리  |
| **논리 대응**    | OVN NB DB의 _Logical Switch_ 에 해당                                  |
| **연결 구조 예시** | `VM tap` 인터페이스 — br-int — Geneve 포트 — br-int(다른 노드) — Router Port |