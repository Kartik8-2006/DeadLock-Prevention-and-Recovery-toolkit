# Deadlock Prevention & Recovery - Test Cases

## Test Setup
- **Total System Resources**: [R0:10, R1:5, R2:7]
- **Browser**: Open http://127.0.0.1:5000
- **Expected**: Three sections - Resource Matrices + Graph, Create Process, Activity Log

---

## 1. BASIC PROCESS CREATION TESTS

### Test 1.1: Create Single Process Successfully
**Steps:**
1. Enter PID: `P0`
2. Enter Maximum: `7,3,5`
3. Click Create

**Expected Result:**
- ✅ Success message in Activity Log
- Process P0 appears in Resource Matrices
- Maximum: [7,3,5], Allocation: [0,0,0], Need: [7,3,5]
- Available resources remain: [10,5,7]

### Test 1.2: Create Multiple Processes
**Steps:**
1. Create P0 with max: `7,3,5`
2. Create P1 with max: `3,2,2`
3. Create P2 with max: `9,4,6`

**Expected Result:**
- All three processes in Resource Matrices
- All allocations start at [0,0,0]
- Available: [10,5,7]
- No graph edges (no dependencies)

### Test 1.3: Duplicate Process ID Error
**Steps:**
1. Create P0 with max: `5,3,4`
2. Try to create P0 again with max: `2,1,1`

**Expected Result:**
- ❌ Error in Activity Log
- **CAUSE**: Process ID already in use
- **SOLUTION**: Choose a different process ID
- Only first P0 exists in system

### Test 1.4: Maximum Exceeds System Resources
**Steps:**
1. Enter PID: `P3`
2. Enter Maximum: `15,10,10` (exceeds total)
3. Click Create

**Expected Result:**
- ❌ Error in Activity Log
- **CAUSE**: Maximum resource requirements exceed system capacity
- **SOLUTION**: Reduce maximum values to within [R0:10, R1:5, R2:7]

---

## 2. RESOURCE REQUEST TESTS (BANKER'S ALGORITHM)

### Test 2.1: Safe Request Allocation
**Precondition:** Create P0 with max `7,3,5`

**Steps:**
1. Select PID: `P0`
2. Enter Request: `2,1,2`
3. Mode: Banker's Algorithm
4. Click Request

**Expected Result:**
- ✅ Success - Request granted
- P0 Allocation: [2,1,2]
- P0 Need: [5,2,3]
- Available: [8,4,5]
- Safe sequence shown in log
- System state: SAFE

### Test 2.2: Multiple Safe Requests
**Precondition:** P0:[7,3,5], P1:[3,2,2], P2:[9,4,6] created

**Steps:**
1. P0 requests [2,0,1] → Should succeed
2. P1 requests [1,1,1] → Should succeed
3. P2 requests [3,2,2] → Should succeed

**Expected Result:**
- All requests granted
- P0 Allocation: [2,0,1], Available after: [8,5,6]
- P1 Allocation: [1,1,1], Available after: [7,4,5]
- P2 Allocation: [3,2,2], Available after: [4,2,3]
- Each log shows safe sequence

### Test 2.3: Request Exceeds Maximum Need
**Precondition:** P0 with max [7,3,5]

**Steps:**
1. P0 requests [8,2,3] (exceeds max)
2. Click Request

**Expected Result:**
- ❌ Error in Activity Log
- **CAUSE**: Request exceeds the maximum need declared
- **SOLUTION**: Request amount must be ≤ (Maximum - Current Allocation)

### Test 2.4: Request Creating Unsafe State
**Precondition:** 
- P0:[7,3,5] allocated [2,0,1]
- P1:[3,2,2] allocated [1,1,1]
- P2:[9,4,6] allocated [3,2,2]
- Available: [4,2,3]

**Steps:**
1. P0 requests [5,2,3] (would make available [-1,0,0])
2. Click Request

**Expected Result:**
- ⏳ Request Denied - Process Blocked
- Light reddish color in log
- Message: "Would lead to UNSAFE state"
- P0 added to waiting queue
- P0 allocation unchanged

### Test 2.5: Request for Non-Existent Process
**Steps:**
1. Enter PID: `P99`
2. Enter Request: `1,1,1`
3. Click Request

**Expected Result:**
- ❌ Error in Activity Log
- **CAUSE**: Process does not exist in the system
- **SOLUTION**: Create the process first before requesting resources

---

