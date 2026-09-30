/**
 * REST API Explorer & Immutable Audit Log Controller
 */

function testApiEndpoint(endpoint) {
  const box = document.getElementById('apiResponseBox');
  box.textContent = 'Executing request...';

  fetch(endpoint)
    .then(res => res.json())
    .then(data => {
      box.textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => {
      box.textContent = `Error: ${err.message}`;
    });
}

function testSimulateApi() {
  const box = document.getElementById('apiResponseBox');
  box.textContent = 'Simulating policy intervention...';

  fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: 'PRJ-NHAI-2024-001',
      params: {
        compensation_boost_pct: 25,
        court_cases_resolved: 4
      }
    })
  })
  .then(res => res.json())
  .then(data => {
    box.textContent = JSON.stringify(data, null, 2);
  })
  .catch(err => {
    box.textContent = `Error: ${err.message}`;
  });
}

function loadAuditLogs() {
  fetch('/api/audit/logs')
    .then(res => res.json())
    .then(logs => {
      const container = document.getElementById('auditLogList');
      if (!container) return;

      container.innerHTML = '';

      logs.forEach(log => {
        const timeStr = new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const item = document.createElement('div');
        item.className = 'glass-panel';
        item.style.padding = '10px 14px';
        item.style.borderRadius = '6px';
        item.style.fontSize = '11.5px';

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
            <span style="color: var(--text-primary); font-weight: 800;">${log.action}</span>
            <span style="color: var(--text-secondary); font-weight: 600;">${timeStr}</span>
          </div>
          <div style="color: var(--text-primary); margin-bottom: 4px; line-height: 1.4;">${log.details}</div>
          <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 10.5px;">
            <span>Actor: <b style="color: var(--text-primary);">${log.actor} (${log.role})</b></span>
            <span title="SHA-256 Hash">Hash: ${log.hash.slice(0, 10)}...</span>
          </div>
        `;

        container.appendChild(item);
      });
    })
    .catch(err => console.error('Audit log error:', err));
}
