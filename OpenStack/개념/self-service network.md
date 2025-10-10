사용자가 직접 네트워크 자원을 할당하고 관리할 수 있도록 제공되는 가상 네트워크 환경으로,
클라우드 컴퓨팅 환경에서 각 사용자 또는 프로젝트가 독립적으로 네트워크를 구성하고 관리할 수 있게 해준다.

서비스 제공자(Provider)가 미리 구축한 네트워크를 할당받는 Provider Network와 달리, 사용자가 직접 가상 라우터, 서브넷 등을 생성하여 자신만의 네트워크를 구성하고 통신을 제어할 수 있도록 하는 방식이다.

VXLAN, Geneve와 같은 오버레이 세그멘테이션 방식을 사용하여 self-service 네트워크를 가능하게 하며 layer-3 (라우팅) 서비스를 포함하는 [[Provider Network]]의 확장판이다. 근본적으로는 가상 네트워크를 NAT를 사용하여 물리 네트워크로 라우팅한다. 

해당 네트워크는 IP 주소를 인스턴스에 제공하는 DHCP 서버를 포함한다. 해당 네트워크에서 한 개의 인스턴스는 자동으로 Internet과 같은 외부 네트워크에 자동으로 액세스 가능하다. 그러나 인스턴스가 Internet과 같은 외부 네트워크로부터 해당 네트워크에 대한 액세스를 하기 위해서는 floating IP address를 필요로한다.
![[Pasted image 20251004233346.png]]

### self-service network와 tenant network
![[Pasted image 20251010141604.png|300]]
- provider network <-> self-service network
- external network <-> tenant network

self-service network의 의미가 tenant network를 오픈스택에서 맘대로 생성가능한 네트워크인 것