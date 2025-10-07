OpenStack OVN에서 Geneve 터널은 데이터 경로 노드들 간(즉, ovn-controller가 작동하는 노드들 간) 자동으로 설정된다. 즉, 모든 Compute 노드 + 네트워크 노드(게이트웨이 역할)는 Geneve encapsulation을 통해 서로 연결돼야 정상이다.

즉, Geneve는 ovn-controller 간의 통신망이다.
- geneve는 ovn에서만 지원함
- ovs는 vxlan으로 구성