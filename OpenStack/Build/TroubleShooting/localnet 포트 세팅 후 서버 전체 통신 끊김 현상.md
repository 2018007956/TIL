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

==OVN이 runtime에서 만들어진 포트(localnet, lsp 등)는 메모리 기반이기 떄문에, 재부팅 후 ovn-northd가 다시 해당 정보를 적용하지 않아 꼬였던 localnet 포트가 초기화되면서 해결됨==

**문제 분석**
`ovn-nbctl lsp-add`로 `localnet` 타입 포트를 생성하면,
OVS 내부에서 해당 포트가 물리 NIC와 직접 연결되는 '데이터패스 연결점'으로 매핑된다. 
이때 기존에 운영 중이던 `br-ex`와 연결된 Geneve, VXLAN, 외부망 브릿지 등이 있을 경우, 새로운 `localnet`이 추가되며 내부적으로 다음이 동시에 일어난다:

1. OVS가 br-ex 인터페이스를 재구성하며
   `enp6s18` ↔ `OVN` ↔ `Logical Switch` 구조가 재적용됨
2. 그 결과,
   - 커널에서 `enp6s18`이 slave 인터페이스로 전환
   - `enp6s18`에 걸려 있던 IP/route/ARP 등 관리 트래픽 전부 끊김
   - 호스트 네트워크 세션이 끊김 - SSH, Proxmox 콘솔, 관리 인터페이스 포함
   (해당 인터페이스가 Proxmox의 vmbr0과 연결되어 있으면 Proxmox 브릿지도 Down)
3. 결과적으로 Proxmox의 관리 IP가 사라짐
4. 따라서 Proxmox Web UI, SSH, VM 네트워크 모두 단절

결국 관리 네트워크 인터페이스(예: `enp6s18` → `br-ex`)가 down되면서
모든 노드가 끊긴 것
##### enp6s18이 slave가 되었다는 말은,
커널이 원래 NIC를 이렇게 관리했는데
```
Kernel Network Stack
└── enp6s18 (직접 제어)
      IP = 192.168.0.10
```
OVS가 개입하면서 구조가 이렇게 바뀜
```
Kernel Network Stack
└── br-ex (IP 가짐)
      └── enp6s18 (OVS가 커널에서 제어하는 하위 포트)
```

즉, 커널이 enp6s18을 직접 제어하던 권한을 OVS 커널 모듈이 가로채서,
enp6s18이 slave interface가 되어버린 것.

그 순간 커널의 네트워크 스택 입장에서는 enp6s18에 IP가 없고, 직접 통신할 수도 없으니 
**통신이 끊긴 것처럼** 보이게 되는 것

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
