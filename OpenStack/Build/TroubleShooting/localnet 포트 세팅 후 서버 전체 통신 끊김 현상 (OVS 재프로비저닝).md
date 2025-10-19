**문제 상황**
[[(해결중) public network의 VM 통신 불가 문제 2]]를 해결하는 과정에서 [[localnet]] 포트 생성하게 되었는데, 다음 명령어를 입력한 직후 노드에 랙이 걸렸고 조금 뒤 세션이 끊겼다. 그리고 나중에는 다른 노드도 모두 세션이 끊겼고, proxmox에 접속 자체가 안되는 상황이 발생했다.
```
LS_NAME="neutron-<provider-network-UUID>"
PHYSNET="phynet2"

ovn-nbctl lsp-add ${LS_NAME} ln-${PHYSNET}
ovn-nbctl lsp-set-type ln-${PHYSNET} localnet
ovn-nbctl lsp-set-options ln-${PHYSNET} network_name=${PHYSNET}
ovn-nbctl lsp-set-addresses ln-${PHYSNET} "unknown"
```

**해결 방법**
서버에 접근할 수 없어서 상황 분석을 할 수 없었기에, 아래와 같은 재부팅 과정을 거쳤다
1. **LAN 케이블 재연결**
2. **노드 재부팅**

==재부팅 후 플로우/캐시/링크 순서가 새로 정리되면서 해결됨==
아래 과정에서 통신이 정상화될 수 있었다고 한다.
1. **OVS OpenFlow 테이블 재생성**
    - `br-int`, `br-ex`의 플로우가 깨져 있었던 게, `ovn-controller`가 부팅 시 NB/SB를 읽고 다시 깔면서 정상화
2. **OVS–OVN 매핑 재적용**
    - `external_ids: ovn-bridge-mappings` 등 OVS 설정을 `ovn-controller`가 다시 읽어 반영
3. **링크/포트 up/down 순서 안정화
    - `br-ex`–`enp6s18`–`patch-…`가 부팅 타이밍에 올바른 순서로 올라오며 L2 경로가 정상화
4. **ARP/NDP, MAC 학습 테이블, 커널 라우팅 캐시 리셋**
    - 상단 스위치/호스트의 캐시가 초기화되어, MAC flip/ARP 엇갈림 상태가 해소
5. **브리지 MAC 재설정 영향 해소**
    - 브리지 MAC이 고정돼 있지 않으면 포트 증감 시 바뀔 수 있는데, 재부팅으로 일관된 MAC로 잡히며 정상화

그리고 이후에 compute 노드가 ssh 연결이 안되는 문제가 있었는데, 
`ovn-nbctl lsp-del ln-phynet2`를 해주고 재부팅 해주니 살아남


**문제 원인 : OVS 재프로비저닝**
`localnet` 포트를 추가하면서 OVN이 `br-ex`의 플로우를 다시 구성하는 순간  
커널이 `br-ex`를 통한 관리 트래픽을 잠시 처리하지 못하게 되어  
다음과 같은 현상이 발생한다.

1. **OVN 구성 재적용** 
   `ovn-nbctl lsp-add … type=localnet` 명령을 통해 새 Localnet 포트를 추가하면, OVN Controller는 해당 물리 네트워크(`physnet2`)와 매핑된 브리지(`br-ex`)를 다시 동기화한다.
   이 과정에서 `br-ex`의 OpenFlow 규칙과 `provnet-` 포트가 재생성되어, 
   `enp6s18 ↔ OVN ↔ Logical Switch` 구조가 재적용된다
2. **네트워크 경로 재구성에 따른 관리 트래픽 단절**
   OVS가 `br-ex`를 재구성하는 동안, `br-ex`를 통해 오가던 관리 트래픽(SSH, Web UI 등)의 커널 네트워크 경로가 일시적으로 차단된다. 
   이는 `br-ex` 내부의 `LOCAL` 플로우와 포트 상태가 재설정되는 짧은 구간 동안 발생하며, 
   호스트(또는 Proxmox)가 `br-ex` 또는 `enp6s18`과 연결되어 있다면, 관리 인터페이스가 일시적으로 down 상태로 전환되어 콘솔/웹 UI 모두 접근이 불가해진다.
3. **관리 인터페이스와 세션 영향**
   관리 인터페이스가 `br-ex`를 통해 구성되어 있을 경우,
	- 커널이 `br-ex`의 IP를 잠시 잃으면서 관리 IP가 유효하지 않게 되고
	- SSH, Proxmox Web UI, VM 네트워크가 모두 끊기게 된다.
	이 현상은 `br-ex`가 다시 활성화되며 OpenFlow가 재적용되는 동안 **일시적인 down/up**이 발생한 결과이다. 이후 OVS가 `LOCAL` 경로를 다시 세팅하면 복구되지만, 세션은 이미 끊겼다.
4. **상태 복구**
   `OVS`가 `br-ex`의 `LOCAL` 경로와 플로우 테이블을 재구성한 뒤  
	`br-ex` 인터페이스가 다시 `UP` 상태로 전환되면,  
	관리 IP는 정상적으로 복구되고 통신이 다시 가능해진다.  
	하지만 세션(SSH, Web UI)은 이미 끊긴 상태이므로 재접속이 필요하다.

