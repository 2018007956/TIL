**문제 상황**
![[Pasted image 20250927194339.png]]
생성된 인스턴스 콘솔을 열어보면 부팅에서 멈춤
인스턴스가 디스크는 잡았지만 **부팅 가능한 OS를 찾지 못한 상황**

**원인 : 이미지 포맷/아키텍처 불일치**
`cirros-0.6.3-aarch64` 이미지는 ARM64용인데, 기본적으로 OpenStack Nova/KVM은 `x86_64` 머신 타입을 사용한다. 즉, x86 가상머신에 ARM 이미지를 넣었으니 부팅할 수 없어 BIOS에서 멈추는 것이다.
![[Pasted image 20250927200048.png|250]]
=> `x86` 서버이기 때문에 `aarch64` 이미지가 아닌 `x86_64` 이미지를 써야 함

![[Pasted image 20250927194257.png]]
Cirros 인스턴스 접속 성공!

---

그리고 처음에 horizon 대시보드에서 콘솔을 열 때, os-controller 이름을 인식 못해서 연결이 안되는데, 로컬에서 `C:\Windows\System32\drivers\etc\hosts` (리눅스에서의 `/etc/hosts` 파일임) 위치에 서버 이름과 주소 매핑 정보를 저장해줘야함

192.168.50.121 os-controller
192.168.50.122 os-compute
192.168.50.123 os-storage
