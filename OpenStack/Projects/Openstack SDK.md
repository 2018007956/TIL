- **역할** : OpenStack의 통합 프로그래밍 인터페이스

OpenStack의 기능들을 손쉽게 이용하여 새로운 애플리케이션을 만들 수 있게 만들어주는 도구
대표적으로 OpenStack Client 프로젝트에서 OpenStack의 정보를 받아오는 과정에서 OpenStack SDK를 많이 사용
## 동작 흐름
> **사용자** → `conn.compute.servers()` 호출 → **Connection** (연결) → **Proxy** (작업 지시) → **Resource** (설계도 참조) → **OpenStack API**

이처럼 잘 정의된 계층 구조 덕분에 개발자는 복잡한 API 통신의 내부 과정을 신경 쓸 필요 없이, 필요한 결과물을 얻을 수 있다.
#### 모든 서버(인스턴스) 목록 가져오기
1. **OpenStack에 연결하기** 
	인증 정보를 담아 Connection 객체 생성 > OpenStack 클라우드와의 통신 세션 설정
2. **서버 목록 요청 및 실행**
	생성된 conn 객체를 사용하여 서버 목록을 가져오는 함수 `conn.compute.servers()` 호출
	- conn 객체를 통해 Compute 서비스의 Proxy 객체에 접근해서 servers() 호출
	- servers()의 리턴값 : `self._list(_server.Server, base_path=base_path, **query)`
		- `_server.Server` : Resource 객체. `openstack/compute/v2/server.py`에 정의된 '서버 데이터 모델' 
		- `base_path = '/servers/detail'` : API 기본 경로
		- 이 정보를 활용하여 OpenStack에 `GET /servers/detail`이라는 REST API 요청을 보냄 
3. **결과 확인**
	OpenStack API로부터 받은 JSON 응답 데이터는 `openstack.compute.v2.server.Server` 객체 형태로 변환되어 최종적으로 사용자에게 반환됨
## 디버깅
- `openstacksdk\openstack\compute\v2\server.py` Line 36 Server 함수
- `openstacksdk\openstack\compute\v2\_proxy.py` Line 833 

위치에 중단점 걸어놓고 디버깅 실행하며 동작 흐름 분석해보기
## 구조
```
openstack/
	connection.py 
	resource.py 
	compute/ 
		compute_service.py 
		v2/ 
			server.py 
			_proxy.py 
	tests/ 
		compute/ 
			v2/ 
				test_server.py
```
크게 Resource, Proxy, Connection 세 구조로 나눌 수 있음
- **Connection : 통합 진입점**
	- openstack 서비스에 접근하기 위한 시작점
	- 구현된 proxy 객체를 통해 resource 객체를 호출하는 역할
	- configuration을 이용하여 오픈스택과 사용자를 연결하는 역할
	- conn 객체 하나로 모든 서비스(compute, network 등)를 제어 가능
- **Proxy : 서비스 액션 계층**
	- 개발자가 실제로 상호작용하는 인터페이스
	- OpenStack API와 클라이언트 간의 중개 역할을 하는 클래스. 
	- 클라이언트가 API 요청을 보내면, Proxy가 이를 처리하여 적절한 리소스에 전달
	- 기능 : Proxy는 리소스에 대한 CRUD(Create, Read, Update, Delete) 작업을 수행하는 메서드를 제공. 이를 통해 클라이언트는 복잡한 API 호출을 단순화하여 사용할 수 있음.
- **Resource : 데이터 모델 계층**
	- OpenStack의 다양한 **엔티티**를 표현하는 클래스
	- 데이터베이스의 레코드와 유사한 개념
	- 기능 : Resource 클래스는 리소스의 속성을 정의하고, 그 리소스에 대한 작업을 수행할 수 있는 메서드를 포함. 예를 들어, Zone, FloatingIP와 같은 클래스가 Resource로 존재
	- **REST API의 CRUD를 호출하거나, 응답 받기 위한 정보들 (Header, Body, URI, QueryParameter 등)을 선언**