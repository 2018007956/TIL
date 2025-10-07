network 노드의 ovn-controller가 반복적으로 재시작되고 있음
![[Pasted image 20251007201131.png]]
`Referenced but unset environment variable evaluates to an empty string: 'OVN_CTL_OPTS'` 이 메시지를 보면, systemd가 `/etc/default/ovn-controller` 파일에서 `OVN_CTL_OPTS`를 참조하고 있는데, 값이 설정되어 있지 않다
(이 변수가 비어있으면 `ovn-controller`가 기동 시 제대로 인자 전달을 못 받아서  
DB 연결, datapath sync 등의 루틴이 중간에서 깨질 수 있음
-> connection-status는 connected로 보이지만 실제로 논리포트/라우터 반영이 안 되는 상태가 발생) ____확인필요

설정파일 `/etc/default/ovn-host` 에서 다음처럼 수정
```
# OVN northbound / southbound DB 주소 지정
OVN_NB_DB="tcp:192.168.50.121:6641"
OVN_SB_DB="tcp:192.168.50.121:6642"

# 컨트롤러 옵션
OVN_CTL_OPTS="--db-nb-addr=$OVN_NB_DB --db-sb-addr=$OVN_SB_DB"
```
- 서비스 재시작
	sudo systemctl daemon-reload
	sudo systemctl restart ovn-host
	sudo systemctl status ovn-host

환경변수 정상 인식하여 `unset OVN_CTL_OPS` 경고가 없는 것을 볼 수 있음
마지막 로그 타임스탬프 (19:49:11) 이후 서비스가 재시작 루프에 빠져 있지 않음
![[Pasted image 20251007201511.png]]
즉, `ovn-host`가 정상적으로 올라와서 내부적으로 `ovn-controller`를 실행 중이고, 
DB 연결, Geneve 터널, 라우터 플로우까지 모두 안정적으로 동기화 중

(`ovn-controller`는 `ovn-host`의 하위 구성요소로서 자동 제어됨)

- `ovn-host.service` = “상위 관리 유닛”
    - 내부적으로 `ovn-controller` 프로세스를 시작하고 중지함
- `ovn-controller.service` = “하위 종속 유닛”
    - 직접 켜거나 끄면 systemd 종속 트리 때문에 상위(`ovn-host`)도 같이 영향을 받음


