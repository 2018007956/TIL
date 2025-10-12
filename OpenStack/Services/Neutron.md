OpenStack Neutron은 크게 **중앙 API/DB 계층**과 **분산된 데이터 Plane 에이전트**로 나뉨

1. **Controller Node (중앙 제어)**
    - `neutron-server` (API, DB와 연결)
    - 플러그인/드라이버(ML2, OVN, OVS 등) 로직 수행
    - 사용자가 CLI/Dashboard로 요청하면 이 서버가 DB에 반영하고 각 에이전트에게 전달
        
2. **Network Node (데이터 Plane, 서비스 기능 담당)**
    - 여기에도 Neutron 서비스가 돌아감, 다만 **에이전트 계층**임
    - 대표 컴포넌트:
        - `neutron-l3-agent` → 가상 라우터, NAT, Floating IP
        - `neutron-dhcp-agent` → DHCP 서버 기능
        - `neutron-metadata-agent` → VM metadata 서비스
        - `neutron-openvswitch-agent` 또는 `ovn-controller` → OVS/OVN 플로우 설정
            
3. **Compute Node**
    - 여기에도 `neutron-openvswitch-agent` 또는 `ovn-controller`가 동작
    - VM NIC을 OVS 브리지(`br-int`)에 붙이고, 패킷을 overlay 터널로 전달

---
- **Controller 노드** → 중앙 Neutron-server (API, DB 관리) = “Neutron의 두뇌”
- **Network 노드** → 여러 Neutron 에이전트 (L3, DHCP, Metadata) = “네트워크 데이터 Plane 담당” // 가상망을 외부망과 연결하고 L3/DHCP/Metadata 서비스를 제공하는 역할
- **Compute 노드** → nova-compute + Neutron OVS/OVN agent = “VM을 실행하고 네트워크에 붙이는 실행 Plane” // VM NIC을 가상망(overlay/provider)에 붙여주는 역할

## Neutron-OVN 구조
OVN은 내부적으로 두 개의 데이터베이스(NBDB, SBDB)를 통해 네트워크의 논리적 구성(Logical topology)과 실제 동작 상태(Runtime state)를 분리해서 관리한다.

|구분|역할|주체|데이터 성격|예시 명령어|
|---|---|---|---|---|
|**OVN Northbound DB (NBDB)**|상위 계층 — “무엇을 구성할지”|Neutron, 관리자|**논리적 구성 정보**|`ovn-nbctl show`, `ovn-nbctl list Logical_Switch`|
|**OVN Southbound DB (SBDB)**|하위 계층 — “어떻게 구현할지”|ovn-controller (각 호스트)|**실제 배포 및 상태 정보**|`ovn-sbctl show`, `ovn-sbctl list Chassis`|
### OVN Northbound DB (NBDB)
클라우드 관리 계층(Neutron, 사용자)이 OVN에게 전달하는 논리적 네트워크 모델을 저장하는 DB이다.

- **누가 쓰냐?**
  → OpenStack **Neutron ML2/OVN plugin**
- **무엇을 담냐?**
  → 사용자가 생성한 **논리 네트워크의 설계도**

“이런 네트워크를 만들고 싶다”는 **의도(Intent)** 를 표현한 데이터베이스이고,  
실제 패킷 플로우나 호스트 레벨의 세부 설정은 없다.

[주요 테이블과 데이터 예시]

| 테이블                   | 설명                                     | 예시 내용       |
| --------------------- | -------------------------------------- | ----------- |
| `Logical_Switch`      | Self-Service Network (Neutron Network) | 이름, 포트 목록   |
| `Logical_Switch_Port` | VM NIC, Router Interface               | MAC, IP, 상태 |
| `Logical_Router`      | Neutron Router                         | 연결된 네트워크 정보 |
| `Logical_Router_Port` | 라우터 인터페이스                              | IP/Subnet   |
| `ACL`                 | Security Group 규칙                      | 허용/차단 규칙    |
| `Load_Balancer`       | VIP, Pool 정보                           | LB 구성 데이터   |

