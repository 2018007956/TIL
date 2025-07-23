Publisher(송신자)로부터 전달받은 Message(메세지)를 동일한 Topic의 Subscriber(수신자)로 전달해주는 중간 역할
[[Message Queue]]는 전달하는 쪽에서 전달 받는 쪽으로 메시지를 전달하는 매개체로서의 의미를 가지고 있다면, 메시지 브로커는 더 광범위한 전송과 라우팅을 허용

예) Kafka, Redis, RabbitMQ, Celery
![[Pasted image 20250719221748.png]]
- Message Queue : 메시지가 적재되는 공간
- Topic : 메시지의 그룹

