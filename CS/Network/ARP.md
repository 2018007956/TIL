Address Resolution Protocol

IP 주소로부터 MAC 주소를 구하는 프로토콜
반대 : RARP

IP 주소에서 ARP를 통해 MAC 주소를 찾아 MAC 주소를 기반으로 컴퓨터 간에 통신함

[ ARP의 주소를 찾는 과정 ]
![[Pasted image 20241023000509.png|500]]
1. 장치 A가 ARP Request 브로드캐스트를 보내서 IP 주소에 해당하는 MAC 주소를 찾음
2. 해당 주소에 맞는 장치 B가 ARP Reply 유니캐스트를 통해 MAC 주소 반환