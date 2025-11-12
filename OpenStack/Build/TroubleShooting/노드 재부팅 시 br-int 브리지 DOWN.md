`br-int`(Integration Bridge)는 Open vSwitch(OVS)가 OVN(또는 Neutron) 설정에 따라 자동으로 관리하는 가상 브리지이다

**문제 상황**
노드 재부팅 시 `br-int`가 계속 DOWN 되고,
ipv4 네트워크 세팅까지 초기화되는건지 생성한(또는 재시작한) 인스턴스 내부에 할당된 IP가 없어졌다
![[Pasted image 20251112232154.png|500]]

(복구 과정이 있을텐데, 잘 몰라서 VMNET01부터 다시 생성함
`systemctl restart openvswitch-switch.service ovn-controller.service`만 해줘도 살아날 수도 있음)

**해결 방법 : `br-int`를 영구적으로 netplan( /etc/netplan/xx.yaml )에 정의함**
```
bridges:
br-int:
  interfaces: []
  dhcp4: no
  dhcp6: no
  openvswitch: {}
```
적용 : `sudo netplan apply`

이렇게 하면 재부팅 시 `br-int` 인터페이스가 항상 UP으로 유지된다

---
재부팅 시 `br-int` 브리지만 다운되는 부분에 대해서는 더 공부해 봐야 할 듯