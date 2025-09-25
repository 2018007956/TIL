**문제 상황**
컴퓨트 노드 ssh 접속 안됨
![[Pasted image 20250925141437.png|300]]
- 클라이언트가 서버(192.168.50.122:22)로 SSH 연결 시도를 하고 있음.
- 서버 NIC(`enp6s18`, `br-ex`)에 패킷은 도착하고 있음.
- 그런데 **서버 쪽에서 아무 응답도 내보내지 않는 상황**

**원인 분석**
1. sshd가 포트를 열지 않는지 확인
	![[Pasted image 20250925141925.png]]
	- `systemctl status sshd`
	    - `Active: active (running)` → **sshd 서비스는 정상적으로 실행 중**
	    - 로그에 `Server listening on 0.0.0.0 port 22` / `Server listening on :: port 22` → **IPv4/IPv6 모든 인터페이스에서 포트 22 리슨 중**
	- `ss -tnlp | grep :22`
	    `LISTEN 0 4096 0.0.0.0:22   0.0.0.0:*   users:(("sshd"...)) LISTEN 0 4096 [::]:22      [::]:*      users:(("sshd"...))`
	    → IPv4 `0.0.0.0:22` 와 IPv6 `[::]:22` 둘 다 리슨 상태. 
	    즉, **특정 인터페이스에만 묶여 있는 게 아니라 전체 NIC에서 SSH 요청을 받을 수 있는 상태**
	- `grep -i '^ListenAddress' /etc/ssh/sshd_config` → 아무것도 출력 없음.
	    - 설정 파일에 ListenAddress가 명시돼 있지 않다는 뜻
	    - 기본 동작은 **모든 인터페이스에서 리슨**하는 것 → 위 ss 출력과 일치
	    
	=> 서비스가 죽은 상태도 아니고, 특정 인터페이스에만 묶여 있는 것도 아님
	=> 서버 자체는 22번 포트를 모든 인터페이스에서 잘 열고 있는 상황

2. ssh 접속 시 나오는 메시지 확인
	![[Pasted image 20250925143044.png]]
	- `ssh -vvv ubuntu@192.168.50.122` → `Connecting to ... port 22.` 까지 나오고 이후 진행이 멈춤. (즉, SYN 보내고 응답이 오지 않음 = **타임아웃**)
	- `nc -vz 192.168.50.122 22` 도 같은 상태에서 멈춤. (즉, TCP 핸드셰이크조차 완료되지 않음)
    즉, **서버에서 22번 포트를 정상적으로 리슨 중인데, 네트워크 레벨에서 패킷이 차단/드롭되고 있는 상황**

**문제 원인 : 브릿지(br-ex) 포워딩 문제**
IP가 br-ex가 아니라 enp6s18에 붙어 있어서 응답을 내보내지 못하는 상황
![[Pasted image 20250925181757.png]]
- `192.168.50.122` IP가 **`enp6s18`에 직접 붙어 있음
- `br-ex`에는 IPv4가 없음 (IPv6만 있음)
![[Pasted image 20250925181854.png]]
- 라우팅 테이블에서도 기본 게이트웨이(`192.168.50.1`)가 `enp6s18`을 통해 설정됨

=> OpenStack에서 외부 네트워크(`br-ex`)를 쓸 때는, **외부 접근 IP는 `br-ex`에 붙어야 정상적으로 브릿지를 통해 응답**이 나가는데, 지금은 IP가 `enp6s18`에 직접 붙어있어서, 요청은 들어오지만 Open vSwitch / Neutron 경로를 안 타고, 응답이 엉뚱한 경로에서 drop될 수 있음

**해결 방법**
- NIC(enp6s18)는 OVS bridge(`br-ex`)의 **slave**여야 하고,
- 실제 서비스용 IP(192.168.50.122)는 **`br-ex`에 붙어 있어야 함**.

**해결 과정**
1. `enp6s18`에서 IP 제거
   `ip addr flush dev enp6s18`
2. `br-ex`에 IP 추가
   ```
   ip addr add 192.168.50.122/24 dev br-ex
   ip link set br-ex up
   ```

![[Pasted image 20250925182242.png]]SSH 접속 성공!