**문제 상황**
외부 네트워크(호스트 ex: 192.168.50.121)에서 test02 인스턴스로 통신이 안되는 상황
![[Pasted image 20251007204454.png|400]]

**문제 원인**
1. 컴퓨트 노드에서도 ovn-bridge-mappings 정보 들어가 있어야 함
	구조상 **test02 인스턴스는 “public-network(=provider network)”에 연결돼 있으므로**,  
	그 인스턴스가 **실제로 어떤 노드 위에서 동작 중이냐**는 **Nova 스케줄러의 결정**에 따름

	- ==**test02는 nova-compute가 설치된 노드(=컴퓨트 노드)** 위에서 실제 QEMU 프로세스로 실행된다.==
	- Controller 노드에서는 nova-scheduler, nova-conductor 같은 관리 서비스만 돌고, 인스턴스 프로세스는 없다.
	- Network 노드는 OVN 라우터나 DHCP agent, NAT를 담당하지만 실제 VM은 없다.

	test02가 어느 노드 위에 올라갔는지 직접 보려면:
	![[Pasted image 20251007202917.png]]
	- OS-EXT-SRV-ATTR:host = 인스턴스가 실제로 올라가 있는 **호스트(노드)** 이름

2. 컴퓨트 노드에도 phynet2(public)에 대한 bridge mapping이 있어야 한다.

	현재는 아래와 같은 구조
	- **br-ex + enp6s18** : 네트워크 노드에만 존재
	- **test02 인스턴스** : 컴퓨트 노드 위에서 실행 (즉, 물리 NIC이 없음)
	- **test02가 연결된 public-network** : provider(=물리망 직접 연결형) 네트워크

	provider 네트워크를 사용하는 인스턴스가 있는 노드에서 phynet2(public)에 대한 bridge mapping이 있어야그 인스턴스가 외부 L2와 직접 통신할 수 있음

**해결 방법**
	1. [compute] `ovs-vsctl set Open_vSwitch . external-ids:ovn-bridge-mappings="phynet2:br-ex"`
	2. provider network를 컴퓨트 노드에도 확장
	   compute 노드에도 br-ex를 만들어서 같은 물리 NIC를 붙임  
```
ovs-vsctl add-br br-ex || true
ovs-vsctl add-port br-ex enp6s18 || true
```
		서비스 재시작
		systemctl restart ovn-host

**결과**
외부 네트워크에서 인스턴스로 통신 성공
![[Pasted image 20251007205727.png|500]]