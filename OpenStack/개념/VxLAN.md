VLAN을 확장한 개념으로, 기존의 VLAN에서 만들 수 있는 네트워크보다 훨씬 더 많은 네트워크를 생성할 수 있다. VxLAN에서 x는 eXtensible로 이름에서도 확장을 나타내고 있다. 

VLAN은 이더넷 프레임에 16bit(vlan, option, id)를 추가로 구성하여 Tag를 기반으로 동작하는데 이때 id로 사용할 수 있는 비트가 12bit이기 때문에 만들 수 있는 네트워크가 최대 4096개만 생성할 수 있었다. VxLAN은 VLAN의 문제를 해결하기 위해 50byte 헤더(Mac over IP, UDP Header, 24bit VLAN ID)를 추가로 구성하여 16,000,000개 이상의 VLAN을 제공할 수 있다.

VLAN에서는 서로간의 통신을 위해 VLAN Trunk를 구성하는데 이는 정적이고 변경에 빠르게 대처하기 어렵다. VxLAN에서는 이러한 VLAN Trunk 없이 Multicast를 이용하여 Tree를 구성해 통신을 진행하기 때문에 동적이고 유연한 구성이 가능하다.

### L2 Network와의 차이점
- 기본적인 L2 Network에서는 ARP 테이블을 수집하기 위해 Broadcast를 이용하며 MAC address는 스위치에서 수집하여 관리한다. 하지만 VxLAN은 VM들이 직접 ARP 테이블을 보유하고 vSwitch에서 테이블을 관리한다. 
- VxLAN에서 BUM 트래픽에 대해 IP Multicast를 기반으로 전송한다. Multicast로 ARP 테이블을 갱신하고 직접 해당 스위치쪽에 P2P Tunnel로 통신하는 방식이다.

### VxLAN 용어 설명
VTEP(VxLAN Tunnel End Point)
- VxLAN Tunnel의 종단에 역할을 수행한다
- VxLAN Tunnel간의 De-Encapsulation 역할을 수행한다
- 하단의 End point에서는 VxLAN 동작 여부를 알지 못한다

VNI(Virtual Network Identifier)
- VLAN과 VxLAN segment간 mapping 구분자
- 같은 VLAN에 대해 여러 개의 VNI mapping이 가능하다 (tanant 관리)

NVE(Network Virtualization Interface)
- VxLAN De-Encapsulation이 발생하는 Logical Interface

VxLAN Segment
- VM간 통신을 위한 VxLAN Layer 2 overlay network

VxLAN Gateway
- VxLAN과 non-VxLAN과의 통신을 위한 게이트웨이(=VTEP)