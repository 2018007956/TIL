AMQP를 구현하여 메시지 생성자와 소비자 사이에서 메시지를 중계해 주는 '메시지 브로커'이다.
- AMQP(Advanced Message Queuing Protocol) 메시지 지향 미들웨어를 위한 개방형 표준 응용 계층 프로토콜

RabbitMQ는 메시지 지향 미들웨어(Message Oriented Middleware)에 속하는데,
메시지 지향 미들웨어는 비동기 메시지를 사용하는 응용프로그램들 사이에서 데이터를 송수신하는 것을 의미하며, 이러한 시스템을 구현한 솔루션을 '메시지 큐(Message Queue)'라고 한다.
## 구조
RabbitMQ의 주요 구성 요소는 **Producer, Consumer, Exchange, Binding, Queue**로 이루어져 있다.
![[Pasted image 20250921193514.png]]
**Producer**
- 메시지를 생성하고 발송하는 주체
- 메시지를 큐에 직접 보내지 않고 Exchange에 Publish 함
**Consumer**
- 메시지를 받아서 처리하는 주체
**Exchange**
- Producer로부터 전달받은 메시지를 어떤 큐에 발송할지 결정하는 객체
- Direct, Topic, Headers, Fanout의 4가지 타입이 있음
- 각각의 타입과 Biniding 규칙에 따라 적절한 큐로 메시지를 전달함
**Binding**
- Exchange와 Queue를 연결하는 관계
- Exchange Type과 Binding 규칙에 따라 적절한 큐로 메시지가 전달됨
**Queue**
- RabbitMQ 안에서 메시지를 일시적으로 저장하는 장소
- Consumer들은 큐에 저장된 메시지를 읽음
- 큐는 RabbitMQ 서버가 설치되는 호스트의 디스크 용량 및 메모리에 한정된다는 특징이 있음
