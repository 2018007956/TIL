OVN 환경에서 단일 NIC로 작업을 하다가 [[localnet 포트 세팅 후 서버 전체 통신 끊김 현상 (OVS 재프로비저닝)]]이 발생했었다. 그래서 NIC를 분리해야겠다는 생각이 들었고, 알아보니 **OVN 환경에서 단일 NIC 한 장으로 모든걸 처리하기보다는, 관리망 NIC와 Provider/External NIC를 분리**하는 것을 권장한다고 한다. 더불어, 단일 NIC로 구성시에는 무조건 ovs로 구성해야 한다고 한다.

![[Pasted image 20251017121849.png|350]]

## NIC 분리 이유
- **관리망(SSH, API, DB, RPC)** 을 **데이터/외부망(Floating IP, Provider Network)** 과 물리적으로 분리하면,  `br-ex/br-public` 재구성·플로우 리프로그램 시에도 **관리 세션이 끊기지 않음**
- ARP/MAC 플립, LOCAL 경로 미설정 같은 **일시 단절 이슈를 관리망으로 전파하지 않음**
- 보안, 성능, 장애격리 측면에서 베스트 프랙티스

## 전체 망 구조
```
                [ToR 스위치]
          (A) access or (B) trunk
                 |                (관리망은 별도 스위치/VLAN 권장)
           +-----+-----+                 
           |  서버     |
           |           |
     (관리 NIC)  (외부/Provider NIC)
        eth0          eth1
         |             |
  [커널 IP 직접]   [OVS Bridge: br-public]
   mgmt IP/route       ├─ port: eth1   (물리 uplink)
                       ├─ port: patch-ex  (br-int와 패치)
                       └─ LOCAL/flows (OVN이 세팅)
```
- **eth0**: 관리망. OS가 직접 IP 보유(브리지 안 태움). Proxmox면 `vmbr0`가 이쪽에 물려도 됨
- **eth1 → br-public**: External/Provider 트래픽 전용
- **br-int**: 내부 논리 네트워크(터널/Geneve 측). `patch-int/patch-ex`로 `br-public`과 연결
(이름은 `br-ex`를 써도 되지만, **관리망과 혼동 피하려고 외부 전용 브리지를 `br-public`로 분리**하는 걸 추천)

![[Pasted image 20251102161321.png|600]]

## 분리 과정
우선, 친구한테 NIC 하나를 더 만들어달라고 요청했고, `enp6s19`가 생겼다.
![[Pasted image 20251102155527.png]]

### 1. 터널망 IP를 enp6s19에 부여
Controller / Compute / Network 노드의 netplan 파일에서 터널 전용 대역(10.1.201.0/24)을 enp6s19에 설정한다.
- Storage 노드는 Tenant 네트워크 트래픽 흐름에 직접 참여하지 않으므로 Tunnel Endpoint가 필요 없다.
```yaml
network:
	version: 2
	ethernets:
		enp6s19:
			dhcp4: false
			addresses: 10.1.201.<노드별>/24
```
![[Pasted image 20251102175238.png|300]]
- Geneve 터널망은 “L2 Segment” 개념 - **터널 NIC는 동일한 L2 범위 안에서 peer 노드들과 바로 통신하는 구조**
	- OVN/Neutron이 터널 엔드포인트 사이 트래픽을 직접 처리
	- OS 레벨 default gateway가 필요하지 않음

적용 : `sudo netplan apply`

필수 방화벽/라우팅 준비 :
```bash
# Geneve(UDP/6081) 허용
sudo iptables -I INPUT -p udp --dport 6081 -j ACCEPT
sudo iptables -I OUTPUT -p udp --sport 6081 -j ACCEPT

# 역방향 경로검사 비활성화(터널망에서 흔히 필요)
echo 0 | sudo tee /proc/sys/net/ipv4/conf/enp6s19/rp_filter
```

