**문제 상황**
[Controller]
![[Pasted image 20251007135631.png|400]]
os-network와 os-compute 모두 Southbound DB에 Chassis로 등록되어 있고,
이는 두 노드가 Geneve 터널 엔드포인트로 설정된 상태라는 뜻이다.

[Compute]
![[Pasted image 20251007083009.png]]
[Network]
![[Pasted image 20251007083030.png|600]]
네트워크 노드에 GENEVE 터널 포트가 안 보이는 상황. 
컴퓨트에는 `Interface ovn-... type: geneve`가 보이는데, 네트워크 노드 덤프에는 geneve 포트가 없다. 즉, **컴퓨트↔네트워크 간 오버레이 터널이 성립하지 않음.** OVN의 기본 터널은 UDP 6081(GENEVE)이고, 각 섀시에 `ovn-encap-type/ip`가 바르게 설정되어야 ovn-controller가 `ovn-xxxx` 터널 인터페이스를 자동 생성한다. 터널이 없으면 라우터/SNAT가 있는 게이트웨이(네트워크 노드)로 트래픽이 못 간다.

컴퓨트 노드로 ping을 했을 땐 잘 되는데? 라고 한다면,
“네트워크 노드 → 컴퓨트 노드”로 핑을 날릴 때 타는 경로는 **언더레이(물리/관리망)** 이고, VM 트래픽이 필요로 하는 경로는 **오버레이(GENEVE 6081/UDP)** 이다. 네트워크 노드에 GENEVE 포트가 아직 없어도 언더레이 L3는 멀쩡하니 호스트↔호스트 핑은 잘 된다. 반면 **VM↔게이트웨이/외부**는 오버레이가 필요해서 막힌다. OVN 구조가 “컨트롤 플레인(NB 6641/SB 6642) + 데이터 플레인(GENEVE 6081)”로 분리돼 있기 때문이다.

| 노드             | 역할                             | Geneve 여부 |
| -------------- | ------------------------------ | --------- |
| **Controller** | OVN DB, northd, Neutron API 담당 | ❌ 필요 없음   |
| **Network**    | 게이트웨이 역할, OVN Controller 작동    | ✅ 필요함     |
| **Compute**    | 인스턴스가 실제 동작, OVN Controller 작동 | ✅ 필요함     |
| **Storage**    | Cinder, Swift, Ceph 등 담당       | ❌ 필요 없음   |

==네트워크 노드에 geneve 터널망 구축해서, 6081 포트를 리슨해야 함==

**체크리스트**
- `ovn-appctl -t ovn-controller connection-status` → **connected**
- `ovs-vsctl show`
    - 양쪽 모두 `Interface ovn-XXXX type: geneve` 가 생겼는지
    - compute <-> network 서로의 IP가 `remote_ip=` 로 보이는지
- `ss -lun | grep 6081` → 각 노드에서 6081 수신 확인(방화벽 열려 있어야 함)
- `ovn-sbctl list Chassis | grep hostname` → 두 노드가 모두 섀시로 등록되는지
- (provider 망이면) `ovs-vsctl get open . external-ids:ovn-bridge-mappings` 값이 Neutron의 physical_network 이름과 일치하는지
    
설정은 다 위와같이 잘 되어있는데, 6081 포트가 리스닝 되지 않는 상황

**문제 분석**
OVS가 Geneve 포트를 만들며 남긴 로그 확인
```
grep -i geneve /var/log/openvswitch/ovs-vswitchd.log | tail -n 50
grep -Ei 'udp|netlink|failed|error' /var/log/openvswitch/ovs-vswitchd.log | tail -n 50
```
![[Pasted image 20251007154721.png]]
**“connection dropped (Protocol error)” / “version negotiation failed (we support versions 0x01, 0x04, 0x05, peer supports version 0x06)”** 메시지는  
OVS-OVN 간 **Geneve 프로토콜 버전 불일치(= OVS/OVN 패키지 버전 불일치)** 로 인한 현상이다

“peer supports version 0x06” 라는 건, **상대 노드(즉 컴퓨트 노드)** 의 OVS 가 Geneve v0x06 포맷을 사용 중인데, **이 네트워크 노드의 OVS 는 구버전(0x01, 0x04, 0x05까지만 지원)** 이라는 뜻

즉, **OVS 버전 mismatch** 로 인해 Geneve handshake 자체가 실패하고 있어서  
포트는 존재하더라도 6081 리슨이 비정상적으로 종료되는 상황

**문제 원인 : OpenFlow Version negotiation failed**
`ovn-controller`(OF 1.5 사용) ↔ `ovs-vswitchd`/`br-int`(OF 1.0/1.3/1.4까지만 허용) 사이에 **OpenFlow 1.5가 막혀** 협상이 깨지고, 그 뒤 파이프라인/터널 생성이 진행되지 않는 상태
=> 네트워크 노드 쪽 브리지/모듈이 OpenFlow 1.5를 처리 못 해서 협상이 깨짐
- `0x01,0x04,0x05` = OpenFlow 1.0, 1.3, 1.4
- `0x06` = OpenFlow 1.5

**해결 방법**
`br-int`(필요하면 `br-ex`도)에서 **OpenFlow 1.5까지 허용**을 명시:
```
ovs-vsctl set bridge br-int protocols=OpenFlow10,OpenFlow11,OpenFlow12,OpenFlow13,OpenFlow14,OpenFlow15
ovs-vsctl set bridge br-ex  protocols=OpenFlow10,OpenFlow11,OpenFlow12,OpenFlow13,OpenFlow14,OpenFlow15
```
위와 같은 방식으로 버전 지정해줬더니, ovs-vsctl show에 geneve 연결됨
![[Pasted image 20251007154323.png]]

터널/리스닝 확인:
![[Pasted image 20251007154512.png|650]]

**==Geneve 터널이 열렸기 때문에 게이트웨이가 살아나고,**
**OVN overlay 터널 문제가 해결됨!**==

**public → 192.168.50.130, test01 → 10.1.201.1** 핑 성공
![[Pasted image 20251007160727.png|400]]
![[Pasted image 20251007163827.png|400]]
