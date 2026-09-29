/**
 * BHU-DRISHTI: AI-Powered Predictive Analytics System for Land Acquisition Delays
 * High-Performance Express REST API & Decision Support Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { predictRisk } = require('./ml/delay_classifier');
const { predictDelayDuration } = require('./ml/duration_regressor');
const { explainPrediction } = require('./ml/xai_engine');
const { generateRecommendations } = require('./ml/prescriptive_engine');
const { simulateScenario } = require('./ml/what_if_simulator');
const { getModelMetadata, retrainModel } = require('./ml/continuous_learning');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load datasets
const projectsPath = path.join(__dirname, 'data', 'projects_dataset.json');
const stateMetricsPath = path.join(__dirname, 'data', 'state_district_metrics.json');
const corridorsGisPath = path.join(__dirname, 'data', 'corridors_gis.json');
const auditLogsPath = path.join(__dirname, 'data', 'audit_logs.json');

function getProjectsData() {
  const raw = fs.readFileSync(projectsPath, 'utf8');
  const projects = JSON.parse(raw);
  
  // Enrich each project dynamically with latest ML predictions
  return projects.map(proj => {
    const risk = predictRisk(proj);
    const duration = predictDelayDuration(proj);
    const xai = explainPrediction(proj);
    const recommendations = generateRecommendations(proj, xai);

    return {
      ...proj,
      delay_risk_score: risk.risk_score,
      delay_probability_pct: risk.delay_probability_pct,
      risk_category: risk.risk_category,
      badge_color: risk.badge_color,
      predicted_delay_days: duration.predicted_delay_days,
      predicted_delay_months: duration.predicted_delay_months,
      stage_risks: risk.stage_risks,
      xai_explanation: xai,
      prescriptive_recommendations: recommendations
    };
  });
}

function logAudit(actor, role, action, details, req) {
  try {
    const raw = fs.readFileSync(auditLogsPath, 'utf8');
    const logs = JSON.parse(raw);
    const timestamp = new Date().toISOString();
    const hash = crypto.createHash('sha256').update(`${timestamp}-${actor}-${action}-${details}`).digest('hex');
    
    const newEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp,
      actor: actor || 'Government Administrator',
      role: role || 'District Magistrate (CALA)',
      action,
      details,
      ip_address: req ? (req.ip || '127.0.0.1') : '127.0.0.1',
      hash
    };
    
    logs.unshift(newEntry);
    fs.writeFileSync(auditLogsPath, JSON.stringify(logs.slice(0, 50), null, 2));
    return newEntry;
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// ---------------- REST API ENDPOINTS ----------------

// System Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    system: 'BHU-DRISHTI National Land Acquisition Intelligence Platform',
    version: 'v2.4.1',
    server_time: new Date().toISOString(),
    statutory_engine: 'RFCTLARR Act 2013 / NH Act 1956'
  });
});

// Macro KPI Summary
app.get('/api/metrics/summary', (req, res) => {
  const projects = getProjectsData();
  
  const totalProjects = projects.length;
  const highRiskCount = projects.filter(p => p.delay_risk_score >= 75).length;
  const mediumRiskCount = projects.filter(p => p.delay_risk_score >= 40 && p.delay_risk_score < 75).length;
  const lowRiskCount = projects.filter(p => p.delay_risk_score < 40).length;

  const totalCapitalCr = projects.reduce((sum, p) => sum + (p.total_cost_cr || 0), 0);
  const capitalAtRiskCr = projects.filter(p => p.delay_risk_score >= 75).reduce((sum, p) => sum + (p.total_cost_cr || 0), 0);
  const totalAreaHa = projects.reduce((sum, p) => sum + (p.total_area_ha || 0), 0);
  const totalPafs = projects.reduce((sum, p) => sum + (p.pafs_count || 0), 0);
  
  const sec25LapseAlerts = projects.filter(p => (p.days_since_sec19 || 0) > 300 && p.statutory_stage_id <= 4).length;

  res.json({
    total_projects: totalProjects,
    high_risk_projects: highRiskCount,
    medium_risk_projects: mediumRiskCount,
    low_risk_projects: lowRiskCount,
    total_capital_cr: Math.round(totalCapitalCr),
    capital_at_risk_cr: Math.round(capitalAtRiskCr),
    total_land_area_ha: Math.round(totalAreaHa),
    total_affected_families: totalPafs,
    sec25_lapse_critical_count: sec25LapseAlerts,
    national_avg_clearance_velocity_months: 14.8
  });
});

// Projects Listing with multi-parameter filtering
app.get('/api/projects', (req, res) => {
  let projects = getProjectsData();
  const { state, sector, risk_category, agency, search, sort_by } = req.query;

  if (state && state !== 'All') {
    projects = projects.filter(p => p.state.toLowerCase() === state.toLowerCase());
  }

  if (sector && sector !== 'All') {
    projects = projects.filter(p => p.sector.toLowerCase() === sector.toLowerCase());
  }

  if (risk_category && risk_category !== 'All') {
    projects = projects.filter(p => p.risk_category.toLowerCase() === risk_category.toLowerCase());
  }

  if (agency && agency !== 'All') {
    projects = projects.filter(p => p.agency.toLowerCase().includes(agency.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort_by === 'risk_desc') {
    projects.sort((a, b) => b.delay_risk_score - a.delay_risk_score);
  } else if (sort_by === 'cost_desc') {
    projects.sort((a, b) => b.total_cost_cr - a.total_cost_cr);
  } else if (sort_by === 'delay_days_desc') {
    projects.sort((a, b) => b.predicted_delay_days - a.predicted_delay_days);
  } else {
    // Default prioritize High Risk
    projects.sort((a, b) => b.delay_risk_score - a.delay_risk_score);
  }

  res.json({
    total_count: projects.length,
    projects
  });
});

// Single Project Details
app.get('/api/projects/:id', (req, res) => {
  const projects = getProjectsData();
  const project = projects.find(p => p.id === req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json(project);
});

// State and District Metrics
app.get('/api/metrics/states', (req, res) => {
  const raw = fs.readFileSync(stateMetricsPath, 'utf8');
  res.json(JSON.parse(raw));
});

// GIS Corridors GeoJSON
app.get('/api/gis/corridors', (req, res) => {
  const raw = fs.readFileSync(corridorsGisPath, 'utf8');
  res.json(JSON.parse(raw));
});

// Cadastral Survey Parcels GeoJSON
app.get('/api/gis/parcels', (req, res) => {
  const cadastralPath = path.join(__dirname, 'data', 'cadastral_parcels.json');
  if (fs.existsSync(cadastralPath)) {
    const raw = fs.readFileSync(cadastralPath, 'utf8');
    res.json(JSON.parse(raw));
  } else {
    res.json({ type: 'FeatureCollection', features: [] });
  }
});

// "What-If" Policy Simulation
app.post('/api/simulate', (req, res) => {
  const { project_id, params, actor, role } = req.body;
  const raw = fs.readFileSync(projectsPath, 'utf8');
  const projects = JSON.parse(raw);
  const project = projects.find(p => p.id === project_id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found for simulation' });
  }

  const result = simulateScenario(project, params || {});
  
  logAudit(actor || 'Planning Officer', role || 'Decision Support User', 'SIMULATION_EXECUTE', `Ran policy what-if simulation on ${project.name}`, req);

  res.json(result);
});

// Continuous Learning Model Status
app.get('/api/model/status', (req, res) => {
  res.json(getModelMetadata());
});

// Retrain Continuous Learning Model
app.post('/api/model/retrain', (req, res) => {
  const { new_cases, actor, role } = req.body;
  const result = retrainModel(new_cases);

  logAudit(actor || 'AI System Admin', role || 'Central Ministry', 'MODEL_RETRAIN', `Triggered model retraining. Updated version to ${result.new_version}`, req);

  res.json(result);
});

// Audit Logs
app.get('/api/audit/logs', (req, res) => {
  const raw = fs.readFileSync(auditLogsPath, 'utf8');
  res.json(JSON.parse(raw));
});

// Generate Official Government Directive / D.O. Letter Memo
app.post('/api/memos/generate', (req, res) => {
  const { project_id, target_role, memo_type, actor } = req.body;
  const projects = getProjectsData();
  const project = projects.find(p => p.id === project_id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const memoNumber = `GOI-MoRTH/LA-PRED/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const memoContent = {
    memo_number: memoNumber,
    date: dateStr,
    from: actor || 'Joint Secretary (Land Acquisition), Ministry of Road Transport & Highways, New Delhi',
    to: `The District Magistrate & Competent Authority for Land Acquisition (CALA), District ${project.district}, ${project.state}`,
    subject: `TIME-BOUND DIRECTIVE: Early Mitigation of Land Acquisition Delay for ${project.name} [ID: ${project.id}]`,
    body: [
      `1. Predictive analytics from the National Land Governance Intelligence System (BHU-DRISHTI) indicate that the subject project has entered HIGH RISK (Delay Probability: ${project.delay_probability_pct}%, Estimated Delay: ${project.predicted_delay_days} days).`,
      `2. The primary administrative and judicial bottlenecks identified are: ${project.xai_explanation.executive_explanation}`,
      `3. In order to safeguard the mandatory 12-month timeline under Section 25 of the RFCTLARR Act 2013 and ensure timely possession handover under Section 38, you are hereby requested to:`,
      `   a) Convene a Special Revenue Lok Adalat within 10 days for expeditious settlement of pending title suits and civil stays.`,
      `   b) Expedite Direct Benefit Transfer (DBT) compensation disbursement from the deposited escrow of ₹${project.escrow_deposited_cr} Cr.`,
      `   c) Issue fast-track Section 28 consent awards to willing landholders with statutory solatium.`,
      `4. A compliance report on the above actionable interventions must be submitted to the Ministry within 14 working days.`
    ],
    signatory: {
      name: 'Dr. Arvind Sharma, IAS',
      designation: 'Joint Secretary to the Government of India',
      ministry: 'Ministry of Road Transport & Highways (MoRTH)'
    }
  };

  logAudit(actor || 'Ministry Secretary', 'Central Ministry', 'MEMO_DISPATCH', `Dispatched statutory directive memo ${memoNumber} for ${project.name}`, req);

  res.json({
    success: true,
    memo: memoContent
  });
});

// Dispatch Automated Alerts
app.post('/api/alerts/dispatch', (req, res) => {
  const { project_id, channels, actor, role } = req.body;
  const projects = getProjectsData();
  const project = projects.find(p => p.id === project_id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const selectedChannels = channels || ['SMS', 'EMAIL', 'DASHBOARD_PUSH'];
  const alertId = `ALT-${Date.now().toString().slice(-5)}`;

  logAudit(actor || 'Alert Dispatcher', role || 'District Collector (CALA)', 'ALERT_DISPATCH', `Dispatched multi-channel early warning alert (${selectedChannels.join(', ')}) for ${project.name}`, req);

  res.json({
    success: true,
    alert_id: alertId,
    dispatched_to_channels: selectedChannels,
    recipients: [
      `District Magistrate (${project.district}) - dm.${project.district.toLowerCase()}@nic.in`,
      `CALA / Special Land Acquisition Officer (SLAO)`,
      `Project Director, ${project.agency}`
    ],
    timestamp: new Date().toISOString(),
    message: `Early Warning SLA Alert: ${project.name} has exceeded 75% delay risk. Statutory intervention required.`
  });
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` BHU-DRISHTI: Land Acquisition Predictive Intelligence Server `);
  console.log(` Running live on: http://localhost:${PORT}`);
  console.log(` Statutory Core: RFCTLARR Act 2013 / PM GatiShakti Aligned `);
  console.log(`================================================================`);
});
