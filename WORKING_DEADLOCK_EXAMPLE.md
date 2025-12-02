# Working Deadlock Example

## System Resources: [R0:10, R1:5, R2:7]

### Step-by-Step Instructions:

#### Step 1: Create Process P0
- **Process ID:** `P0`
- **Maximum:** `7,5,3`
- Click "Create"

#### Step 2: Create Process P1
- **Process ID:** `P1`
- **Maximum:** `3,2,2`
- Click "Create"

#### Step 3: P0 requests initial resources (Using Immediate)
- **Process ID:** `P0`
- **Request:** `0,1,0`
- **Mode:** Immediate
- **Result:** ✅ Allocated → P0 now has [0,1,0]

#### Step 4: P1 requests initial resources (Using Immediate)
- **Process ID:** `P1`
- **Request:** `2,0,0`
- **Mode:** Immediate
- **Result:** ✅ Allocated → P1 now has [2,0,0]

#### Step 5: P0 requests more resources (Using Immediate)
- **Process ID:** `P0`
- **Request:** `3,3,0`
- **Mode:** Immediate
- **Result:** ✅ Allocated → P0 now has [3,4,0]
- **Available now:** [5,1,7]

#### Step 6: P1 requests resources that P0 holds (Using Immediate)
- **Process ID:** `P1`
- **Request:** `1,1,2`
- **Mode:** Immediate
- **Result:** ✅ Allocated → P1 now has [3,1,2]
- **Available now:** [4,0,5]

#### Step 7: P0 requests resources that P1 holds (Using Immediate) - CREATES DEADLOCK!
- **Process ID:** `P0`
- **Request:** `3,1,0`
- **Mode:** Immediate
- **Result:** ⚠️ INSUFFICIENT RESOURCES → P0 needs R1 but available R1 = 0
- **P0 is now WAITING for P1 to release R1**

#### Step 8: P1 tries to complete - DEADLOCK DETECTED!
- **Process ID:** `P1`
- **Request:** `0,1,0`
- **Mode:** Immediate
- **Result:** ⚠️ INSUFFICIENT RESOURCES → P1 needs R1 but available R1 = 0
- **P1 is now WAITING for P0 to release R1**

🔴 **DEADLOCK CREATED!** Both processes are waiting for each other!

---

## Alternative Simpler Example:

### Quick Deadlock (3 Steps):

#### Step 1: Create Processes
- Create `P0` with max `5,3,3`
- Create `P1` with max `5,3,3`

#### Step 2: Each takes half the resources (Immediate mode)
- P0 requests `5,2,0` → Allocated
- P1 requests `5,2,0` → Allocated
- Available: [0,1,7]

#### Step 3: Each needs what the other has
- P0 requests `0,1,3` → ⚠️ DENIED (needs R1, but P1 might need it)
- P1 requests `0,1,3` → ⚠️ DENIED (needs R1, but P0 might need it)

If using Banker's mode, both would be denied.
If using Immediate mode, one might succeed creating a potential deadlock.

---

## Why Original Example Didn't Work:

The request `[1,2,2]` for P1 in step 6 would exceed available resources after step 5.
- After step 5: Available = [4, 0, 5]
- P1 requests [1,2,2] but R1 available = 0, so request fails with "insufficient resources" error
- This is not a deadlock, just insufficient resources!

## Correct Understanding:

**Deadlock occurs when:**
1. Process A holds resource X and wants resource Y
2. Process B holds resource Y and wants resource X
3. Both are WAITING indefinitely in a circular dependency

**Not a deadlock:**
- Process wants resources but they're simply not available (just waiting for release)
