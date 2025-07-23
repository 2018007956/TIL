암호화 키(Key), 인증서(Certificate) 및 기타 민감한 데이터를 관리하는 보안 서비스로, 
데이터 암호화 및 보안 강화를 위한 Key Management Service (KMS)을 제공
## Core Components
- **Barbican API** : 암호화 키 및 비밀 정보를 관리하는 API 서비스
- **Secret Store** : 암호화된 데이터를 저장하는 중앙 저장소
- **Certificate Manager** : 인증서 및 키 관리를 위한 모듈
- **HSM & External Key Store** : 외부 하드웨어 보안 모듈(HSM) 또는 KMIP 서버와 연동 가능
