OVN이 provider 네트워크를 물리 세상과 연결하는 문
provider 네트워크는 **가상 L2 → 물리 L2로 나가는 출구가 필요**한데  
그 출구 역할을 provnet-* 포트가 수행한다.

`provnet-<uuid>`는 ==Provider 네트워크를 br-ex에 연결하는 **OVN의 localnet 포트**이다.== 
- Neutron에서 provider network (public network)를 만들 때, `--provider-physical-network phynet2` 값을 넣었는데, 
- OVN이 이 값을 보고 
  **"아, phynet2라는 물리망은 br-ex에 붙여놨구나"** 를 이해하고,
- 그 매핑을 실현하기 위해, br-ex 위에 localnet 타입의 포트를 하나 생성한다
  그게 바로: provnet-<uuid>