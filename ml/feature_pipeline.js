/**
 * Feature Engineering & Normalization Pipeline for BHU-DRISHTI
 * Integrates BhoomiRashi, DILRMP, eCourts, and Statutory Timeline features
 */

function extractFeatures(project) {
  const compDisbursedPct = Math.min(100, Math.max(0, project.compensation_disbursed_pct || 0));
  const disbursementLagRatio = (100.0 - compDisbursedPct) / 100.0;

  const courtCases = project.active_court_cases || 0;
  const stayOrders = project.stay_orders_active || 0;
  const rawLitigation = (courtCases * 3.5 + stayOrders * 22.0);
  const litigationIntensity = Math.min(1.0, rawLitigation / 100.0);

  const daysSinceSec19 = project.days_since_sec19 || 0;
  // Section 25 states award must be passed within 365 days of Sec 19
  const statutoryUrgency = Math.min(1.5, daysSinceSec19 / 365.0);

  const dilrmpScore = project.dilrmp_digitization_score || 80.0;
  const digitizationVulnerability = Math.max(0, (100.0 - dilrmpScore) / 100.0);

  const mutationPendency = project.mutation_pendency_pct || 10.0;
  const mutationBacklogRatio = Math.min(1.0, mutationPendency / 100.0);

  const consentPct = project.rr_gram_sabha_consent_pct || 85.0;
  const rrResistanceIndex = Math.max(0, (100.0 - consentPct) / 100.0);

  let forestPenalty = 0.0;
  const forestStatus = (project.forest_clearance_status || '').toLowerCase();
  if (forestStatus.includes('pending') || forestStatus.includes('stage-i')) {
    forestPenalty = 0.40;
  } else if (forestStatus.includes('progress') || forestStatus.includes('stage-ii') || forestStatus.includes('review')) {
    forestPenalty = 0.20;
  } else {
    forestPenalty = 0.02;
  }

  const surveyTeams = project.survey_teams_deployed || 3;
  const surveyDeficiency = Math.max(0, (5.0 - surveyTeams) / 5.0);

  const areaHa = project.total_area_ha || 100;
  const pafs = project.pafs_count || 500;
  const scaleComplexity = Math.min(1.0, (Math.log10(areaHa) * 0.25 + Math.log10(pafs) * 0.25));

  return {
    disbursementLagRatio,
    litigationIntensity,
    statutoryUrgency,
    digitizationVulnerability,
    mutationBacklogRatio,
    rrResistanceIndex,
    forestPenalty,
    surveyDeficiency,
    scaleComplexity
  };
}

module.exports = {
  extractFeatures
};
