**문제 상황**
Self-Service 망에 연결된 VM 내부에서 라우터 게이트웨이까지 통신이 안되고, 
반대로 물리망에서 VM의 Floating IP까지 통신이 안먹힘

**원인 파악**
![[Pasted image 20251112160525.png|600]]
=> VM → TAP → br-int 구간에서 트래픽이 들어오지 않음
VM NIC에서 생성된 패킷이 TAP/qvo 인터페이스를 통해 OVS(br-int)까지 올라오지 못함

가능한 원인 1 ) 포트 바인딩 실패 
가능한 원인 2 ) nova-compute가 vif (Virtual Interface)를 OVS에 attach하는 과정에서 실패
	- libvirt XML NIC가 잘못 생성됨
	- ovs-vsctl add-port 실패
	- ovn-controller가 포트 바인딩을 놓쳤음
	- nova-compute 재시작 시 vif plug 실패
가능한 원인 3 ) vNIC 타입 불일치

=> 2번 문제인지 확인해보기 위해 `/var/log/nova/nova-compute.log`를 확인해보면,
![[Pasted image 20251112200353.png]]
```
WARNING nova.compute.manager [-] Instance is reporting: network-vif-plugged-ec922b51-33e3-4996-845c-d5e4e9523728 unexpected

INFO nova.virt.libvirt.driver [-] Successfully plugged vif ...
device='tapec922b51-33', traffic_filtering=True, bridge_interface='tapec922b51-33'
```
Neutron/OVN은 **qvo-XXX** 를 기대하고 있지만 nova-compute는 qvo를 만들지 않음
- nova/libvirt는 VM NIC를 **tap 인터페이스에만 연결**해버렸고
- ML2/OVN이 요구하는 **qvb/qvo veth 페어 생성이 실패**
- 그래서 **br-int에는 tap만 붙고 qvo는 아예 없음**
- OVN도 "expected port plugged" 시그널이 아닌 “unexpected plugged” 상태로 인식

즉, VM이 OVS에 붙지 않았기 때문에, VM 트래픽이 OVS로 들어가지 않는 상태이고,
그래서 tcpdump에서 ARP가 안 보인 것.
### OVN ML2 환경에서 nova-compute가 해야 하는 정상 동작
VM NIC 생성 과정에서 nova-compute는 아래 구성요소를 생성해야 한다.
```
VM eth0
 ↕
tapXXXXX
 ↕ (veth pair)
qvbXXXXX
 ↕
qvoXXXXX  → br-int 포트로 attach
```
그런데 지금 내 환경은
```
VM eth0
 ↕
tapXXXXX
(끝)   ← qvb/qvo 없음
```


**해결 과정**
1. VIF 연결과 연관된 `nova.conf` 파일 에서 아래 설정 추가
[Controller, Compute] `/etc/nova/nova.conf`
```
[DEFAULT]
use_neutron = true # VM NIC를 Neutron/OVN이 관리
firewall_driver = nova.virt.firewall.NoopFirewallDriver # Nova 자체 방화벽 끔 (보안그룹은 OVN이 처리)
```

[Compute] `/etc/nova/nova.conf`
```
[libvirt]
virt_type = kvm # 혹은 qemu (가상화 미지원일 때)
```

서비스 재시작
Controller
- systemctl restart nova-api
- systemctl restart nova-scheduler
- systemctl restart nova-conductor
Compute
- systemctl restart nova-compute
- systemctl restart neutron-ovn-metadata-agent

=> But, 변화 없음

2. ==self-service (옵션 없이) 재생성 후 시도== : `openstack network create VMNET01`
	했더니 위에서 서술된 문제들이 리셋됐는지 인스턴스 통신 성공함

---
결과적으로, self-service망 재생성해서 통신 문제 해결함
해결 1번에서 설정파일 수정했던 내용은 영향이 있었을지 모르겠음
위의 VIF 등 내용은 추후 공부 필요