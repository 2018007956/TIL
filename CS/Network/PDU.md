Protocol Data Unit

제어 정보 Header + 데이터 Payload
네트워크의 어떠한 계층에서 계층으로 데이터가 전달될 때 한 덩어리의 단위

계층마다 부르는 명칭이 다름
- 애플리케이션 계층 : Message
- 전송 계층 : Segment(TCP), Datagram(UDP)
- 인터넷 계층 : Packet
- 링크 계층 : Frame (데이터 링크 계층), Bit (물리 계층)

아래 계층인 비트로 송수신하는 것이 모든 PDU 중 가장 빠르고 효율성이 높다.
애플리케이션 계층에서는 문자열을 기반으로 송수신을 하는데, 그 이유는 헤더에 authorization 값 등 다른 값들을 넣는 확장이 쉽기 때문이다.