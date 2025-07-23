OSI 2계층인 데이터 링크 계층에서 사용되는 전송 메커니즘
이더넷 프레임을 통해 전달받은 데이터의 에러를 검출하고 캡슐화함
## 구조
![[Pasted image 20241022235238.png]]
- **Preamble**, 7Bytes : 이더넷 프레임이 시작임을 알림
- **SFD**(Start Frame Delimiter), 1Byte : 다음 바이트부터 MAC 주소 필드가 시작됨을 알림
- **DMAC, SMAC**, 6Bytes : 수신, 송신 MAC 주소
- **EtherType**, 2Bytes : 데이터 계층 위의 계층인 IP 프로토콜을 정의. ex) [[IPv4]] 또는 [[IPv6]]
- **Payload** : 전달받은 데이터
- **FCS**, 4Bytes : 에러 확인 비트