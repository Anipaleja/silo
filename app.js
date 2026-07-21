const toast = document.querySelector('#toast');
const form = document.querySelector('#askForm');
const input = document.querySelector('#askInput');
const network = document.querySelector('#network');
const timeline = document.querySelector('#timeline');
const serverSearch = document.querySelector('#serverSearch');
const searchResults = document.querySelector('#searchResults');
const connections = document.querySelector('#connections');
const serverDirectory = [
  { id: 'srv-7A2F-91C', name: 'Maya’s Studio', detail: 'Design & research', initial: 'M' },
  { id: 'srv-38BD-442', name: 'Atlas Research', detail: 'Public knowledge peer', initial: 'A' },
  { id: 'srv-ECHO-108', name: 'Echo Archive', detail: 'History & references', initial: 'E' },
  { id: 'srv-91NX-005', name: 'Northstar Lab', detail: 'Product strategy', initial: 'N' },
  { id: 'srv-OPEN-247', name: 'Commons Server', detail: 'Community workspace', initial: 'C' }
];
const connectedServers = new Set();

function showToast(message = 'Researcher is looking through your sources…') {
  toast.querySelector('small').textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function runTask(question) {
  const text = question.trim() || 'Summarize my week';
  showToast(`Working on “${text.length > 42 ? text.slice(0, 42) + '…' : text}”`);
  const event = document.createElement('div');
  event.className = 'event fresh';
  event.innerHTML = `<span class="event-icon search">⌕</span><div><p><b>Your brain</b> started “${text.replace(/[<>]/g, '')}”</p><small>Just now</small></div><button class="tag">In progress</button>`;
  timeline.prepend(event);
  if (timeline.children.length > 3) timeline.lastElementChild.remove();
  input.value = '';
}

form.addEventListener('submit', (e) => { e.preventDefault(); runTask(input.value); });
input.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') runTask(input.value); });
document.querySelector('#newTask').addEventListener('click', () => { input.focus(); document.querySelector('.quick-panel').scrollIntoView({behavior:'smooth', block:'center'}); });
document.querySelectorAll('.suggestions button').forEach(btn => btn.addEventListener('click', () => runTask(btn.textContent)));
document.querySelectorAll('.segmented button').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.segmented button').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); }));
document.querySelector('#pauseBtn').addEventListener('click', (e) => { network.classList.toggle('paused'); const paused = network.classList.contains('paused'); e.currentTarget.querySelector('span').textContent = paused ? 'Resume' : 'Pause'; e.currentTarget.firstChild.textContent = paused ? '▶ ' : 'Ⅱ '; });
document.querySelector('#recenter').addEventListener('click', () => { document.querySelector('#brainNode').animate([{transform:'scale(.94)'},{transform:'scale(1.04)'},{transform:'scale(1)'}],{duration:500}); });
document.querySelectorAll('.node.agent').forEach(node => node.addEventListener('click', () => showToast(`${node.dataset.agent} is active and ready to help.`)));

function renderServerResults(query = '') {
  const normalized = query.toLowerCase().trim();
  const matches = serverDirectory.filter(server => !normalized || `${server.name} ${server.id} ${server.detail}`.toLowerCase().includes(normalized));
  searchResults.innerHTML = matches.length ? matches.map(server => `
    <button class="server-result ${connectedServers.has(server.id) ? 'connected' : ''}" data-id="${server.id}">
      <span class="result-avatar">${server.initial}</span>
      <span class="result-copy"><b>${server.name}</b><small>${server.id} · ${server.detail}</small></span>
      <i>${connectedServers.has(server.id) ? 'Added' : '+ Connect'}</i>
    </button>`).join('') : '<div class="search-empty">No servers found. Try a name or ID like “ECHO”.</div>';
  searchResults.classList.add('open');
}

function addServer(server) {
  if (connectedServers.has(server.id)) return showToast(`${server.name} is already on your map.`);
  connectedServers.add(server.id);
  const index = connectedServers.size - 1;
  const y = Math.min(82, 16 + index * 17);
  const node = document.createElement('article');
  node.className = 'node agent new-peer';
  node.dataset.serverId = server.id;
  node.style.cssText = `--x:61%;--y:${y}%`;
  node.innerHTML = `<div class="agent-avatar green">${server.initial}</div><div><b>${server.name}</b><span class="node-id">${server.id}</span></div><i class="ok"></i><button class="disconnect" title="Remove server" aria-label="Remove ${server.name}">×</button>`;
  network.appendChild(node);

  const targetY = 80 + index * 85;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'flow-line green');
  path.dataset.serverId = server.id;
  path.setAttribute('d', `M625 228 C690 228 690 ${targetY} 735 ${targetY}`);
  connections.appendChild(path);

  node.querySelector('.disconnect').addEventListener('click', event => {
    event.stopPropagation();
    connectedServers.delete(server.id);
    node.remove();
    connections.querySelector(`[data-server-id="${server.id}"]`)?.remove();
    document.querySelector('.stats span:first-child b').textContent = 3 + connectedServers.size;
    showToast(`${server.name} was removed from your map.`);
  });
  node.addEventListener('click', () => showToast(`${server.name} is connected and sharing approved knowledge.`));

  const event = document.createElement('div');
  event.className = 'event fresh';
  event.innerHTML = `<span class="event-icon sparkle">↗</span><div><p><b>${server.name}</b> joined your peer network</p><small>Just now · ${server.id}</small></div><button class="tag">Connected</button>`;
  timeline.prepend(event);
  if (timeline.children.length > 3) timeline.lastElementChild.remove();
  document.querySelector('.stats span:first-child b').textContent = 3 + connectedServers.size;
  serverSearch.value = '';
  searchResults.classList.remove('open');
  showToast(`${server.name} is now connected to your brain.`);
}

serverSearch.addEventListener('focus', () => renderServerResults(serverSearch.value));
serverSearch.addEventListener('input', () => renderServerResults(serverSearch.value));
serverSearch.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const first = searchResults.querySelector('.server-result:not(.connected)');
    if (first) addServer(serverDirectory.find(server => server.id === first.dataset.id));
  }
  if (event.key === 'Escape') searchResults.classList.remove('open');
});
searchResults.addEventListener('click', event => {
  const result = event.target.closest('.server-result');
  if (result) addServer(serverDirectory.find(server => server.id === result.dataset.id));
});
document.addEventListener('click', event => {
  if (!event.target.closest('.server-search')) searchResults.classList.remove('open');
});
