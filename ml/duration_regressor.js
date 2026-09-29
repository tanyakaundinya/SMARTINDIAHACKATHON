/**
 * Delay Duration Regressor for Land Acquisition Projects
 * Predicts estimated project delay in days and months based on bottleneck severity
 */

const { extractFeatures } = require('./feature_pipeline');

function predictDelayDuration(project) {
  const f = extractFeatures(project);

  // Linear + interaction terms modeling empirical Indian infrastructure delays
  let estimatedDays = (
    f.litigationIntensity * 120.0 +
    f.disbursementLagRatio * 90.0 +
    f.mutationBacklogRatio * 60.0 +
    f.statutoryUrgency * 50.0 +
    f.forestPenalty * 75.0 +
    f.rrResistanceIndex * 45.0 +
    f.surveyDeficiency * 30.0
  );

  // Apply baseline variance based on project scale
  estimatedDays = Math.max(0, Math.round(estimatedDays * (1.0 + f.scaleComplexity * 0.3)));

  // If low risk, floor close to zero
  if (f.litigationIntensity < 0.2 && f.disbursementLagRatio < 0.2) {
    estimatedDays = Math.min(25, estimatedDays);
  }

  const estimatedMonths = (estimatedDays / 30.4).toFixed(1);
  const estimatedWeeks = Math.round(estimatedDays / 7);

  return {
    predicted_delay_days: estimatedDays,
    predicted_delay_months: parseFloat(estimatedMonths),
    predicted_delay_weeks: estimatedWeeks
  };
}

module.exports = {
  predictDelayDuration
};
