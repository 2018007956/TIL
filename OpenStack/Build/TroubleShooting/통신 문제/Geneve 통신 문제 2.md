VM 마이그레이션 후, 원래 잘 동작했던 Geneve 통신이 안되었다.

**해결 과정**
1) 컨트롤러 노드의 SBDB에서 기존 chassis 엔트리 삭제
   `ovn-sbctl chassis-del os-network`

2) 네트워크 노드에서 OVN/OVS 재시작
   `systemctl restart openvswitch-switch`
   `systemctl restart ovn-controller`

=> 이렇게 하면, ovn-controller가 새로운 system-id로 chassis를 SBDB에 다시 등록함

**결과 확인**
네트워크 노드에 geneve 터널 정상 동작
![[Pasted image 20251110212634.png]]

Gateway 까지 통신 성공
![[Pasted image 20251110212727.png|400]]