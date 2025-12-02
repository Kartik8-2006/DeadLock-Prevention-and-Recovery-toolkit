from bankers import is_safe_state, request_grant_check
def test_simple_safe():
    total = [10,5,7]
    allocations = {'P0':[0,1,0],'P1':[2,0,0],'P2':[3,0,2],'P3':[2,1,1],'P4':[0,0,2]}
    maximum = {'P0':[7,5,3],'P1':[3,2,2],'P2':[9,0,2],'P3':[2,2,2],'P4':[4,3,3]}
    safe, order, avail = is_safe_state(total, allocations, maximum)
    assert safe
