노드에 ovs가 동작하는데 이게 ovn으로 설치된건지 ovs로 설치된건지 헷갈림
- ovs든 ovn이든 둘다 ovs를 사용하고,
- ovn은 추가적으로 ovn_controller가 더 사용된다

ovn 을 사용하면 ovs는 기본으로 사용된다
그러나 노드간 통신을 vxlan으로 하지 않고 geneve로 한다는 것

즉, 각 노드 내부는 ovs로 되어있지만,
노드끼리는 ovn으로 묶여있다고 생각하면 된다

그냥 ovs만 사용하는 환경에서는 각 노드간 ovs가 서로 vxlan으로 통신함

- (ovs - ovn) <-> (ovn - ovs)  이게 OVN환경 (ovn 컨테이너가 떠있음)
- (ovs) <-> (ovs)  이게 ovs환경
(괄호)는 오픈스택 노드