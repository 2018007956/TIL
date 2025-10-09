**문제 상황**
게이트웨이 섀시, lrp, lsp 등 무언갈 만지다가 잘되던 [public network ↔ VM] 통신 끊김

**상태 분석**
끊기는 구간을 찾기 위한 패킷 흐름 캡처
![[Pasted image 20251009154831.png]]
- br-ex에서는 ARP 요청이 보이는데 br-int에서는 전혀 트래픽이 안 잡힘
- 외부망으로 들어온 프레임이 br-ex에서 끊기고 br-int로 전달되지 않고 있음
- **OVN이 br-ex ↔ br-int 사이에 만들어야 할 “provnet/patch” 포트 쌍이 존재하지 않거나 비정상 상태**
(근데 위 사진에서 보이는 50.145가 어떤 장치인지 모르겠음 → 망에 br-ex랑 icmp 도는거 있는지 확인하는 명령어인데, 145는 수원이 집에 고양이 본다고 설치한 cctv 주소라고함 ;0;)

[패킷 흐름도]
```
[ 외부 L2 네트워크 192.168.50.0/24 ]
      ↓
  (스위치)
      ↓
   enp6s18 (phys)
      ↓
    br-ex (IP: 192.168.50.122)      ✔ ARP 보임  
      ↓ (X) patch-provnet
    br-int                          ✖ 패킷 없음
      ↓
   tap-VM(test02: 192.168.50.185)
```

**추측 원인 : patch/localnet 미생성**
1. patch 쌍이 정상인지 확인
![[Pasted image 20251009160858.png]]
- 기대값: `type=patch`, `options:peer=<상대이름>`, `admin_state=up`, `ofport >= 1`
- 상태 : OK

2. physnet 키 일치 확인
![[Pasted image 20251009161036.png]]
- 상태 : OK

3. OVN NB에 localnet 포트 존재 여부 확인
	- provider 논리 스위치 이름
		![[Pasted image 20251009161205.png]]
		- 출력 : `논리 스위치 UUID (네트워크 이름)`
		- 논리 스위치 UUID : OVN 내부의 Logical Switch 객체 ID
		- Neutron 네트워크 이름 : OpenStack의 네트워크 ID(UUID)에 `neutron-` prefix를 붙인 것
	  (아래와 같이 네트워크 구분할 수 있음)	  ![[Pasted image 20251009161359.png]]
	- 네트워크의 포트를 확인해보면![[Pasted image 20251009161610.png]]
	  아무 출력도 안뜸
	  각 네트워크(논리 스위치)안에 type=localnet 포트가 존재하지 않는다는 뜻
		- `localnet` 포트가 있으면 - → 그 네트워크는 **provider network (flat/vlan)**
	    - `router`나 `dhcp` 관련 포트만 있으면 → **self-service network**
	=> `lsp-list`가 비어 있으니 localnet 포트가 사라진 상태이고, 그래서 tcpdump에서 본 것처럼 br-ex까지만 ARP가 보이고 br-int로 못 넘어가는 상황

**해결 과정 : OVN에서 localnet 포트 재생성**
1. provider 네트워크가 연결된 LS 이름 지정
   `LS_NAME="neutron-<provider-네트워크-UUID>"`
   `PHYSNET="phynet2"`

2. 기존 잔여(있다면) 정리 후 localnet 포트 생성
   ```
   # 혹시 같은 이름이 남아 있다면 제거(없으면 무시됨)
   ovn-nbctl --if-exists lsp-del ln-${PHYSNET}
   
   # localnet 포트 새로 추가
   ovn-nbctl lsp-add ${LS_NAME} ln-${PHYSNET}
   ovn-nbctl lsp-set-type ln-${PHYSNET} localnet
   ovn-nbctl lsp-set-options ln-${PHYSNET} network_name=${PHYSNET}
   ovn-nbctl lsp-set-addresses ln-${PHYSNET} "unknown"
   ```
![[Pasted image 20251009162909.png]]
이까지 컨트롤러에서 해줬더니 랙걸리고 조금 뒤 종료됨 // proxmox 연결 끊기고 다른 노드도 다 종료됨 // 서버에 문제 생긴건가??
![[Pasted image 20251009163400.png|400]]

3. compute(=test02가 떠 있는 호스트)에서 patch 생성 확인
   (수 초~수십 초 내 생성됨. 느리면 compute에서 컨트롤러만 재시작)
```
# 필요 시
systemctl restart ovn-controller

# 생성 검증
ovs-vsctl list-ports br-int | egrep 'provnet|patch'
ovs-vsctl list-ports br-ex  | egrep 'provnet|patch'
ovs-vsctl list interface <각 patch명> | egrep 'name|type|options|ofport|link_state'
# 기대: type=patch, options:peer=짝이름, ofport>=1, link_state=up
```

4. 통신 재검증
```
# compute에서
tcpdump -eni br-int arp or icmp
# 외부 호스트에서 test02(192.168.50.185)로 ping
```
이제는 `br-ex`에서 보이던 ARP가 `br-int`에도 보여야 하고, VM까지 ARP 응답/ICMP가 왕복돼야 정상

**문제 원인 정리**
- lsp/lrp를 다루는 과정에서 provider LS의 localnet 포트를 삭제했을 가능성
- localnet 포트가 없으면 ovn-controller는 각 섀시에서 patch-provnet을 만들 근거가 없어지고, 결과적으로 **br-ex↔br-int 통로가 끊김**
