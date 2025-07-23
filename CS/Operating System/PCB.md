Process Control Block : 운영체제가 프로세스를 제어하기 위해, 프로세스의 상태 정보를 저장하는 자료구조
프로세스 상태 관리와 문맥 교환(Context switch)을 위해 필요
## 저장되는 정보
- **Pointer**
	- 프로세스의 현재 위치
- **[[Process State]]**
	- 프로세스의 각 상태 (생성(Created), 준비(Ready), 실행(Running), 대기(Waiting), 종료(Terminated))를 저장
- **Process Number (PID)**
	- 프로세스 고유 ID
- **Program Counter**
	- 실행될 다음 명령어의 주소
- **Registers**
	- 누산기, 베이스, 레지스터 및 범용 레지스터를 포함하는 CPU 레지스터에 있는 정보
- **Memory Limits**
	- 운영체제에서 사용하는 메모리 관리 시스템에 대한 정보
	- 페이지 테이블, 세그먼트 테이블 등
- **Open File LIsts**
	- 열린 파일 목록