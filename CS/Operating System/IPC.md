Inter Process Communication 프로세스 간의 통신
프로세스끼리 데이터를 주고받고 공유 데이터를 관리하는 매커니즘
- client와 server의 데이터 요청 및 응답도 IPC의 예
- IPC의 종류 : 공유 메모리, 파일, [[Socket]], 익명 파이프, 명명 파이프, [[Message Queue]]
	![[Pasted image 20241024222456.png|500]]
- 메모리가 완전히 공유되는 스레드보다는 속도가 떨어짐

## 방식
- Socket 통신
- [[RPC]]
- RPC를 활용한 CORBA
- RMI

현재는 웹기술의 발달로 아래 방식들이 대세
- SOAP
- REST