## 3. RESOURCE RELEASE TESTS

### Test 3.1: Valid Resource Release
**Precondition:** P0 has allocation [2,1,2]

**Steps:**
1. Select PID: `P0`
2. Enter Release: `1,0,1`
3. Click Release

**Expected Result:**
- ✅ Success message
- P0 Allocation: [1,1,1]
- Available resources increased by [1,0,1]
- Log shows "Resources returned to available pool"

### Test 3.2: Release More Than Allocated
**Precondition:** P0 has allocation [2,1,2]

**Steps:**
1. P0 releases [3,2,3] (more than holding)
2. Click Release

**Expected Result:**
- ❌ Error in Activity Log
- **CAUSE**: Attempting to release more resources than currently allocated
- **SOLUTION**: Check current allocation in Resource Matrices

### Test 3.3: Release All Resources (Complete)
**Precondition:** P0 has allocation [2,1,2]

**Steps:**
1. P0 releases [2,1,2]
2. Click Release

**Expected Result:**
- ✅ Success
- P0 Allocation: [0,0,0]
- Available increased by [2,1,2]

### Test 3.4: Release for Non-Existent Process
**Steps:**
1. Enter PID: `P99`
2. Enter Release: `1,1,1`
3. Click Release

**Expected Result:**
- ❌ Error in Activity Log
- **CAUSE**: Process does not exist in the system
- **SOLUTION**: Verify the process ID is correct

---

## 4. WAIT-FOR GRAPH TESTS

### Test 4.1: No Dependencies Graph
**Precondition:** P0, P1, P2 created but no allocations

**Expected Result:**
- Graph shows 3 nodes (P0, P1, P2)
- No edges (arrows)
- Description: "All Processes Running Independently"
- "No resource contention"

### Test 4.2: Wait-For Relationship Display
**Precondition:** 
- P0:[7,3,5] allocated [4,1,3], Available:[6,4,4]
- P1:[3,2,2] created

**Steps:**
1. P1 requests [3,2,2] (should wait - would be unsafe)

**Expected Result:**
- Graph shows P1 → P0 arrow
- Description: "P1 is waiting for resources held by P0"
- "P1 cannot proceed until P0 releases resources"
- Blue/cyan highlights (safe state)

### Test 4.3: Multiple Wait-For Relationships
**Precondition:**
- P0 allocated [5,2,4]
- P1 allocated [3,2,1]
- P2 needs to wait for P0
- P3 needs to wait for P1

**Expected Result:**
- Graph shows P2 → P0 and P3 → P1
- Multiple explanations in "What this means" section
- All process names correctly displayed

### Test 4.4: Deadlock Detection (Circular Wait)
**Steps to Create Deadlock:**
1. Create P0:[7,5,3], P1:[3,2,2], P2:[9,0,2]
2. P0 requests and gets [0,1,0]
3. P1 requests and gets [2,0,0]
4. P2 requests and gets [3,0,2]
5. Now: Available [5,4,5]
6. P0 requests [7,4,3] → blocked (waiting for P1 or P2)
7. P1 requests [1,2,2] → blocked
8. P2 requests [6,0,0] → blocked

