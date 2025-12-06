// Basic UI logic: poll /api/status and /api/wfg and render simple matrices + D3 WFG
let simulation = null;
let currentNodes = new Map();

// Page navigation functionality
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.navbar-link');
  const dashboardPage = document.getElementById('dashboard-page');
  const documentationPage = document.getElementById('documentation-page');
  const aboutPage = document.getElementById('about-page');
  
  // Set Dashboard as active by default
  navLinks[0].classList.add('active');
  
  navLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Hide all pages
      if (dashboardPage) dashboardPage.style.display = 'none';
      if (documentationPage) documentationPage.style.display = 'none';
      if (aboutPage) aboutPage.style.display = 'none';
      
      // Show selected page
      if (index === 0 && dashboardPage) {
        dashboardPage.style.display = 'grid';
      } else if (index === 1 && documentationPage) {
        documentationPage.style.display = 'block';
      } else if (index === 2 && aboutPage) {
        aboutPage.style.display = 'block';
      }
    });
  });
});

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';
if(currentTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
  themeToggle.checked = true;
}
themeToggle.addEventListener('change', () => {
  const theme = themeToggle.checked ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  localStorage.setItem('theme', theme);
  // Redraw WFG with new theme colors
  refresh();
});

// Graph modal functionality
const graphModal = document.getElementById('graph-modal');
const graphModalBtn = document.getElementById('graph-modal-btn');
const closeModalBtn = document.getElementById('close-modal');

graphModalBtn.addEventListener('click', async () => {
  graphModal.classList.add('active');
  // Wait for modal to render then fetch and render graph
  setTimeout(async () => {
    const w = await api('wfg');
    const status = await api('status');
    renderWFGModal(w.wfg, w.cycles, status.allocations);
  }, 100);
});

closeModalBtn.addEventListener('click', () => {
  graphModal.classList.remove('active');
});

graphModal.addEventListener('click', (e) => {
  if(e.target === graphModal) {
    graphModal.classList.remove('active');
  }
});

async function api(path, opts){const r=await fetch('/api/'+path, opts);return r.json();}
async function refresh(){
  const status = await api('status');
  document.getElementById('mat-content').innerHTML = formatMatrices(status);
  const w = await api('wfg');
  renderWFG(w.wfg, w.cycles, status.allocations);
}
function formatMatrices(s){
  let out = '<div style="font-family:monospace;">';
  out += '<div style="margin-bottom:24px;"><strong>Total resources:</strong> ['+s.total.join(', ')+']<br/>';
  out += '<strong>Available:</strong> ['+s.available.join(', ')+']</div>';
  
  // Allocations and Maximum table
  const processes = Object.keys(s.maximum);
  if(processes.length > 0) {
    out += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">';
    out += '<thead><tr style="background:var(--card-border);"><th style="padding:8px;text-align:left;border:1px solid var(--input-border);">Process</th><th style="padding:8px;text-align:left;border:1px solid var(--input-border);">Allocation</th><th style="padding:8px;text-align:left;border:1px solid var(--input-border);">Maximum</th></tr></thead>';
    out += '<tbody>';
    for(const p of processes) {
      const maxStr = '['+s.maximum[p].join(', ')+']';
      const allocStr = '['+s.allocations[p].join(', ')+']';
      out += '<tr><td style="padding:8px;border:1px solid var(--input-border);">'+p+'</td><td style="padding:8px;border:1px solid var(--input-border);">'+allocStr+'</td><td style="padding:8px;border:1px solid var(--input-border);">'+maxStr+'</td></tr>';
    }
    out += '</tbody></table>';
  }
  
  out += '<div style="margin-top:24px;margin-bottom:24px;"><strong>Need:</strong><br/>';
  for(const p in s.need){ out += p + ': ['+s.need[p].join(', ')+']<br/>'; }
  out += '</div><div style="margin-top:24px;"><strong>Waiting Queue:</strong><br/>';
  for(const w of s.waiting){ out += w[0] + ' → ['+w[1].join(', ')+']<br/>'; }
  out += '</div></div>';
  return out;
}

