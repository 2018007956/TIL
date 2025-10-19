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

## 분리 방법