📍**즉:**  
NBDB는 사용자가 만든 `network`, `subnet`, `router`, `port`, `security group` 등의 논리적 자원을 **OVN 내부 표현으로 저장**하는 DB이다.

### OVN Southbound DB (SBDB)
각 Compute/Network 노드의 ovn-controller 프로세스가 참조하고, NBDB에서 받은 논리 네트워크 구성을 실제 물리 호스트 환경에 맞게 매핑한 결과를 저장한다.

- **누가 쓰냐?**  
    → 각 노드의 **`ovn-controller`**
- **무엇을 담냐?**  
    → NBDB의 논리 구성을 기반으로 **호스트별로 실현된 상태 정보**

[주요 테이블과 데이터 예시]

|테이블|설명|예시 내용|
|---|---|---|
|`Chassis`|물리 호스트(Compute/Network Node) 정보|chassis name, hostname, encapsulation IP|
|`Encap`|Geneve, VXLAN encapsulation 정보|type, ip, port|
|`Port_Binding`|논리 포트가 실제 어떤 호스트에 매핑되었는지|VM 포트 → 특정 chassis|
|`MAC_Binding`|IP ↔ MAC 캐시 정보|플로우 학습 데이터|
|`Datapath_Binding`|논리 스위치/라우터의 내부 datapath 매핑||
|`Flow_Sample_Collector_Set`|모니터링 관련 정보 (optional)||

📍**즉:**  
SBDB는 “이 논리 네트워크가 실제 어떤 호스트에, 어떤 OVS 포트로, 어떤 터널을 통해 구현되어 있는지”를 **런타임 수준에서 추적**하는 DB이다.

### NB ↔ SB 관계 (데이터 흐름 구조)
```
+-----------------------+
|  OpenStack Neutron    |
|  (사용자 요청)         |
+----------+------------+
           |
           v
+-----------------------+
|  OVN Northbound DB    |
|  논리적 구성 정보 저장  |
+----------+------------+
           |
           v (ovn-northd 동기화)
+-----------------------+
|  OVN Southbound DB    |
|  실제 물리 매핑 정보    |
+----------+------------+
           |
           v
+--------------------------+
|  ovn-controller (각 노드) |
|  → OVS flow 생성          |
+--------------------------+
```
- `ovn-northd` 프로세스가 **NBDB → SBDB** 로 변환/전달 역할을 수행
- 각 `ovn-controller` 는 **SBDB → OVS** 로 실제 Open vSwitch 플로우를 구성


간단한 비유로 정리해보면,

|항목|비유|
|---|---|
|**NBDB**|“설계도” — 네트워크를 어떻게 만들지, 연결 관계와 정책|
|**SBDB**|“시공 계획서” — 각 노드가 실제로 어떤 장비(bridge, port, tunnel)를 만들지|
|**ovn-northd**|“건축 감독” — 설계도(NB)를 보고 시공 계획(SB)을 작성|
|**ovn-controller**|“현장 시공자” — 각 노드에서 실제로 Open vSwitch 설정 적용|

[NBDB vs. SBDB]

|구분|Northbound DB|Southbound DB|
|---|---|---|
|목적|논리적 네트워크 구성|물리 노드 매핑 및 런타임 상태|
|작성 주체|Neutron Server (API)|ovn-controller (각 노드)|
|변환 담당|ovn-northd|ovn-controller|
|주요 객체|Logical_Switch, Router, Port, ACL|Chassis, Encap, Port_Binding, Datapath|
|데이터 성격|선언적(Declarative)|실현적(Operational)|
|명령어|`ovn-nbctl show`|`ovn-sbctl show`|
|상태 예시|“네트워크를 이렇게 만들자”|“네트워크가 실제로 이렇게 배치됐다”|