MTU 확인 :
- Geneve 오버헤드 ≈ **38B**
- 물리망 MTU가 1500이면 Tenant MTU는 **~1460대**가 안전
- 가능하면 **물리망 MTU 1600** 권장 (Jumbo frame)

[물리망 MTU 확인]
- NIC MTU
```bash
ip link show enp6s18
ip link show enp6s19
```
- Open vSwitch 브리지 MTU
```
ip link show br-int
ip link show br-ex
```

[OVN / Neutron Tenant MTU 확인]
- Neutron 네트워크 MTU
```bash
openstack network list --long
```
	특정 네트워크 : openstack network show <network-id> | grep mtu

![[Pasted image 20251102180346.png]]

- OVN 내부 포트 MTU
```bash
ovn-nbctl list logical_switch_port | grep -E "name|mtu"
```

[OVS가 자동 MTU 조정했는지 확인)
- OVS Geneve 포트 확인 : 출력 예) 1450
  ovn-controller가 물리 MTU를 보고 내부 포트 MTU를 자동으로 낮추는지 체크
```bash
ovs-vsctl show | grep geneve -A3
또는
ovs-vsctl get Interface geneve-0 mtu_request
```

[인스턴스 간 MTU 테스트]
테넌트 VM에서 : `ping -M do -s 1422 <다른 VM IP>`
- 성공 시 정상
- 실패 시 테넌트 MTU를 1450 또는 그 이하로 강제 설정 : `ip link set dev eth0 mtu 1450`

### 2. OVN/OVS에 Geneve 인캡 IP를 enp6s19로 지정
Controller / Compute / Network 노드에서 `ovn-encap-ip`를 enp6s19의 IP로 지정한다. 이미 ML2/OVN 환경이 동작 중이라면 `ovn-remote` 등 기존 값은 유지하고 encap 관련 키만 바꾼다.
```bash
TUN_IP=$(ip -4 addr show enp6s19 | awk '/inet /{print $2}' | cut -d/ -f1)

sudo ovs-vsctl set open_vswitch . \
  external-ids:ovn-encap-type=geneve \
  external-ids:ovn-encap-ip=${TUN_IP}
```
(필요 시 시스템 식별자 고정)
```bash
sudo ovs-vsctl set open_vswitch . external-ids:system-id=$(hostname -s)
```
서비스 재시작 :
```
sudo systemctl restart ovn-controller
sudo systemctl restart openvswitch-switch
```

### 3. Provider/External 네트워크 (이미 설정된 부분)
Self-service(오버레이)만 쓸 계획이면 위 1–2단계로 충분하다. 외부망(Provider/External)을 함께 쓴다면 **provider uplink** 노드(보통 Network 노드)에서만 bridge mapping을 구성한다.
```bash
# 예: physnet1 ↔ br-ex, br-ex는 외부 NIC에 바인드
sudo ovs-vsctl add-br br-ex
sudo ovs-vsctl add-port br-ex <외부 uplink NIC>
sudo ovs-vsctl set open_vswitch . external-ids:ovn-bridge-mappings=physnet:br-ex
```

### 4. 동작 확인
각 노드에서 다음 명령어 확인
```bash
# SBDB에 등록된 Encapsulation 정보(Geneve/IP) 확인
ovn-sbctl --columns chassis,ip,type list encap

# Chassis에 encap ip/type가 보이는지 확인
ovn-sbctl show | sed -n '/Chassis/,/Chassis/p' | grep -E 'hostname|encap'

# Geneve 소켓(UDP/6081) 확인
ss -ulpn | grep 6081

# 실제 Geneve 패킷 관찰
sudo tcpdump -ni enp6s19 udp port 6081 -vv
```
출력에서 각 노드의 `encap type: geneve`, `ip: 10.1.121.x`가 보이면 enp6s19를 통한 Geneve 터널이 정상 바인딩된 것

![[Pasted image 20251102181822.png]]