// Render WFG in modal
function renderWFGModal(wfg, cycles, allocations = {}){
  const container = document.getElementById('wfg-modal');
  if(!container) {
    console.error('Modal container not found');
    return;
  }
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;
  console.log('Modal WFG rendering:', {width, height, wfg, cycles, allocations});
  
  // Include all processes from allocations, not just those in WFG
  const nodes = new Map();
  Object.keys(allocations).forEach(k=>nodes.set(k,{}));
  Object.keys(wfg).forEach(k=>nodes.set(k,{}));
  Object.values(wfg).flat().forEach(v=>nodes.set(v,{}));
  const nlist = Array.from(nodes.keys()).map((id)=>({id}));
  const links = [];
  for(const u in wfg){
    for(const v of wfg[u]){
      links.push({source:u,target:v});
    }
  }
  
  console.log('Nodes:', nlist.length, 'Links:', links.length);
  
  container.innerHTML = '';
  
  // Show message if no nodes
  if(nlist.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--soft);font-size:16px;">No processes in the system. Create processes to see the graph.</div>';
    return;
  }
  
  const svg = d3.select(container).append('svg')
    .attr('width', width)
    .attr('height', height);
  
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead-modal')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#444');
    
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead-red-modal')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#ff6b6b');
  
  const link = svg.append('g').selectAll('line').data(links).join('line')
    .attr('stroke-width', 2)
    .attr('stroke', '#444')
    .attr('marker-end', 'url(#arrowhead-modal)');
    
  const node = svg.append('g').selectAll('g').data(nlist).join('g');
  node.append('circle').attr('r', 20).attr('fill', '#1a1a2e').attr('stroke', 'rgba(0,255,255,0.3)').attr('stroke-width', 2);
  node.append('text').text(d=>d.id).attr('text-anchor','middle').attr('dy',5).attr('fill','#68F3E3').style('font-weight','600').style('font-size','12px');
  
  // Add status labels below nodes
  const statusLabels = node.append('text')
    .attr('text-anchor','middle')
    .attr('dy',35)
    .attr('fill','#90EE90')
    .style('font-size','10px')
    .style('font-weight','500');
  
  // Adjust forces based on number of nodes
  const nodeCount = nlist.length;
  const linkDistance = Math.max(80, Math.min(150, width / (nodeCount * 0.8)));
  const chargeStrength = Math.max(-800, -300 * Math.sqrt(nodeCount));
  
  const sim = d3.forceSimulation(nlist)
    .force('link', d3.forceLink(links).id(d=>d.id).distance(linkDistance))
    .force('charge', d3.forceManyBody().strength(chargeStrength))
    .force('center', d3.forceCenter(width/2, height/2))
    .force('collision', d3.forceCollide().radius(40))
    .force('x', d3.forceX(width/2).strength(0.1))
    .force('y', d3.forceY(height/2).strength(0.1));
    
  sim.on('tick', ()=>{
    // Constrain nodes within boundaries
    nlist.forEach(d => {
      d.x = Math.max(60, Math.min(width - 60, d.x));
      d.y = Math.max(60, Math.min(height - 60, d.y));
    });
    link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
    node.attr('transform', d=>'translate('+d.x+','+d.y+')');
  });
  
  const cycSet = new Set();
  cycles.forEach(c=>c.forEach(p=>cycSet.add(p)));
  node.selectAll('circle').attr('stroke', d=>cycSet.has(d.id)?'#ff6b6b':'rgba(0,255,255,0.3)').attr('stroke-width', d=>cycSet.has(d.id)?4:2);
  link.attr('stroke', d=> (cycSet.has(d.source.id) && cycSet.has(d.target.id))? '#ff6b6b' : '#444')
    .attr('marker-end', d=> (cycSet.has(d.source.id) && cycSet.has(d.target.id))? 'url(#arrowhead-red-modal)' : 'url(#arrowhead-modal)');
  
  // Update status labels based on waiting relationships
  statusLabels.each(function(d) {
    const label = d3.select(this);
    if(cycSet.has(d.id)) {
      // Find what this process is waiting for
      const waitingFor = links.filter(l => l.source.id === d.id).map(l => l.target.id);
      if(waitingFor.length > 0) {
        label.text(`⚠ Deadlock with ${waitingFor.join(', ')}`)
          .attr('fill', '#ff6b6b');
      }
    } else if(links.some(l => l.source.id === d.id)) {
      const waitingFor = links.filter(l => l.source.id === d.id).map(l => l.target.id);
      label.text(`⏳ Waiting for ${waitingFor.join(', ')}`)
        .attr('fill', '#ffa500');
    } else {
      label.text('✓ Running')
        .attr('fill', '#90EE90');
    }
  });
  
  node.on('mouseover', function(){ d3.select(this).select('circle').attr('r',26); }).on('mouseout', function(){ d3.select(this).select('circle').attr('r',20); });
}

