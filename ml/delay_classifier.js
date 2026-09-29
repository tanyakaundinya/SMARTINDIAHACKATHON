/**
 * Multi-Stage Predictive Delay Classifier for Land Acquisition Projects
 * Aligned with RFCTLARR Act 2013 Statutory Gateways & SIH Benchmark
 */

const { extractFeatures } = require('./feature_pipeline');

const WEIGHTS = {
  disbursementLag: 0.26,
  litigation: 0.28,
  statutoryUrgency: 0.20,
  mutationBacklog: 0.10,
  rrResistance: 0.08,
  forestClearance: 0.05,
  surveyDeficiency: 0.03
};

function predictRisk(project) {
  const f = extractFeatures(project);

  // Compute composite raw risk score (0.0 to 1.0+)
  let rawScore = (
    f.disbursementLagRatio * WEIGHTS.disbursementLag +
    f.litigationIntensity * WEIGHTS.litigation +
    f.statutoryUrgency * WEIGHTS.statutoryUrgency +
    f.mutationBacklogRatio * WEIGHTS.mutationBacklog +
    f.rrResistanceIndex * WEIGHTS.rrResistance +
    f.forestPenalty * WEIGHTS.forestClearance +
    f.surveyDeficiency * WEIGHTS.surveyDeficiency
  );

  // Calibrate raw score (0.10 -> 15 risk score, 0.60 -> 88 risk score)
  let scaledScore = Math.round((rawScore - 0.08) / (0.62 - 0.08) * 80 + 15);
  scaledScore = Math.min(96, Math.max(12, scaledScore));
  
  // Calculate delay probability %
  const z = (scaledScore - 50) / 16.0;
  const delayProbabilityPct = Math.round((1.0 / (1.0 + Math.exp(-z))) * 1000) / 10;

  // Categorize Risk Level
  let riskCategory = 'Low Risk';
  let badgeColor = 'green';
  if (scaledScore >= 75) {
    riskCategory = 'High Risk';
    badgeColor = 'red';
  } else if (scaledScore >= 40) {
    riskCategory = 'Medium Risk';
    badgeColor = 'amber';
  }

  // Calculate Stage-Wise Risk Probabilities (RFCTLARR Stages 1 to 6)
  const stageRisks = [
    {
      stage_id: 1,
      stage_name: 'Sec 4/11 Preliminary Notification',
      risk_pct: Math.min(95, Math.round(f.mutationBacklogRatio * 60 + f.digitizationVulnerability * 30 + 10)),
      status: project.statutory_stage_id > 1 ? 'Completed' : 'Active'
    },
    {
      stage_id: 2,
      stage_name: 'Sec 15 SIA & Objections Hearing',
      risk_pct: Math.min(95, Math.round(f.rrResistanceIndex * 50 + f.litigationIntensity * 35 + 15)),
      status: project.statutory_stage_id > 2 ? 'Completed' : (project.statutory_stage_id === 2 ? 'Active' : 'Pending')
    },
    {
      stage_id: 3,
      stage_name: 'Sec 19 R&R Scheme Declaration',
      risk_pct: Math.min(95, Math.round(f.rrResistanceIndex * 60 + f.forestPenalty * 30 + 10)),
      status: project.statutory_stage_id > 3 ? 'Completed' : (project.statutory_stage_id === 3 ? 'Active' : 'Pending')
    },
    {
      stage_id: 4,
      stage_name: 'Sec 23/30 Land Valuation & Award',
      risk_pct: Math.min(98, Math.round(f.litigationIntensity * 45 + f.statutoryUrgency * 40 + 15)),
      status: project.statutory_stage_id > 4 ? 'Completed' : (project.statutory_stage_id === 4 ? 'Active' : 'Pending')
    },
    {
      stage_id: 5,
      stage_name: 'Compensation Escrow & Disbursement',
      risk_pct: Math.min(98, Math.round(f.disbursementLagRatio * 75 + f.mutationBacklogRatio * 20 + 5)),
      status: project.statutory_stage_id > 5 ? 'Completed' : (project.statutory_stage_id === 5 ? 'Active' : 'Pending')
    },
    {
      stage_id: 6,
      stage_name: 'Sec 38 Physical Possession Handover',
      risk_pct: Math.min(95, Math.round(f.litigationIntensity * 40 + f.disbursementLagRatio * 35 + f.rrResistanceIndex * 20 + 5)),
      status: project.statutory_stage_id === 6 ? 'Active' : 'Pending'
    }
  ];

  return {
    risk_score: scaledScore,
    delay_probability_pct: delayProbabilityPct,
    risk_category: riskCategory,
    badge_color: badgeColor,
    stage_risks: stageRisks,
    features: f
  };
}

module.exports = {
  predictRisk
};
