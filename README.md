# Deadlock Prevention & Recovery Toolkit

This project is a working toolkit that demonstrates deadlock prevention (Banker's), detection (Wait-For Graph + cycle detection),
and recovery (preemption/termination/rollback) strategies with a Flask REST API and a futuristic web UI.

## Features
- Banker's algorithm safety check and request handling.
- Simple Resource Manager (dynamic processes, request/release, waiting queue).
- Wait-For Graph generator and cycle detection.
- Recovery strategies (preempt, terminate, rollback - simplified).
- REST endpoints:
  - `POST /api/process/create`  -> create process {pid, maximum}
  - `POST /api/request` -> request resources {pid, request, mode}
  - `POST /api/release` -> release resources {pid, release}
  - `GET /api/status` -> current system snapshot
  - `GET /api/wfg` -> wait-for graph and cycles
  - `POST /api/recover` -> recovery actions {action, pid, vector}
- Futuristic UI with D3.js WFG visualization.

## Project Structure
See the files in the repository. Key modules:
- `resource_manager.py`, `bankers.py`, `detect.py`, `recovery.py`, `simulator.py`, `app.py`
- `templates/` and `static/` for UI

## Run locally (Linux / WSL / macOS)
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```
Visit http://localhost:5000

## Notes & Testing
- The implementation is intentionally readable and modular.
- It includes basic error handling and uses threading locks.
- For production, consider using a production WSGI server, authentication, persistence (SQLite), and WebSockets for real-time updates.