function renderWFG(wfg, cycles, allocations = {}){
  const container = document.getElementById('wfg');
  const width = container.clientWidth, height = container.clientHeight;
  
  // create nodes from keys and values
  const nodes = new Map();
  Object.keys(wfg).forEach(k=>nodes.set(k,{}));
  Object.values(wfg).flat().forEach(v=>nodes.set(v,{}));
  const nlist = Array.from(nodes.keys()).map((id)=>({id}));
  const links = [];
  const linksCopy = []; // Keep original links for explanation
  for(const u in wfg){
    for(const v of wfg[u]){
      links.push({source:u,target:v});
      linksCopy.push({source:u,target:v});
    }
  }
  
  // Reuse existing positions if nodes exist
  nlist.forEach(n => {
    if(currentNodes.has(n.id)) {
      const existing = currentNodes.get(n.id);
      n.x = existing.x;
      n.y = existing.y;
      n.vx = existing.vx || 0;
      n.vy = existing.vy || 0;
    } else {
      n.x = width/2 + (Math.random()-0.5)*100;
      n.y = height/2 + (Math.random()-0.5)*100;
    }
    currentNodes.set(n.id, n);
  });
  
  // Remove nodes that no longer exist
  const currentIds = new Set(nlist.map(n => n.id));
  for(const [id] of currentNodes) {
    if(!currentIds.has(id)) currentNodes.delete(id);
  }
  
  container.innerHTML = '';
  const svg = d3.select(container).append('svg').attr('width','100%').attr('height','100%');
  
  // Define arrow marker
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#444')
    .style('stroke','none');
    
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead-red')
    .attr('viewBox', '-0 -5 10 10')
    .attr('refX', 25)
    .attr('refY', 0)
    .attr('orient', 'auto')
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('xoverflow', 'visible')
    .append('svg:path')
    .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
    .attr('fill', '#ff6b6b')
    .style('stroke','none');
  
  const link = svg.append('g').selectAll('line').data(links).enter().append('line')
    .attr('stroke','#444')
    .attr('stroke-width',2)
    .attr('marker-end','url(#arrowhead)');
  const node = svg.append('g').selectAll('g').data(nlist).enter().append('g');
  node.append('circle').attr('r',20).attr('fill','#061426').attr('stroke','rgba(0,255,255,0.3)').attr('stroke-width',2);
  node.append('text').text(d=>d.id).attr('x',-8).attr('y',5).style('fill', '#E8ECF1');
  
  // Stop existing simulation
  if(simulation) simulation.stop();
  
  simulation = d3.forceSimulation(nlist)
    .force('link', d3.forceLink(links).id(d=>d.id).distance(120))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width/2, height/2))
    .alphaDecay(0.05);
    
  simulation.on('tick', ()=>{
    link.attr('x1', d=>d.source.x).attr('y1', d=>d.source.y).attr('x2', d=>d.target.x).attr('y2', d=>d.target.y);
    node.attr('transform', d=>'translate('+d.x+','+d.y+')');
  });
  
  // highlight cycles
  const cycSet = new Set();
  cycles.forEach(c=>c.forEach(p=>cycSet.add(p)));
  node.selectAll('circle').attr('stroke', d=>cycSet.has(d.id)?'#ff6b6b':'rgba(0,255,255,0.3)').attr('stroke-width', d=>cycSet.has(d.id)?4:2);
  link.attr('stroke', d=> (cycSet.has(d.source.id) && cycSet.has(d.target.id))? '#ff6b6b' : '#444')
    .attr('marker-end', d=> (cycSet.has(d.source.id) && cycSet.has(d.target.id))? 'url(#arrowhead-red)' : 'url(#arrowhead)');
  // simple hover
  node.on('mouseover', function(){ d3.select(this).select('circle').attr('r',26); }).on('mouseout', function(){ d3.select(this).select('circle').attr('r',20); });
  
  // Add explanation text
  let explanation = '';
  const processCount = Object.keys(allocations).length;
  if(processCount === 0) {
    explanation = '🔄 <strong>System Initialized</strong><br/>No processes currently in the system. Create your first process to begin the deadlock prevention simulation.';
  } else if(nlist.length === 0 && processCount > 0) {
    const processList = Object.keys(allocations).join(', ');
    explanation = `<strong style="color:#3a9b3aff;">Processes Created Successfully</strong><br/><br/><strong>Active processes:</strong> ${processList}<br/><br/><strong>Current state:</strong><br/>• ${processCount} process${processCount !== 1 ? 'es' : ''} ready and initialized<br/>• No resource requests made yet<br/>• All processes are in initial state with zero allocations<br/>• You can now request resources using the Request Resources form`;
  } else if(cycles.length > 0) {
    const cycleDetails = cycles.map(c => {
      const cycle = c.join(' → ') + ' → ' + c[0];
      return `<div style="margin:8px 0;padding:8px;background:rgba(255,107,107,0.25);border-left:3px solid #ff6b6b;border-radius:4px;"><strong>Deadlock Cycle:</strong> ${cycle}<br/><span style="font-size:12px;color:var(--soft);">Each process in this cycle is waiting for resources held by the next process, creating a circular wait condition.</span></div>`;
    }).join('');
    explanation = `⚠️ <strong style="color:#ff6b6b;">DEADLOCK DETECTED!</strong><br/><br/>${cycleDetails}<br/><strong>What this means:</strong> The red highlighted processes and arrows show circular dependencies where:<br/>• Each arrow from process X → Y means "X is waiting for resources currently held by Y"<br/>• The cycle cannot resolve itself without external intervention<br/><br/><strong>Resolution options:</strong><br/>1. Terminate one process in the cycle to break the deadlock<br/>2. Preempt resources from a process (if possible)<br/>3. Use the rollback mechanism if checkpoints are available`;
  } else if(linksCopy.length > 0) {
    const waitDetails = linksCopy.map(l => {
      return `<strong>${l.source}</strong> is waiting for resources held by <strong>${l.target}</strong>`;
    }).join('<br/>');
    const explanationDetails = linksCopy.map(l => {
      return `• Arrow from <strong>${l.source} → ${l.target}</strong> means "<strong>${l.source}</strong> cannot proceed until <strong>${l.target}</strong> releases resources"`;
    }).join('<br/>');
    explanation = `⏳ <strong style="color:#ffa500;">System has Waiting Processes</strong><br/><br/><strong>Current wait-for relationships:</strong><br/>${waitDetails}<br/><br/><strong>What this means:</strong><br/>• Arrows show which processes are waiting for resources<br/>${explanationDetails}<br/>• <span style="color:#228B22;">✓ No circular dependencies detected</span> - waiting processes will complete when resources are released<br/>• System is currently safe but has blocked processes`;
  } else {
    explanation = `<strong style="color:#3a9b3aff;">All Processes Running Independently</strong><br/><br/><strong>Current state:</strong><br/>• ${nlist.length} active process${nlist.length !== 1 ? 'es' : ''}: <strong>${nlist.map(n => n.id).join(', ')}</strong><br/>• No resource contention or waiting relationships<br/>• Each process has all the resources it needs<br/>• System is operating without blocked processes<br/><br/><strong>Note:</strong> If using Immediate mode, safety is not guaranteed. Use Banker's Algorithm for deadlock prevention.`;
  }
  document.getElementById('cycles').innerHTML = '<div style="padding:12px;background:var(--card-bg-start);margin-top:10px;border-radius:6px;color:var(--soft);font-size:13px;line-height:1.8;border:1px solid var(--card-border);">' + explanation + '</div>';
}

