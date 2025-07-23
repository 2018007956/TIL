클라이언트가 서버에게 사용자 요청의 목적을 알리는 '수단'

| 종류      | 기능                             |
| ------- | ------------------------------ |
| GET     | 데이터 조회                         |
| POST    | 요청 데이터 처리 (보통 데이터 등록 사용)       |
| PUT     | 전체 수정 (해당 데이터가 없으면 생성, [[멱등]]) |
| PATCH   | 부분 수정 (멱등 X)                   |
| DELETE  | 데이터 삭제                         |
| HEAD    | 서버 리소스의 헤더(메타 데이터의 취득)         |
| OPTIONS | 리소스가 지원하고 있는 메소드의 취득           |
| CONNECT | 프록시 동작의 터널 접속을 변경              |

## GET과 POST의 차이점
- GET은 데이터를 헤더에 추가하여 전송 > URL에 데이터가 노출되므로 보안적으로 중요한 데이터를 포함해서는 안됨
- POST는 데이터를 Body에 추가하여 전송 > URL에 데이터가 노출되지 않아 GET보다는 안전
![[Pasted image 20241025114358.png|500]]

## PATCH의 방식
### JsonPatch
- 커맨드 방식으로 동작
- op, path, value 3개의 항목으로 구성되어 있으며 각 항목을 사용
	- op : 작업유형 (add, remove, replace, move, copy or test 중에 하나만 사용 가능)
	- path : 변경할 데이터 경로
	- value : 변경할 값
- content-type : application/json-patch+json
### JsonMergePatch
- JsonPatch보다 단순하고 간단
- 변경하려는 데이터를 json 형식으로 작성하여 던지면 해당되는 데이터들이 merge되는 방식
- 키를 null로 변경하는 것은 삭제를 의미
- content-type : application/merge-patch+json

>답변 포인트! 실제로 JsonMergePatch 방식이 더 간단하고 편했다는 실제 사용 예시를 같이 말해주면 좋음