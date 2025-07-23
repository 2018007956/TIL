트랜잭션은 데이터베이스 상태를 변환시키는 작업의 단위
## ACID
1. Atomicity 원자성
	한 트랜잭션의 연산은 모두 성공하거나, 모두 실패해야한다.
2. Consistency 일관성, 정합성
	트랜잭션 처리 후에도 데이터의 상태는 일관되어야 한다.
3. Isolation 격리성
	트랜잭션 수행 시 다른 트랜잭션의 연산이 끼어들지 못하도록 보장한다. 하나의 트랜잭션이 다른 트랜잭션에게 영향을 주지 않도록 격리되어 수행되어야한다.
4. Durability 지속성
	성공적으로 수행된 트랜잭션은 영원히 반영되어야 한다. 중간에 DB에 오류가 발생해도 다시 복구되어야 한다. 즉, 트랜잭션에 대한 로그가 반드시 남아야한다는 의미이기도 하다.
## 트랜잭션 격리수준
Transaction Isolation Level
여러 트랜잭션이 동시에 처리될 때, 특정 트랜잭션이 다른 트랜잭션에서 변경하거나 조회하는 데이터를 볼 수 있게 허용할지 여부를 결정하는 것

격리성이 보장되면, 트랜잭션이 순차적으로 처리되고, 데이터의 정확성은 보장된다. 트랜잭션이 많아질수록 트랜잭션이 처리되는 속도가 느려지게 되고, 어플리케이션 운용에 심각한 문제가 발생할 수 있다. 
**준수한 처리 속도를 위해서는 트랜잭션의 완전한 격리가 아닌 완화된 수준의 격리**가 필요하다. **속도와 데이터 정확성에 대한 트레이드 오프를 고려하여 트랜잭션의 격리성 수준을 나눈것이 바로 트랜잭션의 격리수준**이다.

(MySQL)
격리수준 - 낮음
- Uncommitted Read
- Committed Read
- Repeatable Read <- MySQL의 기본 격리수준
- Serializable
격리수준 - 높음

### Uncommitted Read
다른 트랜잭션에서 커밋되지 않은 데이터에 접근할 수 있게 하는 가장 저수준의 격리수준. 일반적으로 사용X
- 커밋되지 않은 트랜잭션에 접근하여 부정합을 유발할 수 있는 데이터를 읽는 것 : Dirty Read
### Committed Read
다른 트랜잭션에서 커밋된 데이터로만 접근할 수 있게 하는 격리 수준. MySQL을 제외하고 대부분 이를 기본 격리수준으로 사용
- 하나의 트랜잭션에서 동일한 SELECT 쿼리를 실행했을 때 다른 결과가 나타남 : Non Repeatable Read 현상
### Repeatable Read
커밋된 데이터만 읽을 수 있되, 자신보다 낮은 트랜잭션 번호를 갖는 트랜잭션에서 커밋한 데이터만 읽을 수 있는 격리수준
- 오라클은 Repeatable Read 수준을 지원하지 않는데, Non Repeatable Read 문제를 어떻게 해결? => **Exclusive Lock** 사용
- Exclusive Lock (배타적 잠금/쓰기 잠금) : 특정 레코드나 테이블에 대해 다른 트랜잭션에서 읽기, 쓰기 작업을 할 수 없도록 하는 Lock
	- `SELECT ~ FOR UPDATE` 구문을 통해 사용
	- UPDATE, DELETE에 대한 Lock을 걸어 읽기, 쓰기 작업을 막을 수 있지만, INSERT에 대한 Lock은 걸 수 없다
	- -> Exclusive Lock 사용해도 다른 트랜잭션에서 INSERT 작업 가능
	- -> Phantom Read (유령 읽기) 현상 발생
### Serializable
트랜잭션을 무조건 순차적으로 실행시키는 가장 고수준의 격리수준
SELECT 쿼리 실행 시 Shared lock을,
INSERT, UPDATE, DELETE 쿼리 실행 시 Exclusive Lock (MySQL의 경우 Next Key Lock)을 걸어버림
동시 처리가 불가능하여 처리 속도 느려짐


[[DB] 트랜잭션 격리수준 (Isolation Level) 에 쉽게 이해하기 :: 영암사는 승경이네](https://tlatmsrud.tistory.com/118#google_vignette)
https://mangkyu.tistory.com/299