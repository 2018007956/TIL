OpenStack SDK, CLI 테스트의 구조는 대부분 BDD 구조를 따름

**BDD란?**
행위 주도 개발(Behavior Driven Development)의 약자로
==시스템의 동작/행위==를 기반으로 한 테스트 코드

**Given**
	테스트 대상 행위를 일으키기 위한 초기 셋업
**When**
	테스트 대상 행위를 발생시키는 이벤트 기술
**Then**
	이벤트 발생 시 기대하는 결괏값들을 확인

Ex) **Feature** ; 옵션(플래그) 없이 서버 리스트 조회기능 테스트
**Given**
	옵션이 없는 인자(no args)로
**When**
	서버 리스트 명령어를 실행했을 때
**Then**
	예상(expected)되는 컬럼의 구조와 데이터를 확인한다
```python
def test_server_list_no_option(self):
	## Given
	arglist = []
	veritylist = [
		('all_projects', False),
		('long', False),
		('deleted', False),
		('name_lookup_one_by_one', False),
	]
	parsed_args = self.check_parser(self.cmd, arglist, verifylist)
	
	## When
	columns, data = self.cmd.take_action(parsed_args)

	## Then
	self.compute_sdk_client.servers.assert_called_with(**self.kwargs)
	self.image_client.images.assert_called()
	self.compute_sdk_client.flavors.assert_called()
	# We did not pass image or flavor, so gets on those must be absent
	self.assertFalse(self.flavors_mock.get.call_count)
	self.assertFalse(self.image_client.get_image.call_count)
	self.assertEqual(self.columns, columns)
	self.assertEqual(self.data, tuple(data))
```