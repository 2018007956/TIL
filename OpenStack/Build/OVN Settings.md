✅ `ovn-remote`는 _DB 접속 주소_ - 실제 물리망 NIC IP
- ovn-controller가 SBDB에 접속해서  
    Chassis 등록, Port Binding, Logical Flow 수신 등을 한다
- DB 트래픽용
- **ovn-remote에 overlay NIC 주소 넣으면 섀시 등록이 안됨!**
✅ `ovn-encap-ip`는 _터널 데이터 트래픽 주소_ - Overlay NIC IP
- Geneve/GRE 같은 overlay 패킷이 오가는 곳
- 데이터 plane용

---
[Controller]
![[Pasted image 20251112001742.png]]
```
hostname=os-controller, 
ovn-bridge=br-int, 
ovn-bridge-mappings="phynet2:br-ex", 
ovn-encap-ip="10.1.201.121", 
ovn-encap-type=geneve, 
ovn-remote="tcp:192.168.50.121:6642", 
rundir="/var/run/openvswitch", 
system-id="032595fe-f8f6-451a-8585-a00624e2f94e"
```

[Compute]
![[Pasted image 20251112001816.png]]
```
hostname=os-compute, 
ovn-bridge-mappings="physnet2:br-ex", 
ovn-encap-ip="10.1.201.122", 
ovn-encap-type=geneve, 
ovn-remote="tcp:192.168.50.121:6642", 
rundir="/var/run/openvswitch", 
system-id="3366425f-66c3-4b34-b5d3-dac085c6ee83"
```

[Network]
![[Pasted image 20251112001842.png]]
```
hostname=os-network,
ovn-bridge-mappings="phynet2:br-ex", 
ovn-cms-options=enable-chassis-as-gw, 
ovn-encap-ip="10.1.201.124", 
ovn-encap-type=geneve, 
ovn-remote="tcp:192.168.50.121:6642", 
ovn-remote-probe-interval="60000", 
rundir="/var/run/openvswitch", 
system-id="91a73adf-b2b0-4ef3-9706-d77e01c719b8"
```

[Storage]
![[Pasted image 20251112001919.png]]
크게 세팅 없음