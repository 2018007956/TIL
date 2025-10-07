**문제 상황**
192.168.50.130(라우터의 외부(qg) 게이트웨이)까지는 ping이 되고, 
10.1.201.0/24(테넌트망)으로는 접근이 안 됨
![[Pasted image 20251007170120.png|400]]

**문제 원인**
geneve로 tenant망에 대한 드라이버 타입은 설정이 되어 있는데 메뉴얼에 나와 있듯이 통신되는 대역을 안 넣어놔서 통신이 안 됨//

게이트웨이 섀시 설정을 확인하면 아무것도 출력이 안됨
![[Pasted image 20251007165720.png]]
실제 게이트웨이 섀시 객체가 존재하지 않는다. 즉, 이 라우터의 외부 포트(lrp-462891fd...)가 어떤 물리 노드도 게이트웨이로 맡고 있지 않다는 뜻이다. 그래서 Neutron으로 DNAT/SNAT이 자동 설정 되었지만 실제로 패킷을 물리 NIC(br-ex)로 내보낼 노드가 없어서 외부(public 네트워크, 예: 192.168.50.x 대역) ↔ 내부 네트워크(selfservice 대역, 예: 10.1.201.0/24)의 게이트웨이(10.1.201.1)통신이 끊긴 상태이다.

게이트웨이 섀시 지정
![[Pasted image 20251007165549.png]]

**해결 방법**
컨트롤러 노드에서 SNAT, DNAT< dnat_and_snat 플로우가 잘 설정되어 있는지 확인하기 위해,
Neutron 라우터 이름 확인
(OpenStack(ML2/OVN)에서는 Neutron 라우터가 OVN에 **`neutron-<라우터UUID>`** 라는 이름의 Logical Router로 만들어진다)
![[Pasted image 20251007172614.png]]
OVN 라우터의 NAT 테이블 확인해보면
![[Pasted image 20251007172659.png]]
- NAT 설정은 잘 되어있고,
- 인스턴스의 보안그룹도 ICMP 등 모두 Ingress 허용되어있는 상황

![[Pasted image 20251007181830.png|500]]
os-network의 br-int가 DOWN 상태라서
논리 라우터와 내부 네트워크(10.1.201.x)가 연결되지 못하고 있다.
![[Pasted image 20251007182038.png]]
`ip link set br-int up`하면 tcpdump 연결은 됨
![[Pasted image 20251007182457.png|600]]
근데 이렇게 열어놓고 ping 192.168.50.177 (floating ip)를 하면 아무것도 출력이 안되고, 
게이트웨이 노드의 br-int 에서 안 보이는 게 정상임
![[Pasted image 20251007182613.png|450]]
==FIP(192.168.50.177)로 들어온 ICMP는 게이트웨이 섀시에서 **DNAT → Geneve 캡슐화 → 컴퓨트 노드로 전달**됨. 이때 게이트웨이 노드에서는 **바깥 헤더만 보이는 Geneve 패킷(UDP/6081)** 로 나가고, **내부 IP(10.1.201.156)** 는 캡슐화 안쪽에 들어가 있음.== 그래서
- br-ex : ICMP echo 요청 보임
- br-int(게이트웨이) : **내부 IP로 필터하면 안 잡힘** (캡슐화되어 나감)
즉, 캡처 지점이 달라서 조용한 것
----------------------(위 내용은 공부 필요)-----------------------------

- **Gateway Logical Router Port의 MAC mismatch**
게이트웨이 섀시에 연결된 LRP(`lrp-462891fd-27cb-4d80-ad6e-edf2856cf741`)의 MAC이  
실제 NAT 포트(br-ex)와 달라지면 패킷이 드롭된다.
![[Pasted image 20251007184940.png]]
![[Pasted image 20251007184744.png|500]]
MAC 주소가 다르면 OVN이 outgoing NAT 패킷을 처리하지 못해서
수동으로 맞춰줌
`ovn-nbctl set Logical_Router_Port lrp-47031ea1-5f56-44e0-b9ef-3314406e70c1 mac=\"bc:24:11:8a:a2:b5\"`
![[Pasted image 20251007184915.png]]
==`192.168.50.130`는 **게이트웨이 섀시(os-network)의 br-ex**로 외부망에 붙는 인터페이스라 **br-ex의 실제 MAC**과 동일해야 ARP/NAT가 정상 동작==
(`10.1.201.1`은 **내부 selfservice 네트워크에 있는 논리 라우터 포트**라서 **OVN이 생성한 가상 MAC**(지금 보이는 `fa:16:3e:ea:1e:11`)을 유지해야 함. 이걸 임의로 바꾸면 내부 VM들이 ARP로 배운 라우터 MAC과 달라져 내부 통신이 꼬일 수 있음)
