/**
 * "What-If" Policy Scenario Simulator for Land Acquisition Governance
 * Allows administrators to model policy interventions and see real-time risk reduction
 */

const { predictRisk } = require('./delay_classifier');
const { predictDelayDuration } = require('./duration_regressor');
const { explainPrediction } = require('./xai_engine');

function simulateScenario(project, params) {
  // Clone project
  const modified = JSON.parse(JSON.stringify(project));

  // Baseline calculations
  const baselineRisk = predictRisk(project);
  const baselineDuration = predictDelayDuration(project);

  // Apply policy interventions from simulation parameters
  if (params.compensation_boost_pct !== undefined) {
    modified.compensation_disbursed_pct = Math.min(100, (project.compensation_disbursed_pct || 0) + Number(params.compensation_boost_pct));
  }

  if (params.court_cases_resolved !== undefined) {
    modified.active_court_cases = Math.max(0, (project.active_court_cases || 0) - Number(params.court_cases_resolved));
  }

  if (params.stay_orders_vacated !== undefined) {
    modified.stay_orders_active = Math.max(0, (project.stay_orders_active || 0) - Number(params.stay_orders_vacated));
  }

  if (params.extra_survey_teams !== undefined) {
    modified.survey_teams_deployed = Math.min(6, (project.survey_teams_deployed || 3) + Number(params.extra_survey_teams));
  }

  if (params.forest_clearance_fasttracked) {
    modified.forest_clearance_status = 'Fully Cleared / Stage-II Approved';
  }

  if (params.mutation_drive_completed) {
    modified.mutation_pendency_pct = Math.max(2.0, (project.mutation_pendency_pct || 20.0) * 0.25);
  }

  // Calculate new simulated predictions
  const simulatedRisk = predictRisk(modified);
  const simulatedDuration = predictDelayDuration(modified);
  const simulatedXai = explainPrediction(modified);

  const riskReduction = Math.max(0, baselineRisk.risk_score - simulatedRisk.risk_score);
  const daysSaved = Math.max(0, baselineDuration.predicted_delay_days - simulatedDuration.predicted_delay_days);

  return {
    project_id: project.id,
    project_name: project.name,
    baseline: {
      risk_score: baselineRisk.risk_score,
      delay_probability_pct: baselineRisk.delay_probability_pct,
      risk_category: baselineRisk.risk_category,
      predicted_delay_days: baselineDuration.predicted_delay_days,
      predicted_delay_months: baselineDuration.predicted_delay_months,
      stage_risks: baselineRisk.stage_risks
    },
    simulated: {
      risk_score: simulatedRisk.risk_score,
      delay_probability_pct: simulatedRisk.delay_probability_pct,
      risk_category: simulatedRisk.risk_category,
      predicted_delay_days: simulatedDuration.predicted_delay_days,
      predicted_delay_months: simulatedDuration.predicted_delay_months,
      stage_risks: simulatedRisk.stage_risks,
      top_drivers: simulatedXai.top_drivers
    },
    impact: {
      risk_score_reduction_points: riskReduction,
      risk_reduction_pct: baselineRisk.risk_score > 0 ? Math.round((riskReduction / baselineRisk.risk_score) * 100) : 0,
      net_days_saved: daysSaved,
      net_months_saved: (daysSaved / 30.4).toFixed(1),
      statutory_compliance_status: simulatedRisk.risk_score < 40 ? 'Optimal (On Schedule)' : (simulatedRisk.risk_score < 75 ? 'Moderate Watch' : 'Critical Escalation Required')
    }
  };
}

module.exports = {
  simulateScenario
};