function logAction(message, type='info') {
  const log = document.getElementById('action-log');
  const time = new Date().toLocaleTimeString();
  const color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#3a9b3aff' : type === 'warning' ? '#ffaa88' : '#E8ECF1';
  const entry = `<div style="margin:6px 0;padding:8px;background:var(--wfg-bg);border-radius:4px;border-left:3px solid ${color};"><span style="color:#999;font-size:11px;font-weight:600;">[${time}]</span> ${message}</div>`;
  log.innerHTML = entry + log.innerHTML;
  if(log.children.length > 20) log.lastChild.remove();
}

document.getElementById('create-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const pid = document.getElementById('pid').value.trim();
  const max = document.getElementById('max').value.split(',').map(x=>parseInt(x.trim()));
  const res = await fetch('/api/process/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pid,maximum:max})});
  const json = await res.json();
  if(json.status) {
    const resourceTypes = ['R0', 'R1', 'R2'];
    const maxDetails = max.map((val, idx) => `${resourceTypes[idx]}:${val}`).join(', ');
    logAction(`✓ <strong>Process Created:</strong> ${pid}<br/><span style="font-size:11px;color:#228B22;">▸ Maximum need declared: [${maxDetails}]<br/>▸ Initial allocation: [0, 0, 0]<br/>▸ Process added to system ready queue</span>`, 'success');
  } else {
    let errorCause = '';
    let solution = '';
    if(json.error.includes('already exists')) {
      errorCause = 'Process ID already in use';
      solution = 'Choose a different process ID (e.g., P0, P1, P2...)';
    } else if(json.error.includes('maximum')) {
      errorCause = 'Maximum resource requirements exceed system capacity';
      solution = 'Reduce maximum values to within available resources [R0:10, R1:5, R2:7]';
    } else {
      errorCause = json.error;
      solution = 'Check input format: PID should be string, maximum should be comma-separated numbers';
    }
    logAction(`✗ <strong>Process Creation Failed:</strong> ${pid}<br/><span style="font-size:11px;color:#ffb3b3;">▸ Error: ${json.error}<br/><div style="background:rgba(255,107,107,0.25);padding:6px;margin-top:6px;border-radius:4px;border-left:2px solid #ff6b6b;"><strong style="color:#ff4444;">⚠ CAUSE:</strong> ${errorCause}<br/><strong style="color:#00a896;">✓ SOLUTION:</strong> ${solution}</div></span>`, 'error');
  }
  document.getElementById('pid').value = '';
  document.getElementById('max').value = '';
  document.getElementById('pid').focus();
  refresh();
});
document.getElementById('request-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const pid = document.getElementById('rpid').value.trim();
  const req = document.getElementById('req').value.split(',').map(x=>parseInt(x.trim()));
  const mode = document.getElementById('mode').value;
  const res = await fetch('/api/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pid,request:req,mode})});
  const j = await res.json();
  if(j.status === 'allocated') {
    const resourceTypes = ['R0', 'R1', 'R2'];
    const reqDetails = req.map((val, idx) => `${resourceTypes[idx]}:${val}`).join(', ');
    const safeSeq = j.order && j.order.length > 0 ? j.order.join(' → ') : 'N/A';
    const modeDetails = mode === 'banker' 
      ? `▸ Safe sequence found: ${safeSeq}<br/><div style="background:rgba(104,243,227,0.25);padding:8px;margin-top:8px;border-radius:4px;border-left:3px solid #00a896;"><strong style="color:#00a896;">✅ SYSTEM STATE: SAFE</strong><br/><span style="font-size:11px;color:var(--soft);">All processes can complete in the found sequence. No deadlock possible.</span></div>` 
      : `▸ Resources allocated without safety check<br/><div style="background:rgba(255,170,136,0.25);padding:8px;margin-top:8px;border-radius:4px;border-left:3px solid #ff8844;"><strong style="color:#ff8844;">⚠️ SYSTEM STATE: UNKNOWN</strong><br/><span style="font-size:11px;color:var(--soft);">Safety not verified. Deadlock prevention not active.</span></div>`;
    logAction(`✓ <strong>Resource Request Granted:</strong> ${pid}<br/><span style="font-size:11px;color:#b3e3e3;">▸ Requested: [${reqDetails}]<br/>▸ Mode: ${mode === 'banker' ? "Banker's Algorithm" : 'Immediate Allocation'}<br/>${modeDetails}</span>`, 'success');
  } else if(j.status === 'waiting') {
    const resourceTypes = ['R0', 'R1', 'R2'];
    const reqDetails = req.map((val, idx) => `${resourceTypes[idx]}:${val}`).join(', ');
    logAction(`⏳ <strong>Request Denied - Process Blocked:</strong> ${pid}<br/><span style="font-size:11px;color:var(--soft);">▸ Requested: [${reqDetails}]<br/>▸ Mode: Banker's Algorithm<br/><div style="background:rgba(255,107,107,0.25);padding:8px;margin-top:8px;border-radius:4px;border-left:3px solid #ff6b6b;"><strong style="color:#ff4444;">❌ SYSTEM STATE: UNSAFE</strong><br/><span style="font-size:11px;color:var(--soft);">Granting this would lead to unsafe state. Process added to waiting queue.</span></div></span>`, 'warning');
  } else if(j.error) {
    let errorCause = '';
    let solution = '';
    if(j.error.includes('not found') || j.error.includes('does not exist') || j.error === pid || j.error === `'${pid}'`) {
      errorCause = 'Process does not exist in the system';
      solution = 'Create the process first before requesting resources';
    } else if(j.error.includes('exceeds maximum') || j.error.includes('exceed')) {
      errorCause = 'Request exceeds the maximum need declared for this process';
      solution = 'Request amount must be ≤ (Maximum - Current Allocation). Check process maximum in Resource Matrices';
    } else if(j.error.includes('insufficient') || j.error.includes('available')) {
      errorCause = 'Insufficient resources available in the system';
      solution = 'Wait for other processes to release resources or release some resources first';
    } else {
      errorCause = j.error;
      solution = 'Verify process exists and request values are valid non-negative integers';
    }
    logAction(`✗ <strong>Request Failed:</strong> ${pid}<br/><span style="font-size:11px;color:var(--soft);">▸ Requested : [${req.join(', ')}]<br/>▸ Error : ${j.error}<br/><div style="background:rgba(255,107,107,0.25);padding:8px;margin-top:8px;border-radius:4px;border-left:3px solid #ff6b6b;"><strong style="color:#ff4444;">⚠ CAUSE:</strong> ${errorCause}<br/><strong style="color:#00a896;">✓ SOLUTION:</strong> ${solution}</div></span>`, 'warning');
  }
  document.getElementById('rpid').value = '';
  document.getElementById('req').value = '';
  document.getElementById('rpid').focus();
  refresh();
});
document.getElementById('release-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const pid = document.getElementById('relpid').value.trim();
  const rel = document.getElementById('rel').value.split(',').map(x=>parseInt(x.trim()));
  const res = await fetch('/api/release',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pid,release:rel})});
  const json = await res.json();
  if(json.status === 'released') {
    const resourceTypes = ['R0', 'R1', 'R2'];
    const relDetails = rel.map((val, idx) => `${resourceTypes[idx]}:${val}`).join(', ');
    
    // Fetch updated state to check if all resources released
    try {
      const stateRes = await fetch('/api/state');
      const state = await stateRes.json();
      console.log('Current allocation for', pid, ':', state.allocations[pid]);
      const allReleased = state.allocations[pid] && state.allocations[pid].every(val => val === 0);
      console.log('All resources released?', allReleased);
      const completeMsg = allReleased ? '<br/><div style="background:rgba(104,243,227,0.25);padding:8px;margin-top:8px;border-radius:4px;border-left:3px solid #00a896;"><strong style="color:#00a896;">ALL RESOURCES COMPLETELY RELEASED</strong><br/><span style="font-size:11px;color:var(--soft);">Process has returned all resources to the system<br/>Current allocation becomes: [0, 0, 0]</span></div>' : '';
      logAction(`✓ <strong>Resources Released:</strong> ${pid}<br/><span style="font-size:11px;color:#228B22;">▸ Released: [${relDetails}]<br/>▸ Resources returned to available pool${completeMsg}<br/>▸ Waiting processes may now proceed</span>`, 'success');
    } catch(err) {
      // Fallback if state fetch fails
      logAction(`✓ <strong>Resources Released:</strong> ${pid}<br/><span style="font-size:11px;color:#228B22;">▸ Released: [${relDetails}]<br/>▸ Resources returned to available pool<br/>▸ Waiting processes may now proceed</span>`, 'success');
    }
  } else if(json.error) {
    let errorCause = '';
    let solution = '';
    if(json.error.includes('not found') || json.error.includes('does not exist')) {
      errorCause = 'Process does not exist in the system';
      solution = 'Verify the process ID is correct and the process has been created';
    } else if(json.error.includes('exceeds') || json.error.includes('allocated') || json.error.includes('holding')) {
      errorCause = 'Attempting to release more resources than currently allocated';
      solution = 'Check current allocation in Resource Matrices and release only what the process holds';
    } else {
      errorCause = json.error;
      solution = 'Verify process exists and release values are valid non-negative integers';
    }
    logAction(`✗ <strong>Release Failed:</strong> ${pid}<br/><span style="font-size:11px;color:var(--soft);margin-left:16px;">▸ Attempted to release: [${rel.join(', ')}]<br/>▸ Error: ${json.error}<br/><div style="background:rgba(255,107,107,0.25);padding:6px;margin-top:6px;border-radius:4px;border-left:2px solid #ff6b6b;"><strong style="color:#ff4444;">⚠ CAUSE:</strong> ${errorCause}<br/><strong style="color:#00a896;">✓ SOLUTION:</strong> ${solution}</div></span>`, 'error');
  }
  document.getElementById('relpid').value = '';
  document.getElementById('rel').value = '';
  document.getElementById('relpid').focus();
  refresh();
});

document.getElementById('refresh').addEventListener('click', async () => {
  const confirmed = confirm('This will reset the entire system and clear all processes. Continue?');
  if(confirmed) {
    const res = await fetch('/api/reset', {method:'POST'});
    const data = await res.json();
    if(data.status === 'reset') {
      document.getElementById('action-log').innerHTML = '';
      currentNodes.clear();
      refresh();
      logAction('🔄 <strong>System Reset Complete</strong><br/><span style="font-size:11px;color:#b3d9ff;margin-left:16px;">▸ All processes terminated and removed<br/>▸ Resources restored to initial state: [R0:10, R1:5, R2:7]<br/>▸ Wait-For Graph cleared<br/>▸ Activity log cleared<br/>▸ System ready for new operations</span>', 'info');
    }
  }
});
setInterval(refresh, 1500);
refresh();
