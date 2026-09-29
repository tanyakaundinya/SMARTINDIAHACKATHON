/**
 * Explainable AI (XAI) Attribution Engine for Land Acquisition Risk
 * Generates SHAP-style feature attribution breakdown and plain-language root causes
 */

const { extractFeatures } = require('./feature_pipeline');

function explainPrediction(project) {
  const f = extractFeatures(project);

  const rawAttributions = [
    {
      feature_key: 'litigation_disputes',
      label: 'Court Stays & Active Legal Litigations',
      category: 'Judicial & Title',
      raw_value: `${project.active_court_cases || 0} cases (${project.stay_orders_active || 0} stays)`,
      impact_weight: f.litigationIntensity * 38.0,
      description: project.stay_orders_active > 0 
        ? `High Court stay orders active in ${project.tehsil || 'the tehsil'} freezing award declaration.` 
        : `Pending title partition suits slowing compensation determination.`
    },
    {
      feature_key: 'compensation_lag',
      label: 'Compensation Escrow & Disbursement Lag',
      category: 'Financial / CALA',
      raw_value: `${project.compensation_disbursed_pct || 0}% disbursed`,
      impact_weight: f.disbursementLagRatio * 32.0,
      description: `${(100 - (project.compensation_disbursed_pct || 0)).toFixed(1)}% of awarded compensation remains undisbursed to landowners.`
    },
    {
      feature_key: 'statutory_lapse_urgency',
      label: 'Section 25 Statutory Lapse Clock',
      category: 'Statutory SLA',
      raw_value: `${project.days_since_sec19 || 0} / 365 days`,
      impact_weight: Math.min(30.0, f.statutoryUrgency * 24.0),
      description: project.days_since_sec19 > 300 
        ? `Critical: Section 19 declaration is ${project.days_since_sec19} days old. Mandatory Sec 25 award deadline is imminent.`
        : `Statutory progress within standard window.`
    },
    {
      feature_key: 'mutation_backlog',
      label: 'Revenue Mutation & Cadastral Backlog',
      category: 'Land Records',
      raw_value: `${project.mutation_pendency_pct || 0}% pending mutations`,
      impact_weight: f.mutationBacklogRatio * 18.0,
      description: `Un-mutated joint ownership claims in tehsil records impeding clean title verification.`
    },
    {
      feature_key: 'rr_resistance',
      label: 'R&R / Gram Sabha Consensus Deficit',
      category: 'Social Impact',
      raw_value: `${project.rr_gram_sabha_consent_pct || 85}% consent`,
      impact_weight: f.rrResistanceIndex * 15.0,
      description: `Unresolved rehabilitation package demands from ${project.pafs_count || 100} Project Affected Families.`
    },
    {
      feature_key: 'forest_clearance',
      label: 'Inter-Departmental Environmental Clearance',
      category: 'Regulatory / MoEFCC',
      raw_value: project.forest_clearance_status || 'Pending',
      impact_weight: f.forestPenalty * 22.0,
      description: `Pending Stage-I/II Forest Clearance causing alignment section freeze.`
    },
    {
      feature_key: 'survey_capacity',
      label: 'Joint Measurement Survey (JMS) Staffing Deficit',
      category: 'Administrative Capacity',
      raw_value: `${project.survey_teams_deployed || 3} teams deployed`,
      impact_weight: f.surveyDeficiency * 12.0,
      description: `Survey velocity sub-optimal due to limited revenue surveyor/Ameen deployment.`
    }
  ];

  // Calculate sum of weights for percentage normalization
  const totalWeight = rawAttributions.reduce((acc, item) => acc + item.impact_weight, 0);

  const normalizedAttributions = rawAttributions.map(item => {
    const pctContribution = totalWeight > 0 ? Math.round((item.impact_weight / totalWeight) * 1000) / 10 : 0;
    return {
      ...item,
      percentage_contribution: pctContribution,
      is_top_driver: pctContribution >= 15.0
    };
  }).sort((a, b) => b.percentage_contribution - a.percentage_contribution);

  // Generate Executive Summary
  const topDrivers = normalizedAttributions.filter(a => a.is_top_driver);
  const driverNames = topDrivers.map(d => `${d.label} (${d.percentage_contribution}%)`).join(', ');
  
  const executiveExplanation = topDrivers.length > 0
    ? `The primary risk drivers for this project are ${driverNames}. Immediate intervention in these areas will yield the highest risk reduction.`
    : `Project risk is well-distributed with no severe single-point bottleneck.`;

  return {
    attributions: normalizedAttributions,
    top_drivers: topDrivers,
    executive_explanation: executiveExplanation,
    total_analyzed_factors: normalizedAttributions.length
  };
}

module.exports = {
  explainPrediction
};
