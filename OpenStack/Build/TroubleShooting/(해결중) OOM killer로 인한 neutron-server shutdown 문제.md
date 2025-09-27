**문제 상황**
컨트롤러의 화면이 킬 프로세스로 가득 찼다
![[Pasted image 20250928025007.png]]
![[Pasted image 20250928025059.png]]
neutron 서비스가 계속 kill 돼서 그런지, 대시보드에도 아무 정보가 안뜨는 상황
![[Pasted image 20250928025543.png]]
오류 메시지 : 인스턴스를 찾지 못 했습니다.
Unexpected API Error. Please report this at http://bugs.launchpad.net/nova/ and attach the Nova API log if possible. <class 'keystoneauth1.exceptions.connection.ConnectFailure'> (HTTP 500) (Request-ID: req-602655bc-b9f0-4fe8-9e1b-6e0567161ed4)

근데 neutron-server 상태는 active로 올라와있음
![[Pasted image 20250928025754.png]]
