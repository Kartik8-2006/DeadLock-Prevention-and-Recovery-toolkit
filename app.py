"""Flask app exposing required endpoints and serving the UI"""
from flask import Flask, jsonify, request, render_template, send_from_directory
from resource_manager import ResourceManager
from bankers import request_grant_check, is_safe_state
from detect import build_wfg, find_cycles
from recovery import preempt_resources, terminate_process, rollback_to_checkpoint
from simulator import Simulator
import threading

app = Flask(__name__, static_folder='static', template_folder='templates')

# initialize a default resource manager when app starts (example totals)
manager = ResourceManager([10, 5, 7])  # example 3 resource types
sim = Simulator(manager, poll_interval=1.5)
def on_deadlock(cycles, snapshot):
    # simply print — UI will poll /wfg
    print('Deadlock detected:', cycles)
sim.on_deadlock = on_deadlock
sim.start()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/process/create', methods=['POST'])
def create_process():
    data = request.json or {}
    pid = str(data.get('pid'))
    maximum = data.get('maximum')
    priority = int(data.get('priority', 0))
    if not pid or maximum is None:
        return jsonify({'error':'pid and maximum required'}), 400
    try:
        manager.add_process(pid, maximum, priority=priority)
        return jsonify({'status':'created', 'pid':pid})
    except Exception as e:
        return jsonify({'error':str(e)}), 400

@app.route('/api/request', methods=['POST'])
def request_resource():
    data = request.json or {}
    pid = str(data.get('pid'))
    request_vec = data.get('request')
    mode = data.get('mode','banker')  # banker or immediate
    if not pid or request_vec is None:
        return jsonify({'error':'pid and request required'}), 400
    try:
        if mode == 'banker':
            safe, order, avail = request_grant_check(manager.total, manager.allocations, manager.maximum, pid, request_vec)
            if safe:
                manager.request_resources(pid, request_vec)
                return jsonify({'status':'allocated','safe':True,'order':order})
            else:
                manager.waiting.append((pid, request_vec))
                return jsonify({'status':'waiting','safe':False,'order':order}), 200
        else:
            resp = manager.request_resources(pid, request_vec)
            return jsonify(resp)
    except Exception as e:
        return jsonify({'error':str(e)}), 400

@app.route('/api/release', methods=['POST'])
def release():
    data = request.json or {}
    pid = str(data.get('pid'))
    release_vec = data.get('release')
    if not pid or release_vec is None:
        return jsonify({'error':'pid and release required'}), 400
    try:
        resp = manager.release_resources(pid, release_vec)
        return jsonify(resp)
    except Exception as e:
        return jsonify({'error':str(e)}), 400

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify(manager.snapshot())

@app.route('/api/state', methods=['GET'])
def state():
    return jsonify(manager.snapshot())

@app.route('/api/wfg', methods=['GET'])
def wfg():
    snap = manager.snapshot()
    wfg = build_wfg(snap)
    cycles = find_cycles(wfg)
    return jsonify({'wfg': wfg, 'cycles': cycles})

@app.route('/api/recover', methods=['POST'])
def recover():
    data = request.json or {}
    action = data.get('action')
    pid = str(data.get('pid')) if data.get('pid') is not None else None
    if action == 'preempt' and pid:
        vec = data.get('vector') or [0]*len(manager.total)
        try:
            preempt_resources(manager, pid, vec)
            return jsonify({'status':'preempted','pid':pid})
        except Exception as e:
            return jsonify({'error':str(e)}), 400
    elif action == 'terminate' and pid:
        try:
            terminate_process(manager, pid)
            return jsonify({'status':'terminated','pid':pid})
        except Exception as e:
            return jsonify({'error':str(e)}), 400
    elif action == 'rollback' and pid:
        try:
            rollback_to_checkpoint(manager, pid)
            return jsonify({'status':'rolledback','pid':pid})
        except Exception as e:
            return jsonify({'error':str(e)}), 400
    else:
        return jsonify({'error':'invalid action or missing pid'}), 400

@app.route('/api/reset', methods=['POST'])
def reset():
    global manager
    try:
        # Reinitialize the resource manager with default values
        manager = ResourceManager([10, 5, 7])
        return jsonify({'status':'reset', 'message':'All processes cleared'})
    except Exception as e:
        return jsonify({'error':str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
