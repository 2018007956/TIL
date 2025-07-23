OpenStack의 중앙 집중식 인증(Authentication) 및 인가(Authorization) 서비스이다.
모든 OpenStack 서비스(Nova, Glance, Cinder 등)는 Keystone을 통해 **사용자 인증을 수행**하며, **사용자의 권한(Role) 및 프로젝트에 대한 접근 권한을 관리**한다

## 주요 기능
Keystone은 사용자의 요청을 인증하고, 각 OpenStack 서비스에 적절한 접근 권한을 부여하는 역할을 한다.

1. **Identity Management** : 사용자 및 그룹의 인증을 관리
2. **Token-based Access Control** : 인증된 사용자에게 임시 토큰 발급 (세션 관리)
3. **Authentication & Authorization** : 사용자 및 그룹의 역할(Role) 및 접근 권한 관리
4. **Service Catalog & Endpoints** : OpenStack 서비스의 엔드포인트 URL 관리

Keystone을 활용하면 OpenStack 클라우드에서 자원을 안전하게 보호하고, 다중 사용자 환경을 효율적으로 관리할 수 있다

## 핵심 개념
1. Domain
	- 사용자, 그룹, 프로젝트의 최상위 컨테이너 역할
	- 기본적으로 Default 도메인이 존재하며, 필요에 따라 다중 도메인 구성이 가능
	- 도메인별로 사용자와 프로젝트를 격리하여 관리 가능
	**도메인은 다중 테넌트 환경을 구축할 때 유용하게 활용될 수 있다**	
2. Project
	- 사용자가 소유한 리소스를 격리하는 기본 단위
	- Identity v2에서는 Tenant라고 불렸지만, Identity v3에서는 Project로 변경됨
	**프로젝트는 OpenStack에서 클라우드 리소스를 격리하고 관리하는 기본 단위이다**
3. User & Group
	- User : OpenStack 서비스를 사용하는 개별 계정 (Nova, Cinder 등 OpenStack 서비스도 User로 등록됨)
	- Group : 여러 사용자를 묶어 관리하는 단위
	**사용자는 Keystone을 통해 인증을 수행하며, 특정 프로젝트 및 역할에 따라 접근 권한이 달라진다**
4. Role
	- 사용자가 특정 프로젝트의 리소스에 접근할 수 있는 권한을 정의
	- 예를 들어, 관리자(Admin), 개발자(Developer), 읽기 전용(Read-only) 등의 역할을 설정 가능
5. Token
	- Keystone은 사용자 인증 후, 임시적인 접근 권한을 위한 토큰을 발급
	- 사용자는 토큰을 이용하여 다른 OpenStack 서비스에 접근 가능
	**토큰은 보안 강화를 위해 일정 시간 후 만료되며, 필요 시 갱신(refresh)할 수 있다**
6. Endpoint
	- OpenStack 서비스(Nova, Glance, CInder 등)의 URL을 관리
	- 하나의 서비스는 여러 개의 Endpoint를 가질 수 있음 (Public, Admin, Internal)
	**Keystone은 OpenStack 서비스의 엔드포인트 목록을 제공하여, 클라이언트가 올바른 서비스에 접근할 수 있도록 한다**


https://somaz.tistory.com/126