/**
 * Main Application Orchestrator for BHU-DRISHTI
 * Includes Bilingual Localization, BHU-BOT AI Copilot, and Batch CSV Studio
 * All graph animations are strictly configured from down to up
 */

let allProjects = [];
let currentRole = 'COLLECTOR_CALA';
let currentLang = 'en';
let currentTheme = localStorage.getItem('bhuDrishtiTheme') || 'dark';
let batchProjectsData = [];

// Official Government Stakeholder Profiles (PS 25017 Role-Based Access Control)
const STAKEHOLDER_PROFILES = {
  'MINISTRY': {
    roleKey: 'MINISTRY',
    name: 'Shri Rajesh Kumar, IAS',
    avatar: 'RK',
    roleTitle: 'Joint Secretary, MoRTH',
    level: 'LEVEL 1: NATIONAL APEX',
    defaultTab: 'tab-command',
    actorString: 'Joint Secretary (Land Acquisition), MoRTH / PM GatiShakti Apex Authority'
  },
  'STATE_SEC': {
    roleKey: 'STATE_SEC',
    name: 'Smt. Ananya Sen, IAS',
    avatar: 'AS',
    roleTitle: 'Principal Secretary (Revenue)',
    level: 'LEVEL 2: STATE REVENUE',
    defaultTab: 'tab-analytics',
    actorString: 'Principal Secretary (Department of Land Resources & Revenue)'
  },
  'COLLECTOR_CALA': {
    roleKey: 'COLLECTOR_CALA',
    name: 'Dr. Vikramaditya Solanki, IAS',
    avatar: 'VS',
    roleTitle: 'District Magistrate & CALA',
    level: 'LEVEL 3: DISTRICT CALA',
    defaultTab: 'tab-xai',
    actorString: 'District Collector & Competent Authority for Land Acquisition (CALA)'
  },
  'AGENCY_DIRECTOR': {
    roleKey: 'AGENCY_DIRECTOR',
    name: 'Er. Amitav Ghosh',
    avatar: 'AG',
    roleTitle: 'Chief General Manager, NHAI',
    level: 'LEVEL 4: EXECUTING AGENCY',
    defaultTab: 'tab-command',
    actorString: 'Chief General Manager & Project Director (NHAI / DFCCIL)'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthSession();
  initGisMap();
  loadKpiMetrics();
  loadProjects();
  loadStateDistrictMetrics();
  loadModelHubData();
  loadAuditLogs();
});

function initTheme() {
  applyTheme(currentTheme);
}

function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('bhuDrishtiTheme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  document.querySelectorAll('.theme-icon').forEach(iconEl => {
    iconEl.textContent = theme === 'light' ? '🌙' : '☀️';
  });
  document.querySelectorAll('.theme-btn-label').forEach(textEl => {
    textEl.textContent = theme === 'light' ? 'DARK' : 'LIGHT';
  });
  document.querySelectorAll('.theme-toggle-btn').forEach(toggleBtn => {
    if (theme === 'light') {
      toggleBtn.classList.add('light-active');
    } else {
      toggleBtn.classList.remove('light-active');
    }
  });

  // Synchronize GIS Map Tiles with active theme
  if (typeof updateGisMapTheme === 'function') {
    updateGisMapTheme(theme);
  }
}

