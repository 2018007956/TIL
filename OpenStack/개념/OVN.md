Open vSwitch (OVS)의 가상 네트워크 관리 기능을 확장한 솔루션으로, 복잡한 멀티-테넌트 환경에서 보다 세밀한 네트워크 정책을 제공한다. OVN은 OVS의 기본적인 L2, L3 스위칭 기능에 로드 밸런싱, ACL, NAT 등의 고급 기능을 제공하여, 가상 네트워크의 관리와 구성을 효율적으로 수행할 수 있도록 돕는다.

**Northbound**
주로 네트워크 가상화의 관리를 위한 API를 애플리케이션에 제공하는 역할을 한다. 이 인터페이스를 통해 사용자나 관리 시스템은 OVN 시스템에 논리 네트워크 구성을 명령할 수 있다. 예를 들어, 가상 네트워크, 스위치, 라우터의 생성 및 구성, ACL과 같은 요소들을 관리할 수 있다.

**Southbound**
OVN 컨트롤러에서 명령을 내렸을 때, OVS 스위치에 실제로 설정을 적용하는 역할을 한다. 또한 네트워크 상태를 실시간으로 모니터링 하여 최단 경로의 Flow로 통신하도록 경로를 최적화하고 장애 발생 시 트래픽을 다른 경로로 우회하는 등 성능 및 신뢰성 관련된 역할도 담당한다.

## OVN Architecture

![[Pasted image 20251005122230.png]]

## NorthBound 구성 요소
### OVN/CMS Plugin
CMS의 구성 요소로, OVN의 인터페이스 역할을 한다. OpenStack에서는 이 플러그인이 Neutron Plugin으로 구현된다. 플러그인의 주요 목적은 CMS 고유 형식의 Logical Network 구성을 OVN이 이해할 수 있는 중간 표현(Intermediate Representation)방식으로 변환하는 것이다.
### OVN Northbound Database
OVN/CMS Plugin에서 전달 받은 중간 표현 방식의 Logical Network 구성을 저장한다. 이 데이터베이스의 스키마는 CMS에서 사용하는 Logical Switch, Router, ACL 등의 개념을 OVN이 바로 해석할 수 있도록 설계되어 있다.
### ovn-northd
OVN NB DB와 OVN SB DB를 연결한다. NB DB에서 가져온 Logical Network 구성을 기존 Network 개념으로 변환하여 SB DB에 Logical Datapath Flows로 저장한다.

## SouthBound 구성 요소
### OVN Southbound Database
시스템의 중심 역할을 하는 데이터베이스로 ovn-northd와 각 ovn-controller가 클라이언트로 연결된다. 

OVN Southbound DB는 다음과 같은 세 가지 주요 데이터를 포함한다.
1. Physical Network (PN) Tables
   하이퍼바이저 및 다른 노드에 어떻게 접근하는지에 대한 방법을 정의한다. 이 테이블은 주로 하드웨어와 네트워크의 실제 물리적 연결과 관련된 정보를 담고 있다.
2. Logical Network (LN) Tables
   논리 데이터 경로 흐름(logical datapath flows)의 관점에서 논리 네트워크를 설명한다. 이는 가상화된 네트워크 환경에서 데이터가 어떻게 흐르는 지를 나타내며, 네트워크의 가상 측면에 대한 정보를 제공한
3. 다.
4. Binding Tables
   Logical Network의 각 구성 요소가 Physical Network의 어떤 위치에 연결되는지 매핑하는 역할을 한다.

Hypervisor는 PN 및 Binding 테이블을 채우는 반면, ovn-northd는 LN 테이블을 채우는 역할을 한다. 이는 각 구성 요소가 자신의 역할에 따라 필요한 데이터를 입력하고 관리하는 방식으로 작동한다.

## Hypervisor 구성 요소
### ovn-controller
각 Hypervisor 및 Gateway에 설치되는 OVN의 에이전트이다. 
Geneve(Generic Network Virtualization Encapsulation)라는 OVN의 기본 캡슐화 프로토콜을 통해, Hypervisor 간 논리적 네트워크 트래픽을 전달한다.

1. OVN Southbound Database에 연결하여 OVN의 구성 및 상태를 학습한다.
	- Hypervisor와 관련된 물리 네트워크 정보를 PN Table에 기록한다.
	- 현재 Hypervisor의 상태를 Binding Table의 Chassis 열에 기록하여, Logical Network와 Physical Network 간의 연결 상태를 반영한다.
2. Southbound의 ovs-vswitchd에 OpenFlow 컨트롤러로 연결되어 네트워크 트래픽을 제어한다.
	- OpenFlow 프로토콜을 통해 네트워크 트래픽을 제어하며, Logical Network의 트래픽 흐름이 Physical Network에서 올바르게 처리되도록 관리한다.
	- 로컬 ovsdb-server에 연결해 네트워크 설정 변경 사항을 동기화하고, OpenvSwitch가 OVN의 논리 네트워크 구성과 일치하도록 유지한다.



https://tech.osci.kr/kvm-ovn-setup/