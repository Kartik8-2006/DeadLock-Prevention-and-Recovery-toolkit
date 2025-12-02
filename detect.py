"""Deadlock detection using Wait-For Graph (WFG) and cycle detection (DFS)"""
from collections import defaultdict, deque

def build_wfg(snapshot):
    # snapshot: dict from ResourceManager.snapshot()
    # construct edges p->q if p is waiting for resources held by q
    allocations = snapshot['allocations']
    waiting = snapshot['waiting']
    wfg = defaultdict(set)
    # for each waiting request, find processes that hold needed units
    for pid, req in waiting:
        for res_idx, units in enumerate(req):
            if units <= 0:
                continue
            for holder, alloc in allocations.items():
                if holder == pid:
                    continue
                if alloc[res_idx] > 0:
                    wfg[pid].add(holder)
    return {k: list(v) for k,v in wfg.items()}

def find_cycles(wfg):
    # detect cycles and return list of cycles (each cycle is list of nodes)
    visited = set()
    stack = []
    onstack = set()
    cycles = []
    def dfs(u):
        visited.add(u)
        stack.append(u)
        onstack.add(u)
        for v in wfg.get(u, []):
            if v not in visited:
                dfs(v)
            elif v in onstack:
                # found cycle: nodes from v..end
                if v in stack:
                    idx = stack.index(v)
                    cycles.append(stack[idx:].copy())
        stack.pop()
        onstack.remove(u)
    for node in list(wfg.keys()):
        if node not in visited:
            dfs(node)
    # deduplicate cycles (sort canonical)
    uniq = []
    seen = set()
    for c in cycles:
        key = tuple(sorted(c))
        if key not in seen:
            seen.add(key)
            uniq.append(c)
    return uniq
