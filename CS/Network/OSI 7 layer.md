- ==**(L7) Application**==
	유저가 접하는 Interface 역할을 하는 계층
	- 장비 : L7 스위치 (Load Balancer)
	- 프로토콜 : [[HTTP]], FTP, SMTP, SSH, DNS

- ==**(L6) Presentation**==
	데이터를 어떻게 표현할 지 정하는 계층
	파일 인코딩, 데이터 암호화/복호화

- ==**(L5) Session**==
	데이터가 통신하기 위한 논리적 연결 담당하는 계층
	실제 네트워크 연결이 이루어짐
	L4까지는 데이터를 전달하는 것이 주 목적이라면, 이 계층부터는 프로세스(실행 중인 프로그램)들 간의 통신 프로토콜임
	연결을 유지, 확립, 중단, 복구 등의 역할을 함
	장치 간의 연결을 설정하고 종료하며, 어떤 패킷이 어떤 텍스트나 이미지 파일에 속하는지 결정함
	
- ==**(L4) Transport**==
	프로세스들 간의 데이터 전송, 통신에 관한 역할을 담당. 
	오류 확인 및 데이터 복구 기능 수행
	종단 시스템에서만 구현됨 (사이에 있는 라우터들은 네트워크 계층까지 존재)
	- [[PDU]] : Segment(TCP) 또는 Datagram(UDP)
	- 전송 주소 : Port
	- 장비 : L4 스위치(TCP, UDP 프로토콜의 헤더를 보고 스위칭, IP와 PORT기반)
	- 프로토콜 : [[TCP]], [[UDP]] 
	
- ==**(L3) Network**==
	라우팅 기능을 맡고 있는 계층으로 목적지까지 가장 안전하고 빠르게 갈 수 있는 길을 설정(패킷 전달, 라우팅, 주소 설정)을 담당
	- PDU : Packet
	- 전송 주소 : [[IP]]
	- 장비 : Router, L3 스위치 
	- 프로토콜 : IP, ICMP, [[ARP]]
	
- ==**(L2) Data Link**==
	데이터를 Frame으로 묶음. 전송 중 발생할 수 있는 오류를 감지하거나 흐름을 제어함
	[[Ethernet Frame]]을 통해 에러 확인, 흐름 제어, 접근 제어를 담당
	- PDU : Frame
	- 전송 주소 : MAC
	- 장비 : Bridge, L2 스위치
	
- ==**(L1) Physicsal**==
	이진 데이터를 신호로 변환하고 물리적 네트워크 매체를 통해 데이터의 실제 전송을 담당하는 계층
	- PDU : Bit
	- 장비 : 케이블, NIC, 리피터, Hub, AP
	
![[Pasted image 20241018155412.png]]
![[Pasted image 20241018155433.png]]
![[Pasted image 20241018155440.png]]


https://www.plixer.com/blog/network-layers-explained/ 