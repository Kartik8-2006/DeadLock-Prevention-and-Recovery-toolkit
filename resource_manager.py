"""resource_manager.py
Manages processes and resources. Thread-safe.
Exposes a ResourceManager class used by Flask app and simulator.
"""
import threading
from copy import deepcopy

class ResourceManager:
    def __init__(self, total_resources):
        # total_resources: list[int] total units for each resource type
        self.lock = threading.RLock()
        self.total = list(total_resources)
        # allocations: {pid: [a1, a2, ...]}
        self.allocations = {}
        # maximum demands: {pid: [m1, m2, ...]}
        self.maximum = {}
        # need = maximum - allocation (derived)
        # waiting queue: list of (pid, request_vector)
        self.waiting = []
        # process metadata
        self.processes = {}  # pid -> dict (priority, checkpoint)

    def available(self):
        with self.lock:
            used = [0]*len(self.total)
            for alloc in self.allocations.values():
                for i,v in enumerate(alloc):
                    used[i] += v
            return [self.total[i]-used[i] for i in range(len(self.total))]

    def add_process(self, pid, maximum, priority=0):
        with self.lock:
            if pid in self.processes:
                raise ValueError(f"PID {pid} exists")
            if len(maximum) != len(self.total):
                raise ValueError("Maximum vector length mismatch")
            # Check if maximum exceeds total system resources
            if any(maximum[i] > self.total[i] for i in range(len(maximum))):
                raise ValueError(f"Maximum resource requirements exceed system capacity")
            self.processes[pid] = {'priority': priority, 'checkpoint': None}
            self.allocations[pid] = [0]*len(self.total)
            self.maximum[pid] = list(maximum)

    def request_resources(self, pid, request):
        with self.lock:
            if pid not in self.processes:
                raise KeyError("Process not found")
            if any(request[i] > self.maximum[pid][i] - self.allocations[pid][i] for i in range(len(request))):
                raise ValueError("Request exceeds declared maximum need")
            # Simple immediate allocation if available
            avail = self.available()
            if all(request[i] <= avail[i] for i in range(len(request))):
                for i in range(len(request)):
                    self.allocations[pid][i] += request[i]
                return {'status':'allocated', 'alloc': self.allocations[pid]}
            else:
                # queue
                self.waiting.append((pid, list(request)))
                return {'status':'waiting'}

    def release_resources(self, pid, release):
        with self.lock:
            if pid not in self.allocations:
                raise KeyError("Process not found")
            for i in range(len(release)):
                if release[i] > self.allocations[pid][i]:
                    raise ValueError("Release exceeds allocation")
                self.allocations[pid][i] -= release[i]
            # try to fulfill waiting requests (simple FIFO)
            to_remove = []
            for idx,(wpid, wreq) in enumerate(list(self.waiting)):
                if all(wreq[i] <= self.available()[i] for i in range(len(wreq))):
                    for i in range(len(wreq)):
                        self.allocations[wpid][i] += wreq[i]
                    to_remove.append((wpid, wreq))
            for item in to_remove:
                self.waiting.remove(item)
            return {'status':'released'}

    def remove_process(self, pid):
        with self.lock:
            if pid in self.allocations:
                # free allocated
                del self.allocations[pid]
            if pid in self.maximum:
                del self.maximum[pid]
            if pid in self.processes:
                del self.processes[pid]
            # remove waiting entries
            self.waiting = [w for w in self.waiting if w[0] != pid]

    def snapshot(self):
        with self.lock:
            return {
                'total': list(self.total),
                'available': self.available(),
                'allocations': deepcopy(self.allocations),
                'maximum': deepcopy(self.maximum),
                'need': {pid: [self.maximum[pid][i]-self.allocations[pid][i] for i in range(len(self.total))] for pid in self.allocations},
                'waiting': list(self.waiting),
                'processes': deepcopy(self.processes)
            }
