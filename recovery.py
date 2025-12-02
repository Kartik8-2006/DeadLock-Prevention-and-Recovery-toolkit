"""Recovery strategies: preemption and termination, rollback via checkpoints (simplified)"""
def preempt_resources(manager, victim_pid, resource_vector):
    # resource_vector: list of units to preempt (will be removed from allocation)
    if victim_pid not in manager.allocations:
        raise KeyError('victim not found')
    for i in range(len(resource_vector)):
        # cannot preempt more than allocated
        pre = min(resource_vector[i], manager.allocations[victim_pid][i])
        manager.allocations[victim_pid][i] -= pre
    return True

def terminate_process(manager, pid):
    # free resources and remove process
    if pid not in manager.allocations:
        raise KeyError('pid not found')
    # we simply remove process (its allocations freed)
    del manager.allocations[pid]
    if pid in manager.maximum:
        del manager.maximum[pid]
    if pid in manager.processes:
        del manager.processes[pid]
    # remove waiting entries
    manager.waiting = [w for w in manager.waiting if w[0] != pid]
    return True

def rollback_to_checkpoint(manager, pid):
    meta = manager.processes.get(pid, {})
    cp = meta.get('checkpoint')
    if not cp:
        raise RuntimeError('No checkpoint')
    # cp expected to contain allocation vector
    manager.allocations[pid] = cp
    return True
