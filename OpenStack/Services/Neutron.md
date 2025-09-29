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