Remote Procedure Call
[[IPC]](Inter-Process Communication) 방법의 한 종류로 원격지의 프로세스에 접근하여 프로시저 또는 함수를 호출하여 사용하는 방법

별도의 원격 제어를 위한 코딩 없이 **다른 주소 공간에서 리모트의 함수나 프로시저를 실행 할 수 있게 해주는 프로세스간 통신**입니다. 즉, 위치에 상관없이 RPC를 통해 개발자는 위치에 상관없이 원하는 함수를 사용할 수 있습니다.

분산컴퓨팅 환경에서 많이 사용되어왔으며, 현재는 MSA(Micro Software Architecture)에서 많이 사용되는 방식이다. 서로 다른 환경이지만 서비스 간의 프로시저 호출을 가능하게 해줌에 따라 언**어에 구애받지 않고 환경에 대한 확장이 가능**하며, 좀 더 **비지니스 로직에 집중하여 생산성을 증가**시킬 수 있다. 

[ HTTP 위에서 구현된 RPC 방식 예시 ]
아래의 HTTP 스키마는 HTTP Client (웹 브라우저) 를 통해 HTTP Server (웹 서버) 에 전달될 것이고, WAS 는 위의 프로토콜을 처리하기 위한 로직을 구현하게 된다

```rpc
POST /sayHello HTTP/1.1
HOST: api.example.com
Content-Type: application/json

{"name": "Tom"}
```

RPC는 서버와 클라이언트가 통신하기 위한 API의 통신 패러다임 중 하나이고, REST API와 비교될 수 있는 차원의 개념

|          | REST                                                                  | RPC                                                                      |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Protocol | HTTP                                                                  | 프로토콜에 무관 (TCP, UDP, HTTP, WebSocket, ...)                                |
| Scheme   | Resource 기반의 API 인터페이스  <br>(예) 강아지 목록을 반환하는 API 를 **GET /dogs** 로 설계 | Action 기반의 API 인터페이스  <br>(예) 강아지 목록을 반환하는 API 를 POST **/listDogs** 로 설계 |
| Design   | RESTful API 는 Stateless 를 전제                                          | 제약이나 규약이 없음                                                              |

### gRPC
Google에서 개발한 고성능, 범용 RPC 프레임워크로, 서버 간 통신을 효율적으로 수행할 수 있게 한다. 
백엔드 서비스 간의 통신에서 속도와 효율성을 극대화하기 위해 사용된다.