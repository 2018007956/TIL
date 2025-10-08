**문제 상황**
[[Geneve 터널망 생성 안돼서 라우터 게이트웨이까지 통신 불가 (OpenFlow Version negotiation failed)]] 이 글을 보면 selfservice network의 VM에서도 라우트 게이트웨이까지 통신이 됐었는데, 어떤 설정이 건들여진건지 갑자기 통신이 안되는 상황
![[Pasted image 20251007220718.png|500]]

**문제 원인**
![[Pasted image 20251008000158.png]]
![[Pasted image 20251008001341.png|600]]
- 수동으로 만들어진 포트 제거 (geneve-test 만들 때 생성된듯)
	![[Pasted image 20251008000743.png]]
- 서비스 싱크 재정렬
	- systemctl restart ovn-controller
	- systemctl restart openvswitch-switch
- 정상 쌍만 남았는지 확인
	![[Pasted image 20251008000822.png]]

>근데 geneve-test 삭제 이후에 test01 인스턴스 통신 된 적 있어서 이 포트 중복이 원인은 아닐 듯

- LSP 만졌을 때 생긴 쓰레기 포트 제거
![[Pasted image 20251008010520.png|400]]
```
ovn-nbctl lsp-del 341caa55-0185-42c4-8d42-d544c2ebf9b4
ovn-nbctl lsp-del 9a7995e6-bead-4425-b340-f69baeccafca
```
![[Pasted image 20251008010507.png|400]]

---
- 라우터 포트 이름(LRP) 확인 `ovn-nbctl find logical_router_port`
![[Pasted image 20251008235837.png]]
hosting-chassis가 어떤 노드로 지정되어 있는지 확인해보면,
![[Pasted image 20251009000017.png]]
NAT가 os-compute 노드에서 동작 중이라는 뜻

자세히는 OVN이 아래와 같은 구조로 동작하는데
[ selfservice network ] 
        ↓ (lrp 내부포트)
  [ private-router datapath ] ← NAT / SNAT / DNAT rule 여기 존재
        ↓ (lrp 외부포트)
[ public-network ]

![[Pasted image 20251009002216.png]]
NAT는 라우터 datapath (name2=private-router) 내부에 생성되고,
이 라우터가 os-compute (hosting-chassis에서 확인한 값) 노드 위에서 실행됨

---
test01 VM(10.1.201.156)이 게이트웨이(10.1.201.1)로 ping 할 떄의 경로 :
[VM eth0]
   ↓
[tap인터페이스]
   ↓
[br-int (os-compute)]
   ↓ Geneve 터널
[br-int (os-network)]
   ↓
[LRP(10.1.201.1)]
   ↓
(필요 시 NAT → br-ex)