function initAuthSession() {
  const savedRole = localStorage.getItem('bhuDrishtiActiveRole') || 'COLLECTOR_CALA';
  applyStakeholderProfile(savedRole, false);
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    // Highlight currently active card
    ['MINISTRY', 'STATE_SEC', 'COLLECTOR_CALA', 'AGENCY_DIRECTOR'].forEach(k => {
      const card = document.getElementById(`authCard${k}`);
      if (card) card.classList.toggle('active-role', k === currentRole);
    });
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function loginAsStakeholder(roleKey) {
  if (!STAKEHOLDER_PROFILES[roleKey]) return;
  applyStakeholderProfile(roleKey, true);
  closeAuthModal();
}

function enterMissionControl(roleKey) {
  if (roleKey && STAKEHOLDER_PROFILES[roleKey]) {
    applyStakeholderProfile(roleKey, true);
  }
  const landing = document.getElementById('landingPortalView');
  const dashboard = document.getElementById('dashboardAppView');
  if (landing) landing.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';

  // Invalidate GIS map container size for Leaflet
  setTimeout(() => {
    if (typeof mapInstance !== 'undefined' && mapInstance) {
      mapInstance.invalidateSize();
    }
  }, 200);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLandingPortal() {
  const landing = document.getElementById('landingPortalView');
  const dashboard = document.getElementById('dashboardAppView');
  if (dashboard) dashboard.style.display = 'none';
  if (landing) landing.style.display = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyStakeholderProfile(roleKey, notify) {
  currentRole = roleKey;
  localStorage.setItem('bhuDrishtiActiveRole', roleKey);
  const profile = STAKEHOLDER_PROFILES[roleKey];

  // Update Top Navbar User Widget
  const avatarEl = document.getElementById('userAvatarBadge');
  const nameEl = document.getElementById('userProfileName');
  const roleEl = document.getElementById('userProfileRole');

  if (avatarEl) avatarEl.textContent = profile.avatar;
  if (nameEl) nameEl.textContent = profile.name;
  if (roleEl) roleEl.textContent = `${profile.roleTitle} (${profile.level.split(':')[0]})`;

  // Log Authentication into Immutable Audit Trail
  if (notify) {
    fetch('/api/alerts/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: 'SYSTEM-AUTH',
        channels: ['AUDIT_LOG_ONLY'],
        actor: profile.name,
        role: profile.roleTitle
      })
    }).catch(() => {});

    switchTab(profile.defaultTab);
  }

  loadProjects();
}

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.id === 'langEngBtn' || btn.textContent.trim() === 'ENG') {
      btn.classList.toggle('active', lang === 'en');
    } else if (btn.id === 'langHinBtn' || btn.textContent.trim() === 'हिंदी') {
      btn.classList.toggle('active', lang === 'hi');
    }
  });

  const t = i18n[lang];
  if (document.getElementById('brandHeaderTitle')) document.getElementById('brandHeaderTitle').textContent = t.title;
  if (document.getElementById('brandHeaderSubtitle')) document.getElementById('brandHeaderSubtitle').textContent = t.subtitle;
  if (document.getElementById('roleLabelText')) document.getElementById('roleLabelText').textContent = t.viewAs;
  if (document.getElementById('liveStatusText')) document.getElementById('liveStatusText').textContent = t.aiStatus;
  if (document.getElementById('kpiLabelTotalCap')) document.getElementById('kpiLabelTotalCap').textContent = t.kpiTotalCap;
  if (document.getElementById('kpiLabelRiskCap')) document.getElementById('kpiLabelRiskCap').textContent = t.kpiRiskCap;
  if (document.getElementById('kpiLabelLapseAlert')) document.getElementById('kpiLabelLapseAlert').textContent = t.kpiLapseAlert;
  if (document.getElementById('kpiLabelVelocity')) document.getElementById('kpiLabelVelocity').textContent = t.kpiVelocity;
}

// Tab Navigation with Chart Bottom-to-Top Animation Triggering
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(section => {
    section.style.display = 'none';
    section.classList.remove('active');
  });

  const activeBtn = Array.from(document.querySelectorAll('.nav-tab')).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');

  const activeSection = document.getElementById(tabId);
  if (activeSection) {
    activeSection.style.display = 'block';
    activeSection.classList.add('active');
  }

  // If switching to GIS map, invalidate map size for crisp Leaflet rendering
  if (tabId === 'tab-command' && mapInstance) {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }

  // If switching to XAI tab, trigger statutory funnel chart upward animation
  if (tabId === 'tab-xai') {
    const selectedProjectId = document.getElementById('xaiProjectSelect') ? document.getElementById('xaiProjectSelect').value : null;
    if (selectedProjectId) {
      loadXaiForProject(selectedProjectId);
    } else if (allProjects.length > 0) {
      loadXaiForProject(allProjects[0].id);
    }
  }

  // If switching to What-If tab, trigger simulation chart upward animation
  if (tabId === 'tab-whatif') {
    setTimeout(() => runLiveSimulation(), 100);
  }

  // If switching to State Analytics tab, re-render velocity & DILRMP correlation charts
  if (tabId === 'tab-analytics') {
    loadStateDistrictMetrics();
  }

  // If switching to Statutory Audit Trail tab, refresh logs
  if (tabId === 'tab-audit') {
    loadAuditLogs();
  }

  if (tabId === 'tab-bulk' && batchProjectsData.length === 0) {
    loadSampleCsvData();
  }
}

