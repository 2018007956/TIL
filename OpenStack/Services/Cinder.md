블록 스토리지 서비스인 Cinder는 Nova에서 생성된 인스턴스에 확장해서 사용할 수 있는 저장 공간을 생성, 삭제하고 인스턴스에 연결할 수 있는 기능을 제공한다. 

## Logical Architecture로 보는 Cinder
논리 아키텍처에서 Cinder는 cinder-api, Queue, Cinder Database, cinder-volume, Volume Provider, cinder-scheduler로 구성되어 있다. 

- cinder-api : 볼륨을 추가, 삭제
- cinder-volume : 볼륨을 실제로 생성하고 Cinder Database에 볼륨 정보를 업데이트
- Cinder : 물리 하드 디스크를 LVM(Logical Volume Manager)으로 설정
- 설정한 LVM은 cinder.conf와 nova.conf의 환경을 설정해서 cinder-volume을 할당 가능
- cinder-api로 생성된 볼륨은 단일 인스턴스 또는 여러 인스턴스에 할당 가능

## Cinder가 지원하는 블록 스토리지 드라이버
Cinder의 기본 블록 스토리지 드라이버는 iSCSI 기반의 LVM(Logical Volume Manager)이다. 

LVM은 하드 디스크를 파티션 대신 논리 볼륨(Logical Volume, LV)으로 할당하고, 디스크 여러 개를 좀 더 효율적이고 유연하게 관리할 수 있는 방식을 말한다.

LVM 논리 볼륨의 기본 물리 스토리지 단위는 파티션이나 전체 디스크 같은 블록 장치이다. 이런 장치는 물리 볼륨(Physical Volumes, PV)으로 초기화해야 하며, 논리 볼륨을 생성하려면 물리 볼륨을 볼륨 그룹(Volume Groups, VG)으로 통합해야 한다. 그리고 논리 볼륨을 할당할 수 있는 디스크 공간을 생성한다.

또 논리 볼륨 그룹은 논리 볼륨 여러 개로 나누며 이 논리 볼륨에는 마운트 지점(예: /home과 /)과 파일 시스템 유형(예: ext3)이 부여된다. 예를 들어 **==파티션 용량이 가득 차면 논리 볼륨 그룹(VG)에서 여유 공간을 가져와 논리 볼륨(LV)으로 추가해 그 파티션 용량을 확장시킨다.==** 새로운 하드 드라이브를 운영체제에 추가하면 이 하드 드라이브는 논리 볼륨 그룹과 확장 가능한 파티션인 논리 볼륨으로 추가된다.

[[Cinder]]는 LVM의 이 특성을 이용해서 **논리 볼륨을 생성하고, 생성된 볼륨을 인스턴스에 할당해 디스크처럼 사용한다.**


- **PV (Physical Volume)** : 실제 디스크나 파티션을 LVM에 등록한 것
- **VG (Volume Group)** : 여러 PV를 묶어 만든 저장소 풀
- **LV (Logical Volume)** : VG에서 잘라내어 실제로 사용하는 논리 디스크


https://naleejang.tistory.com/108