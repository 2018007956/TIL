ML2 (Modular Layer 2) Plugin은 다양한 네트워크 메커니즘(예: OVS, OVN, Linux Bridge 등)을 통합적으로 다룰 수 있게 해주는 드라이버 프레임워크

- Neutron 서버가 네트워크를 어떻게 처리할지 정의하는 주요 설정 파일
- 어떤 **네트워크 타입(driver)** 을 쓸지, 어떤 **메커니즘(backend plugin)** 을 사용할지를 지정
- 네트워크와 물리 브리지를 어떻게 매핑할지를 포함