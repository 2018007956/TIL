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