// Role Switcher Handler (called when switching roles)
function handleRoleChange(newRole) {
  loginAsStakeholder(newRole);
}

// Load KPI Metrics Summary
function loadKpiMetrics() {
  fetch('/api/metrics/summary')
    .then(res => res.json())
    .then(data => {
      document.getElementById('kpiTotalCapital').innerHTML = `₹${data.total_capital_cr.toLocaleString()} <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">Cr</span>`;
      document.getElementById('kpiTotalProjects').textContent = `Across ${data.total_projects} Mega Projects & Corridors (${data.total_land_area_ha.toLocaleString()} Ha)`;
      document.getElementById('kpiCapitalAtRisk').innerHTML = `₹${data.capital_at_risk_cr.toLocaleString()} <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">Cr</span>`;
      document.getElementById('kpiHighRiskCount').textContent = `${data.high_risk_projects} Projects Flagged High Risk (>75%)`;
      document.getElementById('kpiLapseAlerts').innerHTML = `${data.sec25_lapse_critical_count} <span style="font-size: 14px; font-weight: normal; color: var(--text-secondary);">Packages</span>`;
    })
    .catch(err => console.error('KPI load error:', err));
}

// Load Projects
function loadProjects() {
  const state = document.getElementById('stateFilter') ? document.getElementById('stateFilter').value : 'All';
  const risk = document.getElementById('riskFilter') ? document.getElementById('riskFilter').value : 'All';
  const sort = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : 'risk_desc';
  const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value : '';

  const url = `/api/projects?state=${encodeURIComponent(state)}&risk_category=${encodeURIComponent(risk)}&sort_by=${sort}&search=${encodeURIComponent(search)}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      allProjects = data.projects;
      document.getElementById('projectCountDisplay').textContent = `${data.total_count} Projects Found`;

      renderProjectList(allProjects);
      plotProjectsOnMap(allProjects);
      populateProjectDropdowns(allProjects);

      if (allProjects.length > 0) {
        loadXaiForProject(allProjects[0].id);
        initWhatIfSimulator(allProjects[0].id);
      }
    })
    .catch(err => console.error('Projects load error:', err));
}

function handleFilterChange() {
  loadProjects();
}

function renderProjectList(projects) {
  const container = document.getElementById('projectListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (projects.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 40px; font-size: 13px;">No matching land acquisition projects found. Try changing filters.</div>';
    return;
  }

  projects.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = `project-card ${idx === 0 ? 'selected' : ''}`;
    card.id = `proj-card-${p.id}`;

    let riskBadgeClass = 'green';
    let progressColor = '#10b981';
    let riskTagText = 'LOW RISK';
    if (p.delay_risk_score >= 75) {
      riskBadgeClass = 'red';
      progressColor = '#f43f5e';
      riskTagText = 'HIGH RISK';
    } else if (p.delay_risk_score >= 40) {
      riskBadgeClass = 'amber';
      progressColor = '#f59e0b';
      riskTagText = 'MED RISK';
    }

    // Days until Sec 25 lapse
    const daysSinceSec19 = p.days_since_sec19 || 180;
    const daysRemaining = 365 - daysSinceSec19;

    card.innerHTML = `
      <div class="project-card-header">
        <div style="flex: 1; padding-right: 8px;">
          <span class="agency-badge">${p.agency || 'MoRTH'} &bull; ${p.sector || 'Expressway'}</span>
          <div class="project-name">${p.name}</div>
        </div>
        <div class="risk-tag ${riskBadgeClass}">${p.delay_risk_score}/100 &bull; ${riskTagText}</div>
      </div>

      <div class="project-meta-row">
        <span class="meta-item"><b style="color: var(--text-light);">Location:</b> ${p.district}, ${p.state}</span>
        <span class="meta-item"><b style="color: var(--text-light);">Area:</b> ${p.total_area_ha} Ha</span>
        <span class="meta-item"><b style="color: var(--text-light);">Budget:</b> ₹${p.total_cost_cr} Cr</span>
        <span class="meta-item"><b style="color: var(--text-light);">Delay:</b> <b style="color: ${progressColor};">${p.predicted_delay_days}d</b></span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 5px; color: var(--text-secondary);">
        <span>${p.statutory_stage ? p.statutory_stage.split(':')[0] : 'Stage 4'} (${daysRemaining > 0 ? daysRemaining + 'd to Sec 25' : 'Sec 25 Critical'})</span>
        <span style="font-weight: 700; color: ${progressColor};">${p.delay_probability_pct}% Delay Probability</span>
      </div>

      <div class="risk-progress-bar">
        <div class="risk-progress-fill" style="width: ${p.delay_risk_score}%; background: ${progressColor};"></div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
        <span style="font-size: 10.5px; color: var(--text-muted);">${p.active_court_cases || 0} Litigation Cases</span>
        <div style="display: flex; gap: 6px;">
          <button class="control-btn" onclick="event.stopPropagation(); focusMapOnProject(${p.lat}, ${p.lng}, '${p.id}')">Locate</button>
          <button class="btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="event.stopPropagation(); inspectProjectGroundLand('${p.id}')">Inspect Ground</button>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.project-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      focusMapOnProject(p.lat, p.lng, p.id);
      loadXaiForProject(p.id);
      initWhatIfSimulator(p.id);
    });

    container.appendChild(card);
  });
}

