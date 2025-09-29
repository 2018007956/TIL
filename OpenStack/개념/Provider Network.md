클라우드 환경인 OpenStack 등에서 서비스 제공자가 직접 구축하여 VM(가상 머신)에 할당하는 네트워크를 의미한다. **서비스하는 사람이 '제공'하는 네트워크라는 의미에서 Provider Network라고 한다.**
인터넷에 직접 연결되어 있는 것이 특징이며, 서비스 제공자가 외부 네트워크를 관리하고 이 네트워크를 VM에게 제공하는 형태로 작동한다. 
- 일반적인 인터넷 서비스 제공자(ISP)가 구축한 네트워크를 사용하여 사용자에게 인터넷 서비스를 제공하는 것과 유사한 개념이다.
- 데이터 센터의 네트워크를 직접 구축하여 클라우드 서비스를 운영하는 경우, 이 데이터 센터 네트워크가 Provider Netowrk 역할을 한다.

|구분|설명|
|---|---|
|**External Network**|Floating IP를 할당하거나, VM이 외부 인터넷과 통신하기 위해 쓰는 네트워크. 보통 provider network 중 하나를 external=True 로 지정해서 사용.|
|**Tenant Network (Private Network)**|사용자가 생성하는 내부 가상망. VXLAN/Geneve 같은 오버레이를 통해 구현됨. VM끼리만 통신 가능, 외부와는 직접 연결 안 됨.|
|**Provider Network**|Neutron이 관리하지만, 실제 물리망과 직결됨. external network일 수도 있고, 내부 VLAN망일 수도 있음.|
- external=True 만들면 외부 인터넷/FIP 용도로 쓰는 **External Network**가 되고,
- external=False로 만들면 그냥 **물리 VLAN 기반 내부망**이 됨 (예: 회사 내부 망과 바로 연결된 VM망)