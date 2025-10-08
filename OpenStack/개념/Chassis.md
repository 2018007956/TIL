Chassis : 섀시는 ovn-controller가 돌아가는 각 노드를 OVN에서 부르는 이름이다

그 중 논리 라우터의 외부 포트(LRP, external/gateway port)를 실제로 처리하는 섀시를 Gateway Chassis 라고 한다.
- 게이트웨이 섀시만 외부망(localnet/`public:br-ex`)에 물리적으로 연결돼 있고,
- NAT/ARP/FIP 같은 North/South 트래픽을 실제로 수행한다