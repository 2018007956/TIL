1. 패킷 사이의 순서 보장
2. 연결지향 프로토콜 사용하여 신뢰성 구축해서 수신 여부를 확인
3. 가상회선 [[패킷 교환 방식]]을 사용
## 연결 성립 과정 : 3-way handshake
Sequence number를 교환하는 행위
1. **SYN 단계** 
2. **SYN + ACK 단계**
3. **ACK 단계**
## 연결 해제 과정 : 4-way handshake
1. **FIN**
2. **ACK**
3. **FIN**
4. **ACK** 
- Client에서 연결을 끊자고 요청
- Server의 FIN+ACK를 기다리는 TIME_WAIT 상태 존재