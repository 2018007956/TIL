**예상 원인**
1) provnet-* 포트
	네트워크 노드에는 있는데, 컴퓨트 노드에는 없음 -> 정상
2) 컴퓨트 노드에 geneve 포트가 생성되지 않아, compute → network 노드로 Geneve 터널로 이동을 못하는 상황
	![[Pasted image 20251110221638.png|300]]
	-> `systemctl restart openvswitch-switch ovn-controller` 하니까 다시 geneve 터널 생성됐는데, 그래도 인스턴스 통신 불가
3) 인스턴스 내부에서 `ip a`를 해보니 eth0에 ipv4 주소가 없음![[Pasted image 20251110224818.png]]
   - `lo` : loopback interface 자기 자신으로 연결되는 인터페이스
     내부 프로세스 간 통신용
     DB, API 서버, 로컬 애플리케이션들이 서로 통신할 떄 사용   
   - `eth0` : VM이 외부망과 연결되는 가상 NIC

=> 3번 문제 자세히 분석해보면,

인스턴스에 연결된 포트 확인: 존재X
![[Pasted image 20251110225241.png]]

> **SB DB에 port_binding이 없어서 IPv4가 안 뜨는 상황**

OVN의 동작 경로는 다음 순서로 흘러가는데,
1. Neutron이 포트를 생성한다.    
2. OVN NB DB(논리 구조)에 로직이 추가된다.
3. ovn-northd가 이를 OVN SB DB(실제 배치 지시사항)로 내려보낸다.
4. SB DB의 port_binding 엔트리가 특정 chassis(compute)로 매핑된다.
5. 해당 chassis(즉, compute)의 ovn-controller가 br-int에 플로우를 설치하고 VIF를 붙인다.
6. 그 이후 DHCP/ARP가 정상적으로 흘러간다.
**지금 VM은 3번에서 멈춰있음**  
OVN SB에 포트가 존재하지 않으니, 4~6번은 절대 진행될 수 없고,
결과 = VM은 DHCP도 못 받고, overlay도 못 타고, IP도 없음.

**해결 방법**
VM 생성 → `Neutron 포트 생성 → NBDB port 생성 → SBDB binding 생성`
순서를 다시 수행하기 위해, 인스턴스 삭제 후 재생성
## 인스턴스 생성 실패 에러
![[Pasted image 20251110231855.png]]
openstack server show test02 해보면, 에러 로그 나오는데
`No valid host was found` = Nova 스케줄러가 **요청 조건을 만족하는 컴퓨트 호스트를 한 대도 못 찾았다**고 함

VM 마이그레이션하면서 디스크 용량 줄었는데, 그 문제일 것이라 추측
=> 컴퓨트 노드 용량 증설 필요

|노드|디스크 부족 시 영향|
|---|---|
|**Compute 노드**|✅ VM 생성 불가 (**지금 문제**)|
|Controller 노드|로그/DB/이미지 문제 발생은 가능하지만 VM 스케줄링 실패와 직접 영향 없음|
|Storage 노드|Cinder volume attach 실패 가능하지만 “NoValidHost” 문제는 아님|

다른 인스턴스(test01, test03) 삭제 후 test02 생성하니까 Build되다가 또 에러뜸
✅ 디스크 충분
- df -h를하면, `/dev/sda2` 전체 125G 중 **110G free → 아주 넉넉**  
- `/var/lib/nova/instances`도:
    - `_base` : 22M (cirros 이미지 캐시)
    - `compute_nodes` : 4K
    - `locks` : 4K  
        → **VM 디스크 찌꺼기 없음**
✅ 메모리도 충분
- `free -h`:
	- total 3.8G
	- available 2.7G
	VM 하나(cirros)는 128MB~512MB만 있어도 충분하므로 메모리 부족 가능성도 0%.

VM 빌드 실패의 원인은 "디스크"도 "메모리"도 아니다.  
실제 실패 지점은 **네트워크(VIF plug)** 또는 **OVN 포트 바인딩 실패**일 확률이 높다

nova-compute 로그를 확인해보면:
![[Pasted image 20251110233429.png]]

==**원인 : OVN 포트 바인딩 실패 때문에 VM 빌드가 중단됨**==
Nova-compute는 인스턴스를 만들 때 **반드시 네트워크 포트를 Hypervisor(OVS/OVN)에 ‘VIF plug’** 해야 하는데  
이 단계에서 실패하면 VM 생성은 즉시 중단됨


여러번 테스트 해보니, 볼륨 생성/로컬 생성 상관없이 
selfservice net에는 생성되는데 인스턴스 하나까지만 생성됨 (-> 용량 문제일 것으로 추측)
![[Pasted image 20251111165603.png]]
근데 public-network에 생성하면 하나도 생성이 안됨

selfservice망과 public-network망은 서로 포트 바인딩 방식이 다름

|네트워크|VM이 실행되는 노드|포트 바인딩 방식|
|---|---|---|
|**SelfService (Overlay)**|✅ Compute|geneve 포트 필요, br-int 포트 생성|
|**Public (Provider)**|✅ Compute|localnet 포트 필요, br-ex 매핑 필요|

=> 지금은 Public Network에서 Compute 노드가 localnet 포트 바인딩을 못하는 상황
**Public-network은 Provider Network(Localnet)라서 ‘Compute 노드의 br-ex 포트 바인딩’이 필수**

Compute 노드에서, br-ex가 실제로 OVN localnet 포트를 가지고 있는지 확인해보면,
![[Pasted image 20251111170700.png]]

**==원인)❗ Missing: localnet 포트가 없음==**
Provider(public-network)를 위해 필요한 OVN localnet 포트가 보여야 하는데  
지금 br-ex에는 물리 NIC / br-ex 내부포트만 있다.

>일반적인 구성에서는 Compute 노드에 `localnet` 포트가 없음. 
인스턴스 NIC는 `br-int` (논리 스위치)에 붙고, provider 쪽 실제 외부 브리지(`br-ex`)와의 물리 연결은 **게이트웨이 섀시(보통 네트워크 노드)** 가 담당한다. 그래서 **Compute에 `provnet-*`(localnet) 포트가 없음**

But, **인스턴스를 provider 네트워크에 “직접” 붙이고 싶다면**, 그 인스턴스가 올라가는 **Compute에도 해당 physnet 매핑(예: `phynet2:br-ex`)이 있어야** 한다. 그렇게 설정하면 그 Compute에도 **`provnet-*` localnet 포트가 생길 수** 있고, provider 포트 바인딩이 성공한다.

- **Self-Service만 쓸 때:** Compute에 localnet 불필요(없어도 정상).
- **Provider 직결 인스턴스가 필요할 때:** 인스턴스가 배치될 **모든 Compute**에 동일한 **`ovn-bridge-mappings`** 을 구성해야 함.

==-> public-network에는 VM 생성하지 않고, selfservice 망에만 생성하기로 결정!!==


