CPU라는 전산 자원을 소모하는 실행의 단위
- 개별화된 흐름(문맥)과 전용 스택을 가짐
- 모든 Thread는 자신이 속한 [[Process]]의 가상 메모리 공간을 공유함
## 생성
```
DWORD dwThreadID = 0;

HANDLE hThread = ::CreateThread(
				NULL, // 생성한 스레드의 보안속성을 상속함
				0,    // 스택 메모리는 컴파일러가 정한 기본크기(1MB)
				ThreadFunction, // 스레드로 실행할 (main 역할)함수이름
				NULL, // 함수에 전달할 매개변수
				0,    // 생성 플래그는 기본값 사용
				&dwThreadID);  // 생성된 스레드ID 저장
```