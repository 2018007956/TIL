**구축 이유**
1. 호스트 대역에 인스턴스를 만들면 ip가 부족한 문제가 생길 수 있는 반면, 
   private ip는 가상의 영역이라 네트워크를 계속 만들어서 많은 네트워크를 사용할 수 있다
2. External netwokr에 인터페이스를 추가해서 통신하는 방식은 보안적으로 네트워크 격리가 되어 있지 않기 때문에 외부에서 접근하기 쉬워지는 이슈가 있다. 그래서 클라우드 환경에서 외부 인터넷 환경과 완전히 분리된 네트워크 환경을 만들어서 민감한 자료를 숨기는 방법을 사용한다.

**가상 네트워크 생성**
[Controller] OpenStack VM이 사용할 네트워크를 Neutron을 통해 생성
1. Provider network 생성
   openstack network create \
	  --provider-network-type geneve \
	  --provider-segment 2000 \
	  selfservice
   ![[Pasted image 20251005000201.png|400]]
2. 네트워크 대역대(subnet) 등록
   ![[Pasted image 20251005000805.png|400]]
3. 라우터 생성
   `openstack router create private-router`
   `openstack router add subnet private-router 10-1-201-0`
4. 외부 네트워크 연결
	`openstack router set private-router --external-gateway public-network`
	![[Pasted image 20251005001633.png|300]]
	**라우터 외부 포트가 올라가는 게이트웨이 노드**에도 **같은 physnet 매핑**과 **게이트웨이 섀시 옵션**이 있어야 L2가 이어짐
	```
	ovs-vsctl set Open_vSwitch . external_ids:ovn-bridge-mappings=phynet2:br-ex
	ovs-vsctl set Open_vSwitch . external_ids:ovn-cms-options=enable-chassis-as-gw
	systemctl restart ovn-controller
	```

	- br-ex에 localnet 포트가 생겼는지 확인 (게이트웨이 노드)
	  `ovs-vsctl list-ports br-ex`
	  ![[Pasted image 20251005003629.png|500]]
	  `provnet-<uuid>` 같은 OVN이 만든 포트가 보임
	  -> 안 보이면 OVN이 provider 네트워크를 외부 브릿지로 연결하지 못한 상태임

	- 라우터 외부 게이트웨이 재바인딩 (스케줄링 트리거)
	  게이트웨이 섀시/매핑을 잡은 뒤, 게이트웨이 재설정으로 바인딩을 다시 태움
  ```
  openstack router unset --external-gateway <router-name>
  openstack router set --external-gateway public-network <router-name>
  ```

> 192.168.50.189까지 ping이 안되는 상황
- 컨트롤러/네트워크 노드에서 아래 값 설정 확인
  ![[Pasted image 20251005010329.png|250]]
	이 과정에서 [[neutron service down (ovn central not listned)]] 문제 발생하여 해결함
	-> 라우터 게이트웨이 상태가 Active로 바뀜
	하지만 여전히 189와는 통신이 안됨

5. Security Group 생성
6. Flavor(네트워크 리소스의 용량과 구성을 정의하는 매개변수 집합) 생성
7. OVS 브리지 매핑 : `/etc/neutron/plugins/ml2/openvswitch_agent.ini`
	```
	[ovs]
	bridge_mappings = phynet2:br-ex
	```
8. Neutron agent 재시작
	 `systemctl restart neutron-server.service`
9. Floating IP 생성 및 연결
	```
	openstack floating ip create public-network
	openstack server add floating ip <INSTANCE_NAME> <FLOATING_IP>
	```