**Expected Result:**
- Red nodes and arrows in graph
- Description: "⚠️ DEADLOCK DETECTED!"
- Shows circular cycle: P0 → P1 → P2 → P0
- Resolution options listed
- Red highlighting (#ff6b6b)

---

## 5. IMMEDIATE ALLOCATION MODE TESTS

### Test 5.1: Immediate Mode vs Banker's Mode
**Precondition:** P0:[7,3,5], P1:[3,2,2]

**Steps:**
1. P0 requests [6,3,5] with Banker's → Should be denied
2. P0 requests [6,3,5] with Immediate → Should succeed if available

**Expected Result:**
- Banker's: Denied (unsafe state)
- Immediate: Granted immediately without safety check
- Different behavior logged

---

## 6. SYSTEM RESET TEST

### Test 6.1: Complete System Reset
**Precondition:** 
- Multiple processes created
- Resources allocated
- Some waiting relationships

**Steps:**
1. Click Refresh button
2. Confirm reset

**Expected Result:**
- Confirmation dialog appears
- All processes removed from matrices
- Graph cleared (no nodes)
- Available reset to [10,5,7]
- Activity log cleared
- New log entry: "System Reset Complete" with details
- All sections back to initial state

---

## 7. ACTIVITY LOG TESTS

### Test 7.1: Log Entry Formatting
**Steps:** Perform any action

**Expected Result:**
- Timestamp in [HH:MM:SS] format
- Color-coded left border (green=success, red=error, orange=warning)
- Detailed breakdown with ▸ bullets
- Resource type labels (R0, R1, R2)

### Test 7.2: Error Highlighting
**Steps:** Cause any error (e.g., duplicate PID)

**Expected Result:**
- Highlighted box with light red background
- ⚠ CAUSE section in red text
- ✓ SOLUTION section in green text
- Clear, actionable guidance

### Test 7.3: Log Capacity (20 entries)
**Steps:** Perform 25+ actions

**Expected Result:**
- Only latest 20 entries shown
- Oldest entries automatically removed
- No scrolling issues

---

## 8. UI LAYOUT TESTS

### Test 8.1: Three-Column Layout
**Expected Result:**
- Section 1: Resource Matrices + Graph below it
- Section 2: Create Process + Controls
- Section 3: Activity Log
- All visible without scrolling
- No horizontal scrollbar

### Test 8.2: Graph Positioning
**Expected Result:**
- Graph appears BELOW Resource Matrices in Section 1
- Graph height: ~250px
- Graph remains stable (nodes don't jump)
- Arrow markers visible on edges

### Test 8.3: Responsive Behavior
**Steps:** Resize browser window

**Expected Result:**
- Columns adjust proportionally
- No content overflow
- All sections remain accessible
- Graph scales appropriately

---

## 9. EDGE CASES

### Test 9.1: Zero Resource Request
**Steps:** P0 requests [0,0,0]

**Expected Result:**
- Should be handled gracefully
- No allocation change
- Log entry showing zero request

### Test 9.2: Negative Values
**Steps:** Try to input negative numbers

**Expected Result:**
- Either prevented by UI or caught by backend
- Clear error message

### Test 9.3: Non-Numeric Input
**Steps:** Enter "abc" in maximum field

**Expected Result:**
- Validation error
- Clear error message

### Test 9.4: Empty Process ID
**Steps:** Leave PID blank, enter maximum

**Expected Result:**
- Form validation prevents submission
- "required" attribute enforces input

---

## 10. INTEGRATION TESTS

### Test 10.1: Complete Workflow
**Steps:**
1. Reset system
2. Create 3 processes with valid maximums
3. Allocate resources to all (safe requests)
4. Create waiting scenario
5. Release resources to resolve waiting
6. Verify waiting process gets resources
7. Release all resources
8. Reset system

**Expected Result:**
- All steps complete successfully
- Resource conservation maintained
- Safe states preserved (Banker's mode)
- Activity log shows complete history

### Test 10.2: Resource Conservation Check
**Steps:** Throughout any test sequence

**Expected Result:**
- Total(Allocated) + Available = Total System Resources
- Formula: Σ(Allocations) + Available = [10,5,7]
- Never violated at any point

---

## 11. GRAPH STABILITY TESTS

### Test 11.1: Node Position Persistence
**Steps:**
1. Create processes that form wait-for graph
2. Drag nodes to specific positions
3. Wait for auto-refresh (1.5 seconds)

**Expected Result:**
- Nodes remain in dragged positions
- No jumping or resetting to center
- Smooth transitions only

### Test 11.2: Dynamic Graph Updates
**Steps:**
1. Create waiting scenario with graph edges
2. Release resources to remove edges
3. Observe graph changes

**Expected Result:**
- Edges smoothly removed
- Nodes remain stable
- Description updates immediately

---

## VALIDATION CHECKLIST

After running all tests, verify:

- ✅ No console errors in browser DevTools
- ✅ All mathematical calculations correct (Available + Allocated = Total)
- ✅ Safe sequence validation works (Banker's Algorithm)
- ✅ Deadlock detection accurate (cycle finding)
- ✅ Graph arrows point correct direction (waiter → holder)
- ✅ Color coding consistent (green=success, red=error, orange=warning)
- ✅ All process names appear correctly (not A, B, C)
- ✅ Timestamps accurate
- ✅ No memory leaks (check after many operations)
- ✅ Responsive layout works on different screen sizes

---

## AUTOMATED VERIFICATION SCRIPT

Run backend tests:
```bash
cd "D:\Documents\Deadlock Prevention"
python -m pytest tests/ -v
```

Check for specific test file:
```bash
python tests/test_bankers.py
```