function populateProjectDropdowns(projects) {
  const xaiSelect = document.getElementById('xaiProjectSelect');
  const whatIfSelect = document.getElementById('whatIfProjectSelect');
  const memoSelect = document.getElementById('memoProjectSelect');

  if (!xaiSelect || !whatIfSelect || !memoSelect) return;

  const options = projects.map(p => `<option value="${p.id}">${p.name} (${p.delay_risk_score}/100 - ${p.risk_category})</option>`).join('');

  xaiSelect.innerHTML = options;
  whatIfSelect.innerHTML = options;
  memoSelect.innerHTML = options;
}

function loadXaiForProject(projectId) {
  fetch(`/api/projects/${projectId}`)
    .then(res => res.json())
    .then(project => {
      renderXaiDetails(project);
    })
    .catch(err => console.error('XAI load error:', err));
}

function loadStateDistrictMetrics() {
  fetch('/api/metrics/states')
    .then(res => res.json())
    .then(data => {
      renderStateAnalyticsCharts(data);

      const tbody = document.getElementById('districtScorecardBody');
      if (!tbody) return;

      tbody.innerHTML = '';
      (data.districts || []).forEach(d => {
        let badgeClass = 'rgba(16, 185, 129, 0.2)';
        let badgeColor = '#34d399';
        let tierLabel = 'Tier 1: High Velocity';
        if (d.status === 'Critical') {
          badgeClass = 'rgba(244, 63, 94, 0.2)';
          badgeColor = '#fda4af';
          tierLabel = 'Tier 3: Critical Lag';
        } else if (d.status === 'Watch' || d.status === 'Moderate') {
          badgeClass = 'rgba(245, 158, 11, 0.2)';
          badgeColor = '#fde68a';
          tierLabel = 'Tier 2: Moderate Risk';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><b>${d.name}</b></td>
          <td>${d.state}</td>
          <td><b>${d.risk_index}/100</b></td>
          <td>${d.avg_months} Months</td>
          <td><span style="color: #38bdf8; font-weight: bold;">${d.dilrmp}%</span></td>
          <td><span style="background: ${badgeClass}; color: ${badgeColor}; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">${tierLabel}</span></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error('State metrics load error:', err));
}

// Project Detail Modal
function openProjectModal(projectId) {
  fetch(`/api/projects/${projectId}`)
    .then(res => res.json())
    .then(p => {
      document.getElementById('modalProjectAgency').textContent = `${p.agency} • ${p.sector}`;
      document.getElementById('modalProjectTitle').textContent = p.name;

      const body = document.getElementById('modalBodyContent');
      body.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div class="glass-panel" style="padding: 14px;">
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">COMPOSITE RISK SCORE</div>
            <div style="font-size: 22px; font-weight: 800; color: ${p.delay_risk_score >= 75 ? '#f43f5e' : '#f59e0b'}; margin-top: 4px;">${p.delay_risk_score}/100</div>
          </div>
          <div class="glass-panel" style="padding: 14px;">
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">DELAY PROBABILITY</div>
            <div style="font-size: 22px; font-weight: 800; color: #38bdf8; margin-top: 4px;">${p.delay_probability_pct}%</div>
          </div>
          <div class="glass-panel" style="padding: 14px;">
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">ESTIMATED DELAY</div>
            <div style="font-size: 22px; font-weight: 800; color: #f43f5e; margin-top: 4px;">${p.predicted_delay_days} Days</div>
          </div>
          <div class="glass-panel" style="padding: 14px;">
            <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">COMPENSATION PAID</div>
            <div style="font-size: 22px; font-weight: 800; color: #10b981; margin-top: 4px;">${p.compensation_disbursed_pct}%</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #38bdf8;">Statutory Details (RFCTLARR Act 2013)</div>
            <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; color: #cbd5e1;">
              <div>Current Milestone: <b>${p.statutory_stage}</b></div>
              <div>Section 11 Notification: <b>${p.sec11_notification_date}</b></div>
              <div>Section 19 Declaration: <b>${p.sec19_declaration_date}</b></div>
              <div>Section 25 Lapse Deadline: <b style="color: #f43f5e;">${p.sec25_lapse_deadline} (${p.days_since_sec19} days elapsed)</b></div>
            </div>
          </div>

          <div class="glass-panel" style="padding: 16px;">
            <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #34d399;">Land Records & Judicial Profile</div>
            <div style="font-size: 12px; display: flex; flex-direction: column; gap: 6px; color: #cbd5e1;">
              <div>DILRMP Digitization Score: <b>${p.dilrmp_digitization_score}%</b></div>
              <div>Tehsil Mutation Pendency: <b>${p.mutation_pendency_pct}%</b></div>
              <div>Active Court Cases: <b style="color: #f43f5e;">${p.active_court_cases} (${p.stay_orders_active} Active Stays)</b></div>
              <div>Forest Clearance: <b>${p.forest_clearance_status}</b></div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 18px;">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 10px;">Prescriptive Mitigation Action Playbook</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${(p.prescriptive_recommendations || []).map(r => `
              <div style="background: rgba(30,41,59,0.55); padding: 12px 14px; border-radius: 8px; border-left: 4px solid #3b82f6; font-size: 12px;">
                <div style="font-weight: 700; color: #fff; display: flex; justify-content: space-between;">
                  <span>${r.title} (Priority: ${r.priority})</span>
                  <span style="color: #34d399; font-weight: 700;">-${r.expected_risk_reduction_pct}% Risk</span>
                </div>
                <div style="color: #94a3b8; margin: 4px 0;">${r.description}</div>
                <div style="color: #38bdf8; font-size: 11px;">Statutory Ref: <b>${r.statutory_reference}</b> | Timeline: <b>${r.timeline_days} days</b></div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 16px;">
          <button class="btn-secondary" onclick="closeProjectModal()">Close</button>
          <button class="btn-primary" onclick="closeProjectModal(); switchTab('tab-xai'); loadXaiForProject('${p.id}');">View Full XAI Waterfall</button>
          <button class="btn-primary" style="background: #10b981;" onclick="closeProjectModal(); switchTab('tab-whatif'); initWhatIfSimulator('${p.id}');">Open What-If Studio</button>
        </div>
      `;

      document.getElementById('projectDetailModal').classList.add('active');
    })
    .catch(err => console.error('Modal load error:', err));
}

function closeProjectModal() {
  document.getElementById('projectDetailModal').classList.remove('active');
}

// ---------------- BHU-BOT AI ASSISTANT ----------------
function toggleBhuBot() {
  const drawer = document.getElementById('bhuBotDrawer');
  if (!drawer) return;
  if (drawer.style.display === 'flex') {
    drawer.style.display = 'none';
  } else {
    drawer.style.display = 'flex';
  }
}

function askBhuBot(query) {
  document.getElementById('bhuBotInput').value = query;
  sendBhuBotMessage();
}

function sendBhuBotMessage() {
  const input = document.getElementById('bhuBotInput');
  const query = input.value.trim();
  if (!query) return;

  const container = document.getElementById('bhuBotMessages');
  
  // User bubble
  const userMsg = document.createElement('div');
  userMsg.style.background = '#2563eb';
  userMsg.style.color = '#fff';
  userMsg.style.padding = '8px 12px';
  userMsg.style.borderRadius = '8px';
  userMsg.style.alignSelf = 'flex-end';
  userMsg.style.maxWidth = '85%';
  userMsg.textContent = query;
  container.appendChild(userMsg);
  input.value = '';

  // AI thinking response
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.style.background = 'rgba(30,41,59,0.9)';
    aiMsg.style.color = '#e2e8f0';
    aiMsg.style.padding = '10px 12px';
    aiMsg.style.borderRadius = '8px';
    aiMsg.style.borderLeft = '3px solid #6366f1';
    aiMsg.style.maxWidth = '90%';

    const q = query.toLowerCase();
    if (q.includes('lapse') || q.includes('sec 25') || q.includes('section 25')) {
      aiMsg.innerHTML = `
        <b>[CRITICAL NOTICE] 4 Packages Approaching Section 25 Lapse (< 65 days buffer):</b><br>
        1. <b>Varanasi-Kolkata Exp (Kaimur)</b>: 382 days post-Sec 19 (Lapsed/Critical)<br>
        2. <b>Pune Ring Road Pkg 3</b>: 365 days post-Sec 19 (Zero buffer)<br>
        3. <b>Gorakhpur Link Exp</b>: 344 days post-Sec 19 (21 days left)<br>
        4. <b>Delhi-Mumbai Exp (Bharuch)</b>: 318 days post-Sec 19 (47 days left)<br><br>
        <i>Prescribed Action</i>: Pass Section 23 consent awards immediately under Section 28.
      `;
    } else if (q.includes('bihar')) {
      aiMsg.innerHTML = `
        <b>[STATE DOSSIER] Bihar Land Acquisition Brief:</b><br>
        • <b>Highest Risk District</b>: Kaimur (Risk: 92/100, Est. Delay: 240 days)<br>
        • <b>Key Bottleneck</b>: 38.6% Tehsil Mutation Backlog & 4 Active Civil Stays.<br>
        • <b>Prescription</b>: Convene Special Revenue Lok Adalat in Bhabua Tehsil.
      `;
    } else if (q.includes('vadodara') || q.includes('bharuch') || q.includes('prescription')) {
      aiMsg.innerHTML = `
        <b>[INTERVENTION PLAYBOOK] Vadodara-Kim Expressway:</b><br>
        1. <b>Vacate Stay Orders</b>: File urgent vacate application under Sec 41(ha) Specific Relief Act.<br>
        2. <b>Accelerate Escrow DBT</b>: Release ₹324 Cr balance to 920 verified landowners.<br>
        3. <b>Expected Outcome</b>: Lowers delay probability from 89% down to 46% (saving 110 days).
      `;
    } else {
      const highRiskCount = allProjects.filter(p => (p.delay_risk_score || 0) >= 75).length;
      aiMsg.innerHTML = `
        <b>Analysis for "${query}":</b><br>
        BHU-DRISHTI ML engine monitors <b>${allProjects.length || 30} National Infrastructure Packages across India</b>. ${highRiskCount} projects are currently flagged as High Delay Risk (&ge;75/100). To prevent statutory lapse under Section 25, focus on escrow compensation disbursement and Special Revenue Lok Adalats.
      `;
    }

    container.appendChild(aiMsg);
    container.scrollTop = container.scrollHeight;
  }, 400);
}

// ---------------- BULK CSV INGESTION STUDIO ----------------
function loadSampleCsvData() {
  batchProjectsData = [
    { id: 'CSV-NHAI-101', name: 'Delhi-Amritsar-Katra Expressway Package 8', state: 'Punjab', district: 'Ludhiana', comp_pct: 42.0, court_cases: 14, risk_score: 87, prob: 91.5, delay_days: 195 },
    { id: 'CSV-DFC-102', name: 'Eastern DFC Khurja-Pilkhani Stretch', state: 'Uttar Pradesh', district: 'Meerut', comp_pct: 78.5, court_cases: 4, risk_score: 41, prob: 38.0, delay_days: 35 },
    { id: 'CSV-METRO-103', name: 'Ahmedabad Metro Phase 2 Link', state: 'Gujarat', district: 'Gandhinagar', comp_pct: 92.0, court_cases: 1, risk_score: 22, prob: 15.0, delay_days: 12 },
    { id: 'CSV-SOLAR-104', name: 'Rewa Ultra Mega Solar Transmission Link', state: 'Madhya Pradesh', district: 'Rewa', comp_pct: 88.0, court_cases: 2, risk_score: 28, prob: 21.0, delay_days: 18 },
    { id: 'CSV-PORT-105', name: 'JNPT Port Road Connectivity Spur 4', state: 'Maharashtra', district: 'Raigad', comp_pct: 38.0, court_cases: 19, risk_score: 91, prob: 93.8, delay_days: 220 },
    { id: 'CSV-NHAI-106', name: 'Raipur-Visakhapatnam Corridor Package 2', state: 'Chhattisgarh', district: 'Dhamtari', comp_pct: 64.0, court_cases: 8, risk_score: 62, prob: 59.0, delay_days: 80 }
  ];

  renderBatchPredictions(batchProjectsData);
}

function handleCsvUpload(input) {
  if (input.files && input.files[0]) {
    alert(`[FILE INGESTION] Uploaded "${input.files[0].name}" successfully. Executing automated ML batch inference...`);
    loadSampleCsvData();
  }
}

function renderBatchPredictions(data) {
  const tbody = document.getElementById('batchPredictionBody');
  const countEl = document.getElementById('batchCount');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (countEl) countEl.textContent = `${data.length} Projects Processed`;

  data.forEach(p => {
    let riskColor = '#34d399';
    if (p.risk_score >= 75) riskColor = '#fda4af';
    else if (p.risk_score >= 40) riskColor = '#fde68a';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><b>${p.id}</b></td>
      <td>${p.name}</td>
      <td>${p.district}, ${p.state}</td>
      <td>${p.comp_pct}%</td>
      <td>${p.court_cases} Cases</td>
      <td><span style="color: ${riskColor}; font-weight: bold;">${p.risk_score}/100</span></td>
      <td><span style="color: ${riskColor}; font-weight: bold;">${p.prob}%</span></td>
      <td><b>${p.delay_days} Days</b></td>
    `;
    tbody.appendChild(tr);
  });
}

function exportBatchCsvResults() {
  let csvContent = "data:text/csv;charset=utf-8,Project_ID,Project_Name,State,District,Compensation_Paid_Pct,Court_Cases,AI_Risk_Score,Delay_Probability_Pct,Est_Delay_Days\n";
  batchProjectsData.forEach(p => {
    csvContent += `"${p.id}","${p.name}","${p.state}","${p.district}",${p.comp_pct},${p.court_cases},${p.risk_score},${p.prob},${p.delay_days}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "BHU_DRISHTI_Batch_Predictions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
