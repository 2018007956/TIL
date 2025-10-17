**문제 상황**
Exceeded maximum number of retries. Exhausted all hosts available for retrying build failures for instance d085180f-d728-4b1b-bb1e-97ac3042a84c.
![[Pasted image 20250927212105.png]]

[compute] `/var/log/nova/nova-compute.log`
![[Pasted image 20250927212027.png]]

**문제 원인**
`phynet1:br-ex, phynet2:br-ex`처럼 **두 개의 physnet을 같은 브리지(br-ex)에 매핑**하면, flat 네트워크에서는 충돌이 난다. flat은 **브리지(=물리 L2 세그먼트)당 하나의 physnet만** 유효하다. 그 결과, VMNET01(=phynet1 기반 flat)이 포트 바인딩 단계에서 실패 → 인스턴스가 `ERROR`로 떨어진다.
- `flat` 타입에서는 **“브리지 하나 ↔ 하나의 physnet 이름”** 만 유효함
- `vlan` 네트워크라면 같은 브리지에 여러 physnet을 매핑해서 VLAN ID로 분리하는 게 가능

**해결 방법**
geneve 타입으로 selfservice 네트워크 생성함