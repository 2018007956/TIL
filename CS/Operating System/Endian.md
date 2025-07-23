엔디안은 컴퓨터의 메모리와 같은 1차원 공간에 여러 개의 연속된 대상을 배열하는 방법
- 큰 단위가 앞에 오는 Big endian  ex) Sparc CPU
- 작은 단위가 앞에 오는 Little endian  ex) Intel CPU
- 두 경우에 속하지 않거나 둘을 모두 지원하는 Middle endian

다른 방식의 엔디안 사이에서 통신이 일어난다면 문제 발생 => 네트워크에서는 빅 엔디안으로 통일