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
        item.style.background = 'rgba(30, 41, 59, 0.4)';
        item.style.padding = '8px 12px';
        item.style.borderRadius = '4px';
        item.style.border = '1px solid rgba(255,255,255,0.06)';
        item.style.fontSize = '11px';

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #ffffff; font-weight: 600;">${log.action}</span>
            <span style="color: #64748b;">${timeStr}</span>
          </div>
          <div style="color: #cbd5e1; margin-bottom: 4px;">${log.details}</div>
          <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 10px;">
            <span>Actor: <b>${log.actor} (${log.role})</b></span>
            <span title="SHA-256 Hash">Hash: ${log.hash.slice(0, 10)}...</span>
          </div>
        `;

        container.appendChild(item);
      });
    })
    .catch(err => console.error('Audit log error:', err));
}
