"""Banker's algorithm implementation (safety + request)"""
from copy import deepcopy

def is_safe_state(total, allocations, maximum):
    # total: list, allocations: {pid: [..]}, maximum: {pid: [..]}
    n = len(total)
    avail = [total[i] - sum(allocations[p][i] for p in allocations) for i in range(n)]
    need = {p: [maximum[p][i] - allocations[p][i] for i in range(n)] for p in allocations}
    finish = {p: False for p in allocations}
    order = []
    changed = True
    while changed:
        changed = False
        for p in allocations:
            if not finish[p] and all(need[p][i] <= avail[i] for i in range(n)):
                # can satisfy
                for i in range(n):
                    avail[i] += allocations[p][i]
                finish[p] = True
                order.append(p)
                changed = True
    safe = all(finish.values())
    return safe, order, avail

def request_grant_check(total, allocations, maximum, pid, request):
    # simulate granting request and check safe
    alloc_copy = deepcopy(allocations)
    alloc_copy[pid] = [alloc_copy[pid][i] + request[i] for i in range(len(request))]
    safe, order, avail = is_safe_state(total, alloc_copy, maximum)
    return safe, order, avail
