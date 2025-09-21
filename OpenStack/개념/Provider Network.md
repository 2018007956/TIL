클라우드 환경인 OpenStack 등에서 서비스 제공자가 직접 구축하여 VM(가상 머신)에 할당하는 네트워크를 의미한다. **서비스하는 사람이 '제공'하는 네트워크라는 의미에서 Provider Network라고 한다.**
인터넷에 직접 연결되어 있는 것이 특징이며, 서비스 제공자가 외부 네트워크를 관리하고 이 네트워크를 VM에게 제공하는 형태로 작동한다. 
- 일반적인 인터넷 서비스 제공자(ISP)가 구축한 네트워크를 사용하여 사용자에게 인터넷 서비스를 제공하는 것과 유사한 개념이다.
- 데이터 센터의 네트워크를 직접 구축하여 클라우드 서비스를 운영하는 경우, 이 데이터 센터 네트워크가 Provider Netowrk 역할을 한다.

## Self-Service Network
오픈스택을 사용하는 사용자(Tenant)가 직접 자신만의 vm instance를 위한 네트워크를 구축할 수 있는 네트워크이다. 이 네트워크는 provider network를 기반으로 GRE, VXLAN 등의 터널링을 통해 구축된다.


- Provider Network = External Network
- Self-Service Network = Tunnel Network + External Network