**구축 이유**
1. 호스트 대역에 인스턴스를 만들면 ip가 부족한 문제가 생길 수 있는 반면, 
   private ip는 가상의 영역이라 네트워크를 계속 만들어서 많은 네트워크를 사용할 수 있다
2. External network에 인터페이스를 추가해서 통신하는 방식은 보안적으로 네트워크 격리가 되어 있지 않기 때문에 외부에서 접근하기 쉬워지는 이슈가 있다. 그래서 클라우드 환경에서 외부 인터넷 환경과 완전히 분리된 네트워크 환경을 만들어서 민감한 자료를 숨기는 방법을 사용한다.

**가상 네트워크 생성**
[Controller] OpenStack VM이 사용할 네트워크를 Neutron을 통해 생성
1. Provider network 생성
   `openstack network create VMNET01`
	  ( 옵션 안넣어도 됨. 기본값으로 뉴트론에서 자동 구성됨)
	![[Pasted image 20251111232924.png|400]]
2. 네트워크 대역대(subnet) 등록
   ![[Pasted image 20251111233015.png|400]]
3. 라우터 생성
   `openstack router create private-router`
   `openstack router add subnet private-router vmnet01-subnet`
4. 외부 네트워크 연결
	`openstack router set private-router --external-gateway public-network`
	
	**라우터 외부 포트가 올라가는 게이트웨이 노드**에도 **같은 physnet 매핑**과 **게이트웨이 섀시 옵션**이 있어야 L2가 이어짐
	```
	ovs-vsctl set Open_vSwitch . external_ids:ovn-bridge-mappings=phynet2:br-ex
	ovs-vsctl set Open_vSwitch . external_ids:ovn-cms-options=enable-chassis-as-gw
	systemctl restart ovn-controller
	```

	- br-ex에 localnet 포트가 생겼는지 확인 (게이트웨이 노드)
	  `ovs-vsctl list-ports br-ex`
	  ![[Pasted image 20251111232718.png|500]]
	  `provnet-<uuid>` 같은 OVN이 만든 포트가 보임
	  -> 안 보이면 OVN이 provider 네트워크를 외부 브릿지로 연결하지 못한 상태임

	- 라우터 외부 게이트웨이 재바인딩 (스케줄링 트리거)
	  게이트웨이 섀시/매핑을 잡은 뒤, 게이트웨이 재설정으로 바인딩을 다시 태움
  ```
  openstack router unset --external-gateway <router-name>
  openstack router set --external-gateway public-network <router-name>
  ```

5. 인스턴스 생성
   ![[Pasted image 20251111233224.png|500]]

6. Floating IP 생성 및 연결
	```
	openstack floating ip create public-network
	openstack server add floating ip <INSTANCE_NAME> <FLOATING_IP>
	```

**결과**
네트워크 토폴로지 :
![[Pasted image 20251111233354.png|400]]

할당한 floating ip로 통신 성공
![[Pasted image 20251111232635.png]]

VM 내부에서도,
![[Pasted image 20251111234028.png|600]]
IP 잘 할당되었고
![[Pasted image 20251111234046.png|500]]
gw까지 통신이 잘 되는 것을 볼 수 있음