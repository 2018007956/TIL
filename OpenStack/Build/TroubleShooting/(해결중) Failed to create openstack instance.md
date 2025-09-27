**문제 상황 1**
Exceeded maximum number of retries. Exhausted all hosts available for retrying build failures for instance d085180f-d728-4b1b-bb1e-97ac3042a84c.
![[Pasted image 20250927212105.png]]

[compute] `/var/log/nova/nova-compute.log`
![[Pasted image 20250927212027.png]]

**문제 원인**
`phynet1:br-ex, phynet2:br-ex`처럼 **두 개의 physnet을 같은 브리지(br-ex)에 매핑**하면, flat 네트워크에서는 충돌이 난다. flat은 **브리지(=물리 L2 세그먼트)당 하나의 physnet만** 유효하다. 그 결과, VMNET01(=phynet1 기반 flat)이 포트 바인딩 단계에서 실패 → 인스턴스가 `ERROR`로 떨어진다.

**해결 방법**
[VMNET01을 오버레이(geneve)로 전환]
테넌트 내부망이면 phynet/브리지 매핑이 필요 없다.
1. 파일 설정
	`/etc/neutron/plugins/ml2/ml2_conf.ini`
	![[Pasted image 20250927220931.png|600]]
	`/etc/neutron/plugins/ml2/openvswitch_agent.ini`
	![[Pasted image 20250927215758.png|600]]
	![[Pasted image 20250927215951.png|250]]
2. 서비스 재시작
	[controller] systemctl restart neutron-server
	[compute] systemctl restart ovn-controller.service
3. VMNET01 생성
	...

그런데 서비스 재시작 시 다음과 같은 문제 발생
**문제 상황 2**
```
# systemctl status ovn-controller 
	Unit ovn-controller.service could not be found.
```
OVN 환경이면 기본적으로 각 노드에서 `ovn-controller` 데몬이 떠 있어야 하는데, `Unit ovn-controller.service could not be found.` 가 떴으니 설치 자체가 안 된 거다.

```
# systemctl restart neutron-openvswitch-agent
	Failed to restart neutron-openvswitch-agent.service: Unit neutron-openvswitch-agent.service not found.
```
`neutron-openvswitch-agent` 서비스 자체가 없다는 건 → 네트워크 백엔드가 **ML2/OVS**도 아니고 **OVN**도 제대로 안 깔린 상태이고, Neutron이 사용할 L2 드라이버(에이전트)가 아예 빠져 있어서 테넌트 네트워크 생성 시 계속 VLAN으로만 인식하고 에러가 나는 상황임

- `ovn-controller` 없음 → OVN 기반 아님.
- `neutron-openvswitch-agent` 없음 → ML2/OVS 기반도 아님.
- 결국 Neutron이 “프로바이더 네트워크(flat/vlan)”만 처리 가능한 상태라, geneve 같은 테넌트망을 만들면 계속 segmentation ID 4095 오류를 뱉는 것.


**문제 2 - 해결 방법**
[OVS로 br-ex를 쓰고 있어서, OVN 설치 대신 OVS 유지]
1. 각 노드에 openvswitch-agent 설치
```
apt install neutron-openvswitch-agent
systemctl enable --now neutron-openvswitch-agent
```
2. `mechanism_drivers = openvswitch` 로 지정
	![[Pasted image 20250927225157.png]]
3. 서비스 재시작
   systemctl restart neutron-openvswitch-agent.service
   systemctl restart neutron-server.serivce