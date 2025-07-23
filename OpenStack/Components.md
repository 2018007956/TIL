![[Pasted image 20250723151158.png]]
![[Pasted image 20250720003154.png]]
- Core components: Nova, Neutron, Cinder, Swift, Glance, Keystone
- Optional components: Horizon, Skyline, Heat, Ceilometer, ...

### Core components
- Nova : 가상의 서버를 생성 및 관리
- Glance : 서버의 이미지 생성 및 관리
- Cinder : 블록 스토리지를 생성 및 관리
- Neutron : 가상의 네트워크 생성 및 관리
- Keystone : 사용자에 대한 인증
- Swift : 오브젝트 스토리지를 구성
- Horizon : Horizon 대시보드를 통해 GUI 환경에서 오픈스택의 구성요소들을 컨트롤 가능

Nova, Neutron 등과 같이 중요한 컴포넌트들은 openstackcli에 구현되어 있는데, Designate 등 다른 컴포넌트는 개별 클라이언트를 플러그인 형태로 가져와서 사용함
