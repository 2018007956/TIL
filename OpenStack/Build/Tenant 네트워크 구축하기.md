**Private(Tenant) 네트워크 구축 이유**
1. 호스트 대역에 인스턴스를 만들면 ip가 부족한 문제가 생길 수 있는 반면, 
   private ip는 가상의 영역이라 네트워크를 계속 만들어서 많은 네트워크를 사용할 수 있다
2. External netwokr에 인터페이스를 추가해서 통신하는 방식은 보안적으로 네트워크 격리가 되어 있지 않기 때문에 외부에서 접근하기 쉬워지는 이슈가 있다. 그래서 클라우드 환경에서 외부 인터넷 환경과 완전히 분리된 네트워크 환경을 만들어서 민감한 자료를 숨기는 방법을 사용한다.

**가상 네트워크 생성**
[Controller] OpenStack VM이 사용할 네트워크를 Neutron을 통해 생성
1. phynet1 스위치를 사용하여 Flat 타입의 Provider network 생성
	![[Pasted image 20250922195847.png]]
	`/etc/neutron/plugins/ml2/ml2_conf.ini`
	![[Pasted image 20250922234601.png]]
2. 네트워크 대역대(subnet) 등록
	- 그래야 FIP 배포 가능
	![[Pasted image 20250922200029.png|400]]
3. Security Group 생성
4. Flavor(네트워크 리소스의 용량과 구성을 정의하는 매개변수 집합) 생성
5. OVS 브리지 매핑 : `/etc/neutron/plugins/ml2/openvswitch_agent.ini`
	```
	[ovs]
	bridge_mappings = phynet1:br-ex,phynet2:br-ex
	```
6. Neutron agent 재시작
	 `systemctl restart neutron-server.service`
7. 라우터와 연결
	`openstack router set private-router --external-gateway public-network`
	![[Pasted image 20250923004749.png|400]]
8. Floating IP 생성 및 연결
	```
	openstack floating ip create public-network
	openstack server add floating ip <INSTANCE_NAME> <FLOATING_IP>
	```