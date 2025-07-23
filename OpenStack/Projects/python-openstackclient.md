- **역할** : OpenStack의 통합 CLI 제공
- **공식 명령어** : openstack

OpenStack 클라우드 서비스에 대한 명령 줄 인터페이스 (CLI) 도구이고, 사용자는 OpenStack 환경에서 다양한 서비스를 관리하고 조작할 수 있다.
이 프로젝트는 다양한 OpenStack 서비스 (예: Compute, Identity, Image, Network 등)에 대한 일관된 CLI를 제공하여 사용자가 손쉽게 OpenStack 리소스를 관리할 수 있도록 도와준다

## 주요 기능
- **통합된 CLI** : 각 OpenStack 서비스에 대한 개발 CLI 도구 대신 하나의 통합된 CLI를 제공하여 사용자의 편의성을 제공
- **확장 기능** : 플러그인 아키텍처를 통해 새로운 서비스나 기능을 쉽게 추가 가능
- **자동 인증 및 세션 관리** : 사용자가 설정한 인증 정보와 세션을 바탕으로 OpenStack API와 상호 작용
## 탄생 배경
원래는 각 컴포넌트마다 CLI(client)가 따로 존재했다.
- openstackcli : openstack image list
- glance cli : glance image-list
하지만 컴포넌트별로 따로 개발이 되다보니 option이나 코드 구조가 일관성이 없어졌다.

**barbican  cli > openstack cli 명령어로 컨벌팅 시키는 것을 구현해 볼 예정**
## setup.cfg
> deprecated 돼서 사라진 파일
	Python 프로젝트의 메타데이터와 구성 옵션을 정의하는 파일
	주로 Python 패키징 도구인 setuptools와 함께 사용되며, 프로젝트의 설정 정보를 명시적으로 지정할 수 있는 구성 파일
	- 설정 값
		- 메타데이터 : 프로젝트 이름, 버전, 저자, 라이센스 등의 기본 정보
		- 옵션 : 설치 옵션, 종속성, 테스트 요구 사항 등의 설정
		- 엔트리 포인트 : CLI 명령어와 그에 매핑되는 함수 지정
		- 패키징 정보 : 포함될 패키지와 데이터 파일 등의 정보
	- 역할
		- 프로젝트 구성 및 관리 : 프로젝트의 종속성, 메타데이터, 엔트리 포인트 등을 중앙에서 관리
		- 자동화 : 빌드 및 배포 프로세스를 자동화
		- 일관성 : 여러 개발자 간의 환경 일관성 유지
		setup.cfg 파일을 통해 프로젝트의 다양한 설정을 한 곳에서 관리함으로써, 패키징과 배포 과정이 더 체계적이고 간편해짐
## Code
구조 : 클래스 형태, get_parser, take_action 
- **get_parser** : argv(option)를 파싱해서 obj로 만드는 함수
- **take_action** : get_parser 리턴값을 parsed_args로 받고, 조합해서 API 호출함, 결과값을 만드는 함수

`openstackclient > compute (Nova) > v2 (version) > server.py` : openstack 명령어 받아서 해석하고 결과값 만드는 클래스

`openstack server list --debug`
--debug 옵션 : 실행한 CLI가 결과값을 보여주기까지 어떤 API를 호출하고 결과값을 가져오는지의 과정을 보여주는 option

`env | grep OS_` : 환경변수로 등록한 인증 정보 출력

`openstack endpoint list` : 각 서비스마다 가지고 있는 엔드포인트 정보 출력


openstack migration, evacuate, resize (flavor (core, memory) 변경) 등 운영에 필요한 것들 공유 예정