**외부(Provider) 네트워크와 물리 네트워크를 직접 연결하는 브릿지**이다.
보통 이름이 `br-ex` (external bridge)로 되어 있고,  
물리 NIC(예: `enp6s18` 또는 `bond0`)가 붙어 있다

이 브릿지를 통해
- 인스턴스의 **Floating IP**,
- **External Gateway**,
- **Public Network 트래픽**
이 물리 네트워크(라우터, 스위치 등)로 나가게 된다.

---
Provider bridge와 External bridge는 모두 외부 네트워크(물리망)와 OpenStack의 가상 네트워크(OVN/Neutron)를 연결하기 위한 경계 지점이다.

즉, **OpenStack 인스턴스 내부 트래픽 (br-int)** 과 **외부 라우터/스위치로 나가는 트래픽 (br-ex)** 을 이어주는 역할을 한다는 점에서 기능적으로 같다. 

보는 관점이 다르다는 말은,

| 구분           | provider bridge                                                   | external bridge                                           |
| ------------ | ----------------------------------------------------------------- | --------------------------------------------------------- |
| **관점**       | Neutron(논리적) 관점                                                   | 호스트(OS/OVS) 관점                                            |
| **역할 정의 위치** | Neutron 설정 (`provider:network_type`, `provider:physical_network`) | OVS/OVN 설정 (`br-ex`, `localnet`, `network_name=physnetX`) |
| **의미**       | “이 네트워크는 물리망(Provider Network)에 연결된다.”                            | “이 물리망을 연결하는 실제 브릿지 장치다.”                                 |
| **예시**       | `physnet1`, `physnet2`                                            | `br-ex`, `br-provider`, `br-phy`                          |
- **Provider bridge** = Neutron에서 정의한 “물리 네트워크(physnet)”를 실제로 연결하는 OVS 브릿지
- **External bridge** = 일반적으로 Provider 네트워크 중 “External(public)” 용도로 쓰이는 브릿지 (`br-ex`)

따라서 external bridge는 provider bridge의 **특정 역할을 하는 한 형태**라고 보면 된다.

```
Instance (VM)
   │
  tapXXX
   │
  br-int     ← 내부(Self-service, Tenant network)
   │
  router (DVR or centralized)
   │
  br-ex (external bridge) ← 외부(public) 연결
   │
  └── physical NIC (provider bridge로 연결됨)
        └── 실제 네트워크 스위치 / 라우터
```
external bridge(`br-ex`)는 provider network를 연결하기 위한 **구체적인 브릿지 장치 이름**이자,  
provider bridge의 한 구현체로 볼 수 있다