프로세스가 만들어져 시스템에 존재하는 동안 여러 사건들에 의해 일련의 상태 변화를 거친다
![[Pasted image 20250722174818.png]]
### Created (생성)
사용자가 요청한 작업이 커널에 등록되고 PCB가 만들어져 프로세스가 만들어진 상태
- Created -> Ready : 메모리 공간을 검사하여 충분한 공간이 있으면 메모리를 할당하고 준비 상태로 바꿈
- Created -> Suspended Ready : 공간이 없으면 메모리를 할당하지 않고 보류 준비로 바꿈
### Ready (준비)
CPU를 할당 받기 위해 기다리고 있는 상태. CPU만 주어지면 바로 실행할 준비가 된 상태
- Ready -> Running : CPU를 할당 받으면 실행 상태로 바뀌고 실행됨 (Dispatch)
- Ready -> Suspended Ready : 준비 상태였다가 메모리를 뺏긴 상태
### Running (실행)
CPU를 할당받아 실행 중인 상태
- Running -> Ready : CPU를 받아 실행하다가 시간 할당량을 소진하여 뺏긴 상태 (Timeout)
- Running -> Blocked : 실행 상태의 프로세스가 입출력이 필요하게 되어 시스템 호출을 하고, 입출력 처리의 종료를 기다리는 상태. 이때 CPU는 바로 준비 상태의 프로세스 하나를 선택해 실행함
### Blocked (대기)
프로세스가 실행되다가 입출력 처리를 요청하거나, 바로 확보될 수 없는 자원을 요청하면 CPU를 양도하고 요청한 일이 완료되기를 기다림
- Blocked -> Ready : 입출력이 완료되어 CPU 할당을 기다리는 상태
- Blocked -> Suspended Blocked : 메모리의 여유 공간 확보를 위해 대기 상태에서 메모리를 뺏겨 보류 대기 상태로 바뀜
### Terminated (종료)
프로세스가 종료될 때 아주 잠시 거치는 상태. 
모든 자원이 회수되고 PCB를 삭제함
### Suspended Ready
생성된 프로세스가 바로 메모리를 받지 못할 때, 준비 또는 실행 상태에서 메모리를 잃게 될 때
충분한 메모리 공간의 확보를 위해 준비 상태의 프로세스를 보류 시키는 경우
- Running -> Suspended Ready : 높은 우선순위의 보류 대기 상태 프로세스가 준비 상태가 되어, 실행 상태의 프로세스로부터 CPU를 뺏는 경우
- Suspended Blocked -> Suspended Ready : 보류 대기 상태에 있던 프로세스가 기다리던 입출력이 완료된 경우
- Suspended Ready -> Ready : 다시 메모리를 받은 경우
### Suspended Blocked
대기 상태일 때 메모리 공간을 잃은 상태
- Blocked -> Suspended Blocked : 메모리 공간 확보를 위해 메모리를 잃은 상태. 준비 상태인 프로세스가 아예 없는 경우 발생하기도 함
- Suspended Blocked -> Blocked : 메모리가 확보되어 대기가 된 경우
- Suspended Blocked -> Suspended Ready : 입출력이나 기다리던 사건이 종료된 경우


https://velog.io/@mingadinga_1234/%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EB%9E%80-%ED%94%84%EB%A1%9C%EC%84%B8%EC%8A%A4%EC%9D%98-%EC%83%81%ED%83%9C