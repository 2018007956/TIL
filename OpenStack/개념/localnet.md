localnet은 OVN 내부에서 물리적인 네트워크(Provider Network)와 논리적인 네트워크를 연결하기 위한 엔드포인트이다.

OVN은 기본적으로 논리 스위치(Logical Switch)와 논리 포트(Logical Port)로 구성되지만, 실제 물리 NIC(예: eth0, br-ex, bond0 등)와는 직접 연결되지 않는다. 
이걸 연결해주는 매개체가 바로 localnet!

### 구조적으로 보면
`ovn-nbctl show`는 OVN의 논리적(가상) 네트워크 구조를 시각적으로 요약해주는 명령어인데, 
이 명령어로 OVN NB DB에 정의된 논리 스위치, 논리 라우터, 그리고 그에 연결된 포트들을 확인해보면,
![[Pasted image 20251017205642.png]]
- `type: localnet` → 이 포트가 물리 네트워크로의 연결을 의미
- `options: {network_name=provider (혹은 public)}` → 이게 Neutron에서 정의한 물리 네트워크 이름 (phynet2:physical_network)과 매칭됨

### Neutron 구성과의 연계
localnet은 Neutron 설정파일(`ml2_conf.ini`)의 [ovs] 섹션에서 지정하는 `bridge_mappings` 항목과 직접적으로 연결된다.
```
[ovs]
bridge_mappings = phynet2:br-ex
```
이 설정은 물리 네트워크 이름 `phynet2`을 실제 OVS 브리지 `br-ex`에 연결한다는 뜻

결국 Neutron에서 privider network를 생성할 때,
```
openstack network create --provider-network-type flat \
                         --provider-physical-network physnet1 \
                         provider
```
OVN 내부에서 자동으로 localnet 포트가 생기고, 
그게 `phynet2` → `br-ex`로 연결돼서
외부 네트워크(물리 NIC)와 논리 스위치(provider network)가 통신할 수 있게 됨

==`br-ex` ↔ `localnet` ↔ `provider` 네트워크 연결되어 외부 통신 가능==