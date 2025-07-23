OpenStack에서 DNS-as-a-service를 담당하는 컴포넌트로 DNS 서버 역할
REST API를 이용하여 DNS 레코드, Zone, 이름을 관리
## Services
- **API** : Designate의 REST API 처리를 담당
- **Central** : 레코드 데이터/존의 용량/검증을 담당하고, Worker에게 CRUD 요청을 전송
- **Mini DNS** : Designate 데이터베이스에만 있는 존 전송 요청을 처리
- **Worker** : Designate의 네임서버에서 필요한 작업들을 수행
- **Producer** : API 작업 외에 있는 작업들을 수행하고, 정기적인 작업들(예: 정기적 복구)을 수행


[ Designate의 동작을 Neutron과 함께 되도록 구성하여 동작하는 예시 ]

사용자가 Designate에 zone1.cloud.openstack.org 와 zone2.cloud.openstack.org  라는 두 개의 영역을 만든다. 그러면 SOA 레코드가 있는 Designate 네임서버에 두 개의 새로운 zone이 생성된다.

그런 다음 사용자는 Neutron에 두 개의 네트워크를 생성합니다. 하나는 zone1.cloud.openstack.org 가 할당된 프라이빗 네트워크이고, 다른 하나는 zone2.cloud.openstack.org 가 할당된 퍼블릭 네트워크이다 .

그런 다음 Nova에서 vm1을 만들고 Neutron의 개인 네트워크에 연결하고 floating IP에 vm2를 퍼블릭 네트워크에 직접 연결했다. 이러한 각 작업은 Neutron이 사용자를 대신하여 Designate에 레코드 생성을 요청하는 일련의 이벤트를 트리거하고, 최종 결과는 네임서버에서 레코드가 생성되어 역방향 조회를 허용하기 위해 PTR 레코드와 함께 vm 이름을 도메인에 매핑한다.