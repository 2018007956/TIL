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

---
## 네트워크 드라이버
네트워크 드라이버는 OpenStack Neutron에서 네트워크를 어떻게 만들고 연결할지 정의하는 플러그인이다. 쉽게 말하면 **OpenStack 네트워크의 동작 방식을 결정하는 엔진**이라고 보면 된다.

OpenStack은 ML2라는 네트워크 프레임워크에서 여러 종류의 **Mechanism Driver**를 지원한다.

|네트워크 드라이버|설명|예|
|---|---|---|
|**ML2/OVS**|기존 방식, OVS 스위치를 사용하는 네트워크 드라이버|VXLAN 기반 Overlay|
|**ML2/OVN**|최신 방식, OVN 컨트롤러 기반 분산 네트워크 모델|Geneve 기반 Overlay|
|Linux Bridge|단순 브릿지 방식|테스트 환경 위주|
