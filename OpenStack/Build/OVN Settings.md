✅ `ovn-remote`는 _DB 접속 주소_ - 실제 물리망 NIC IP
- ovn-controller가 SBDB에 접속해서  
    Chassis 등록, Port Binding, Logical Flow 수신 등을 한다
- DB 트래픽용
- **ovn-remote에 overlay NIC 주소 넣으면 섀시 등록이 안됨!**
✅ `ovn-encap-ip`는 _터널 데이터 트래픽 주소_ - Overlay NIC IP
- Geneve/GRE 같은 overlay 패킷이 오가는 곳
- 데이터 plane용