1. 라우터에 연결된 플로팅 IP 확인
   `openstack port list --router private-router`
   `openstack floating ip list`
2. 플로팅 IP 연결 해제 및 삭제
   `openstack floating ip delete <floating_ip_id>`
3. 라우터 게이트웨이 해제
   `openstack router unset --external-gateway private-router`
4. 네트워크 삭제
   `openstack network delete public-network`
5. 네트워크 재생성
```
openstack network create public-network \
   --external \
   --provider-network-type flat \
   --provider-physical-network phynet2
```
6. 서브넷 생성
```
openstack subnet create public-subnet \
	--network public-network \
	--subnet-range 192.168.50.0/24 \
	--gateway 192.168.0.1 \
	--allocation-pool start=192.168.50.100,end=192.168.50.200 \
	--dns-nameserver 1.1.1.1 \
	--dns-nameserver 1.0.0.1
```
