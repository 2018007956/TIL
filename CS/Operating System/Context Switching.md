현재 진행하고 있는 Task(Process, Thread)의 상태를 저장하고 다음 진행할 Task의 상태 값을 읽어 적용하는 과정

왜 Context Switching이 필요한가?
Computer가 매번 하나의 Task만 처리할 수 있다면?
- 해당 Task가 끝날때까지 다음 Task는 기다릴 수 밖에 없다
- 또한 반응속도가 매우 느리고 사용하기 불편하다

그렇다면 다양한 사람들이 동시에 사용하는 것처럼 하기 위해선?
- Computer multitasking을 통해 빠른 반응속도로 응답할 수 있다
- 빠른 속도로 Task를 바꿔 가며 실행하기 때문에 사람의 눈으론 실시간처럼 보이게 되는 장점이 있다
- CPU가 Task를 바꿔 가며 실행하기 위해 Context Switching이 필요하게 되었다

## 과정
1. Task의 대부분 정보는 Register에 저장되고 [[PCB]]로 관리된다.
2. 현재 실행하고 있는 Task의 PCB 정보를 저장한다. (Process Stack, Ready Queue)
3. 다음 실행할 Task의 PCB 정보를 읽어 Register에 적재하고 CPU가 이전에 진행했던 과정을 연속적으로 수행할 수 있다.

## Cost (Process vs Thread)
- Process > Thread
- Thread는 Stack 영역을 제외한 모든 메모리를 공유하므로 Context Switching 수행 시 Stack 영역만 변경하면 되기 때문에 비용이 적게 든다.
