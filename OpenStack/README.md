# ☁️ OpenStack
OpenStack을 직접 구축하며 내부 동작 원리를 깊이 이해하고,
문제를 해결하는 과정을 기록한 공간입니다.

## 🧭 구축 배경
오픈소스 컨트리뷰션 아카데미 활동을 통해 OpenStack 레포지토리에 사용자 CRUD 기능 관련 테스트 코드를 기여하며, OpenStack의 내부 구조와 서비스 간 상호작용에 관심을 가지게 되었습니다.
마침 친구가 고사양 서버 환경을 제공해주어 운좋게 직접 환경을 구축하며 시스템의 동작 원리를 이해할 수 있는 기회를 얻었습니다.

구축 과정에서는 [해당 매뉴얼](https://smsolutions.slab.com/public/posts/ogjs-104-%EC%B9%9C%EC%A0%88%ED%95%9C-%EA%B9%80%EC%84%A0%EC%9E%84-5r4edxq3?shr=gm6365tt31kxen7dc4d530u0)을 기반으로 Controller, Compute, Network, Storage 노드에 필요한 서비스를 설치했습니다. 단순히 매뉴얼을 그대로 재현하는 데 그치지 않고, Public Network만을 사용하는 구조에서 확장하여 Self-Service Network를 구축했습니다.

이 과정에서
- Neutron의 ML2/OVN 설정,
- Geneve 기반 터널링 환경 구성,
- Floating IP와 Router를 통한 외부 통신 검증

등 실제 서비스 환경과 유사한 네트워크 구성 실험을 수행하며 OpenStack의 내부 동작을 심층적으로 이해할 수 있었습니다.

## 🗂 Folder Structure  
```
📁 OpenStack/
 ┣ 📁 Assignments/            # 오픈소스 컨트리뷰션 아카데미(OSSCA) 과제 기록
 ┣ 📁 Attached files/         # 이미지 자료
 ┣ 📁 Build/                  # OpenStack 구축 및 설정 과정 정리
 ┃   ┗ 📁 Troubleshooting/    # 구축 중 발생한 문제 분석 및 해결 기록
 ┣ 📁 Projects/               # OpenStack SDK 및 python-openstackclient 이해
 ┣ 📁 Services/               # 주요 서비스 개념 정리
 ┗ 📁 개념/                   # 네트워크 개념 정리
```

## 📎 Reference
- OpenStack Official Docs  
- [OpenStack 쌩짜 설치 메뉴얼](https://smsolutions.slab.com/public/posts/ogjs-104-%EC%B9%9C%EC%A0%88%ED%95%9C-%EA%B9%80%EC%84%A0%EC%9E%84-5r4edxq3?shr=gm6365tt31kxen7dc4d530u0) (4.5 hostname 부터 수행)