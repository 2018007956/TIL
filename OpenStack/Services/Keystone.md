**오픈스택의 인증 서비스**

인증 토큰을 비롯해 테넌트 및 사용자 관리, 서비스의 엔드포인트 URL 등을 관리하는 서비스이다. Keystone 인증에 성공하지 못하면 오픈스택의 그 어떤 서비스도 이용할 수 없다.

## Logical Architecture로 보는 Keystone
논리 아키텍처에서 Keystone은 keystone-all, Database와 LDAP로 구성된다. keystone-all에는 토큰, 카탈로그, 정책, 인증 등이 포함되어 있으며 각 항목은 다음 역할을 한다.

- Token Backend : 사용자별 토큰 관리
- Catalog Backend : 오픈스택에서 모든 서비스의 엔드포인트 URL을 관리
- Policy Backend : 테넌트, 사용자 계정, 롤 등을 관리
- Identity Backend : 사용자 인증 관리

## OpenStack에서 Keystone 위치
오픈스택에서 Keystone은 모든 서비스를 관장하는 위치에 있다. Keystone은 타인이나 해커에게서 시스템을 안전하게 보호하고 사용자 등록, 삭제, 권한 관리, 사용자가 접근할 수 있는 서비스 포인트 관리까지 전반적인 사용자 인증을 관리한다. 
![[Pasted image 20251020001815.png]]
위 그림은 오픈스택의 서비스 간 연관 관계를 보여준다. Keystone 위치를 보면 서비스 백단에서 오픈스택의 모든 서비스를 관장하고 있다.



https://naleejang.tistory.com/106