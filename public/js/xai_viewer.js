/**
 * Explainable AI (XAI) & Prescriptive Playbook Viewer for BHU-DRISHTI
 */

function renderXaiDetails(project) {
  if (!project) return;

  // Title
  document.getElementById('xaiSelectedProjectName').innerHTML = `
    ${project.name} &bull; <span style="color: ${project.delay_risk_score >= 75 ? 'var(--risk-high)' : 'var(--risk-med)'}; font-weight: 800;">${project.delay_risk_score}/100 (${project.risk_category})</span>
  `;

  // Executive summary
  document.getElementById('xaiExecutiveSummary').textContent = project.xai_explanation.executive_explanation;

  // Statutory Timeline Countdown Horizon
  document.getElementById('statSec11Date').textContent = project.sec11_notification_date || '2023-04-10';
  document.getElementById('statSec19Date').textContent = project.sec19_declaration_date || '2023-11-15';
  document.getElementById('statSec25Date').textContent = project.sec25_lapse_deadline || '2024-11-14';
  document.getElementById('statDaysElapsed').textContent = `${project.days_since_sec19 || 318} / 365 Days`;

  const daysRemaining = 365 - (project.days_since_sec19 || 318);
  const badgeEl = document.getElementById('statutoryCountdownBadge');
  if (daysRemaining <= 65 && project.statutory_stage_id <= 4) {
    badgeEl.style.background = 'var(--risk-high-bg)';
    badgeEl.style.color = 'var(--risk-high)';
    badgeEl.style.borderColor = 'var(--risk-high-border)';
    badgeEl.style.fontWeight = '800';
    badgeEl.textContent = `CRITICAL ALERT: ${daysRemaining} Days Left Until Sec 25 Mandatory Lapse`;
  } else {
    badgeEl.style.background = 'var(--risk-low-bg)';
    badgeEl.style.color = 'var(--risk-low)';
    badgeEl.style.borderColor = 'var(--risk-low-border)';
    badgeEl.style.fontWeight = '800';
    badgeEl.textContent = `STATUTORY BUFFER: ${daysRemaining} Days Remaining`;
  }

  // Statutory Lapse Warning Box
  const lapseBox = document.getElementById('statutoryLapseAlertBox');
  if (project.days_since_sec19 > 300 && project.statutory_stage_id <= 4) {
    lapseBox.style.display = 'block';
    lapseBox.innerHTML = `
      <strong>[CRITICAL STATUTORY NOTICE - Section 25 RFCTLARR Act]:</strong> 
      Section 19 was declared <b>${project.days_since_sec19} days ago</b>. 
      Statutory lapse deadline is <b>${project.sec25_lapse_deadline}</b> (${daysRemaining} days remaining). 
      If Section 23 Award is not passed within 12 months, the acquisition proceedings will lapse by operation of law.
    `;
  } else {
    lapseBox.style.display = 'none';
  }

  // Render SHAP waterfall list
  const listContainer = document.getElementById('xaiAttributionList');
  listContainer.innerHTML = '';

  const attributions = project.xai_explanation.attributions || [];

  attributions.forEach(item => {
    let barColor = 'var(--accent-sky, #3b82f6)';
    if (item.percentage_contribution >= 25) barColor = 'var(--risk-high)';
    else if (item.percentage_contribution >= 15) barColor = 'var(--risk-med)';

    const row = document.createElement('div');
    row.className = 'xai-factor-row';
    row.style.borderLeftColor = barColor;

    row.innerHTML = `
      <div class="xai-factor-info">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span class="xai-factor-title">${item.label}</span>
          <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Raw: <b>${item.raw_value}</b></span>
        </div>
        <div class="xai-factor-desc">${item.description}</div>
        <div style="width: 100%; height: 5px; background: var(--border-color); border-radius: 2px; margin-top: 6px;">
          <div style="width: ${item.percentage_contribution}%; height: 100%; background: ${barColor}; border-radius: 2px;"></div>
        </div>
      </div>
      <div class="xai-factor-val" style="color: ${barColor}; font-weight: 800;">+${item.percentage_contribution}%</div>
    `;

    listContainer.appendChild(row);
  });

  // Render Prescriptive Playbooks
  const playbookContainer = document.getElementById('playbookContainer');
  playbookContainer.innerHTML = '';

  const recommendations = project.prescriptive_recommendations || [];

  recommendations.forEach(rec => {
    let priorityBadge = 'var(--risk-high)';
    if (rec.priority === 'High') priorityBadge = 'var(--risk-med)';
    if (rec.priority === 'Medium') priorityBadge = 'var(--c-sage, #3b82f6)';

    const card = document.createElement('div');
    card.className = 'glass-panel';
    card.style.padding = '14px';
    card.style.borderLeft = `4px solid ${priorityBadge}`;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 10px; font-weight: 800; background: var(--bg-card-hover); border: 1px solid var(--border-color); padding: 2px 6px; border-radius: 3px; color: ${priorityBadge};">
          ${rec.priority.toUpperCase()} PRIORITY &bull; ${rec.action_type}
        </span>
        <span style="font-size: 11px; color: var(--risk-low); font-weight: 800;">-${rec.expected_risk_reduction_pct}% Risk Impact</span>
      </div>

      <h4 style="font-size: 13.5px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">${rec.title}</h4>
      <p style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.45;">${rec.description}</p>

      <div style="font-size: 10.5px; color: var(--text-muted); margin-bottom: 10px;">
        <b>Statutory Authority:</b> ${rec.statutory_reference} | <b>Target Role:</b> ${rec.target_role}
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: var(--text-primary); font-weight: 600;">Timeline: <b>${rec.timeline_days} Days</b></span>
        <button class="btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="dispatchPlaybookAction('${project.id}', '${rec.id}')">
          Issue Directive
        </button>
      </div>
    `;

    playbookContainer.appendChild(card);
  });

  // Render Lifecycle Funnel Chart
  renderStageFunnelChart(project.stage_risks || []);
}

function dispatchPlaybookAction(projectId, actionId) {
  fetch('/api/alerts/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      channels: ['SMS', 'EMAIL', 'DASHBOARD_PUSH'],
      actor: 'District Magistrate / CALA',
      role: 'District Collector (CALA)'
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(`[DISPATCH SUCCESSFUL] Official Directive Dispatched.\nAlert ID: ${data.alert_id}\nNotified Authorities:\n${data.recipients.join('\n')}`);
    loadAuditLogs();
  })
  .catch(err => console.error(err));
}
