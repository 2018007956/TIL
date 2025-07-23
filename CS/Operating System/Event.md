- [[Kernel Object]]의 한 종류
- Windows에선 Event, Linux에선 Signal이라고 함
- 여러 프로세스에서 동시 접근을 할 가능성이 있을 때만 이름을 부여함

### 이벤트 객체 생성
```
HANDLE hEvent = ::CreateEvent(
	NULL,  //디폴트(생성하는 쪽의) 보안 속성 적용
	FALSE, //자동으로 상태 전환X (Set/Reset 상태 유지)
	FALSE, //초기상태는 FALSE
	NULL); //이름 없음
```