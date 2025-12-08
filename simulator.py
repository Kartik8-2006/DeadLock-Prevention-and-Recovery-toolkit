"""Simple simulator that periodically polls for deadlocks and logs events."""
import threading, time
from detect import build_wfg, find_cycles
from bankers import is_safe_state

class Simulator(threading.Thread):
    def __init__(self, manager, poll_interval=2.0, on_deadlock=None):
        super().__init__(daemon=True)
        self.manager = manager
        self.poll_interval = poll_interval
        self.on_deadlock = on_deadlock
        self._stop = threading.Event()
        self.deadlock_logged = False  # Track if deadlock already logged

    def run(self):
        while not self._stop.is_set():
            snapshot = self.manager.snapshot()
            wfg = build_wfg(snapshot)
            cycles = find_cycles(wfg)
            if cycles:
                if callable(self.on_deadlock) and not self.deadlock_logged:
                    self.on_deadlock(cycles, snapshot)
                    self.deadlock_logged = True  # Log only once
            else:
                # Reset flag when deadlock clears
                if self.deadlock_logged:
                    self.deadlock_logged = False
            time.sleep(self.poll_interval)

    def stop(self):
        self._stop.set()