- OVN Controller가 br-ex를 재프로비저닝하며 커널 네트워크 스택이 그 동안 데이터를 처리하지 못했기 때문에 끊긴 것
- 즉, 물리 구조 변화는 없지만, 논리적 흐름(OVS Flow Table)이 재적용되며 일시적으로 관리망이 다운됨


이후 localnet 제거하고나서야 ssh 정상 동작했던 이유는,
`ln-phynet2` 포트를 삭제하면서 `br-ex`에 걸려 있던 잘못된 데이터 플레인 연결이 끊겨서, 컴퓨트 노드의 네트워크 루트(route)와 인터페이스 상태가 정상으로 돌아온 것

[동작 흐름]
`ln-phynet2` 존재 → OVN이 컴퓨트 노드를 provider 네트워크 노드처럼 취급  
→ `br-ex`와 OVN 사이 트래픽 연결 시작  
→ 관리망 라우팅이 `br-ex`를 통해 OVN datapath로 빨려들어감  
→ 관리망 세션(SSH, 컨트롤러 연결 등) 끊김  
→ `lsp-del ln-phynet2` 후 OVN이 br-ex를 더 이상 잡아먹지 않음  
→ 컴퓨트는 원래의 관리 네트워크 경로 복구  
→ SSH 정상 동작

### 다른 노드까지 같이 다운된 이유
OVN의 `localnet`은 provider network와 물리망을 직접 연결한다.
하나의 노드에서 localnet을 잘못 재생성하면 OVN NB/SB DB에 반영되고, 
`ovn-controller`가 이를 모든 chassis에 동기화한다.

즉, Controller에서 생성한 `ln-phynet2` 포트가 DB에 반영되자마자 
Network/Compute 노드의 `ovn-controller`도 이를 반영하려 하며,
기존 포트와 충돌 → 각 노드의 `br-ex` 재설정 → 전체 통신 drop

> 소프트웨어적으로는 **distributed switch topology**가 순간적으로 끊긴 것이며,
> 물리적으로는 **관리 NIC가 down되어 SSH 연결이 모두 끊긴 것**이다.
> 즉 서버 자체의 하드웨어가 꺼진 것은 아니지만, 모든 네트워크 경로가 단절되어 다운된 것 처럼 보인 것

⭐ 이 과정에서 알게된 점
==OpenStack OVN은 중앙 DB(Northbound/Southbound)를 통해 네트워크 구성을 모든 노드에 실시간으로 전파한다.==

즉, Controller에서 `lsp-add`를 수행했을 때, 
그 정보가 즉시 SB DB에 기록되고 각 노드의 `ovn-controller`가 다음을 시도한다:
- "새 localnet 포트가 생겼네? 나도 해당 브릿지와포트를 재구성해야겠다."
- 이 과정에서 각 노드의 `provider bridge (br-ex)`가 재시작됨
- 결과적으로 Compute/Network 노드도 **네트워크 경로 단절**

결국 “모든 노드가 동시에 통신 불가” = OVN DB로 전달된 설정이  
각 노드의 물리 브릿지 재설정으로 이어진 것이다.

### 개선 방안
현재는 `/etc/neutron/plugins/ml2/openvswitch_agent.ini`에 아래처럼 되어있음
```
[ovs]
bridge_mappings = physnet2:br-ex
```
`br-ex`가 **enp6s18 (관리 NIC)** 를 포함하고 있었던 경우.

즉, SSH로 접속하던 관리 트래픽이 오가던 인터페이스가  
`br-ex`로 흡수되어, OVS의 openflow 플로우에 따라 제어되면서  
커널 레벨의 IP 스택이 먹통이 되는 것.

그 순간 `ovn-nbctl`이 NB DB에 새 `localnet` 포트를 등록하자마자  
OVS/OVN 컨트롤러가 그걸 반영하고  
“enp6s18 ↔ br-ex ↔ ovn-controller”로 구조가 바뀌어  
L2 통신이 일시적으로 끊김

즉, localnet 명령 자체가 서버를 끊은 게 아니라,  
그게 반영되는 순간 OVS가 브리지 포트를 재설정하면서  
**eth0의 L2 경로가 변경되어 관리 네트워크가 단절된 것이다**

따라서 이를 개선하려면, 아래처럼 구성해야 한다
```
[ovs]
bridge_mappings = physnet1:br-ex,physnet2:br-public
```

```
ovs-vsctl show
Bridge br-ex     --> uplink: eth1 (데이터용)
Bridge br-int    --> 내부 통신용
Bridge br-public --> uplink: eth2 (공인망)
```
이런 구성이면, `localnet`이 연결된 `physnet2`가 `br-public`을 타고 외부로 나가니까,  
관리용 NIC(`eth0`)과 완전히 분리돼 있어서 끊길 일이 없다.

[[NIC 분리]]에서 자세히 알아봄