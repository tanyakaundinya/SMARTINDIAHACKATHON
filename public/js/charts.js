/**
 * Chart.js Visualizations & Analytics for BHU-DRISHTI
 * All graph animations are strictly configured from Down to Up (Bottom to Top)
 */

let stageFunnelChartInstance = null;
let stateVelocityChartInstance = null;
let dilrmpCorrelationChartInstance = null;
let simComparisonChartInstance = null;
let modelDriftChartInstance = null;

// Global animation configuration: Smooth upward rise strictly from bottom to top
const BOTTOM_TO_TOP_ANIMATION = {
  y: {
    type: 'number',
    duration: 1300,
    easing: 'easeOutQuart',
    from: (ctx) => {
      if (ctx.chart && ctx.chart.chartArea) {
        return ctx.chart.chartArea.bottom;
      }
      return 600;
    }
  }
};

/**
 * Render Statutory Milestone Funnel Chart (Stage 1 to Stage 6)
 * Horizontal bar chart: animates strictly from Left to Right
 */
function renderStageFunnelChart(stageRisks) {
  const ctx = document.getElementById('stageFunnelChart');
  if (!ctx) return;

  const labels = stageRisks.map(s => `Stage ${s.stage_id}: ${s.stage_name.split(' ')[0]} ${s.stage_name.split(' ')[1] || ''}`);
  const data = stageRisks.map(s => s.risk_pct);
  const colors = stageRisks.map(s => {
    if (s.risk_pct >= 70) return 'rgba(244, 63, 94, 0.88)';
    if (s.risk_pct >= 40) return 'rgba(245, 158, 11, 0.88)';
    return 'rgba(16, 185, 129, 0.88)';
  });

  if (stageFunnelChartInstance) {
    stageFunnelChartInstance.destroy();
  }

  stageFunnelChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Statutory Stage Delay Risk (%)',
        data: data,
        backgroundColor: colors,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1.5,
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animations: {
        x: {
          type: 'number',
          duration: 1300,
          easing: 'easeOutQuart',
          from: (ctx) => {
            if (ctx.chart && ctx.chart.scales && ctx.chart.scales.x) {
              return ctx.chart.scales.x.getPixelForValue(0);
            }
            return 0;
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(174, 195, 176, 0.1)' },
          ticks: { color: '#AEC3B0', font: { family: 'Plus Jakarta Sans', size: 11 }, callback: val => `${val}%` }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 42, 29, 0.96)',
          titleColor: '#E3EED4',
          bodyColor: '#AEC3B0',
          borderColor: 'rgba(107, 144, 113, 0.45)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: context => `Statutory Delay Risk: ${context.raw}%`
          }
        }
      }
    }
  });
}

/**
 * Render State Velocity & DILRMP Digitization Correlation Charts
 * Animates strictly from bottom to top
 */
function renderStateAnalyticsCharts(stateMetrics) {
  const ctxState = document.getElementById('stateVelocityChart');
  const ctxDilrmp = document.getElementById('dilrmpCorrelationChart');
  if (!ctxState || !ctxDilrmp) return;

  const states = stateMetrics.states || [];
  const stateLabels = states.map(s => s.state);
  const velocities = states.map(s => s.avg_clearance_velocity_months);
  const dilrmpScores = states.map(s => s.dilrmp_score);
  const highRiskCounts = states.map(s => s.high_risk_projects);

  if (stateVelocityChartInstance) stateVelocityChartInstance.destroy();
  stateVelocityChartInstance = new Chart(ctxState, {
    type: 'bar',
    data: {
      labels: stateLabels,
      datasets: [{
        label: 'Avg Clearance Velocity (Months)',
        data: velocities,
        backgroundColor: velocities.map(v => v > 18 ? 'rgba(244, 63, 94, 0.85)' : (v > 14 ? 'rgba(245, 158, 11, 0.85)' : 'rgba(52, 211, 153, 0.85)')),
        borderColor: 'rgba(174, 195, 176, 0.25)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animations: BOTTOM_TO_TOP_ANIMATION,
      scales: {
        y: {
          min: 0,
          max: 28,
          grid: { color: 'rgba(174, 195, 176, 0.1)' },
          ticks: { color: '#AEC3B0', font: { family: 'Plus Jakarta Sans', size: 11 }, callback: v => `${v} Mo` }
        },
        x: {
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 42, 29, 0.96)',
          titleColor: '#E3EED4',
          bodyColor: '#AEC3B0',
          borderColor: 'rgba(107, 144, 113, 0.45)',
          borderWidth: 1,
          padding: 10
        }
      }
    }
  });

  if (dilrmpCorrelationChartInstance) dilrmpCorrelationChartInstance.destroy();
  dilrmpCorrelationChartInstance = new Chart(ctxDilrmp, {
    type: 'line',
    data: {
      labels: stateLabels,
      datasets: [
        {
          label: 'DILRMP Digitization Score (%)',
          data: dilrmpScores,
          borderColor: '#E3EED4',
          backgroundColor: 'rgba(107, 144, 113, 0.2)',
          borderWidth: 2.5,
          pointBackgroundColor: '#E3EED4',
          pointRadius: 4,
          fill: true,
          tension: 0.35,
          yAxisID: 'y'
        },
        {
          label: 'High Risk Projects Count',
          data: highRiskCounts,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.85)',
          type: 'bar',
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animations: BOTTOM_TO_TOP_ANIMATION,
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          min: 40,
          max: 100,
          grid: { color: 'rgba(174, 195, 176, 0.1)' },
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11 }, callback: v => `${v}%` }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 25,
          grid: { drawOnChartArea: false },
          ticks: { color: '#f43f5e', font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        x: {
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#AEC3B0', font: { family: 'Plus Jakarta Sans', size: 11 } } },
        tooltip: {
          backgroundColor: 'rgba(15, 42, 29, 0.96)',
          titleColor: '#E3EED4',
          bodyColor: '#AEC3B0',
          borderColor: 'rgba(107, 144, 113, 0.45)',
          borderWidth: 1,
          padding: 10
        }
      }
    }
  });
}

/**
 * Render What-If Policy Simulation Comparison Chart (Baseline vs Simulated)
 * Animates strictly from bottom to top
 */
function renderSimComparisonChart(baseline, simulated) {
  const ctx = document.getElementById('simComparisonChart');
  if (!ctx) return;

  if (simComparisonChartInstance) simComparisonChartInstance.destroy();

  simComparisonChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Risk Score (0-100)', 'Delay Days', 'Delay Months x10'],
      datasets: [
        {
          label: 'Current Baseline (Pre-Intervention)',
          data: [baseline.risk_score, baseline.predicted_delay_days, baseline.predicted_delay_months * 10],
          backgroundColor: 'rgba(244, 63, 94, 0.85)',
          borderColor: 'rgba(244, 63, 94, 1)',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'With Policy Intervention Plan',
          data: [simulated.risk_score, simulated.predicted_delay_days, simulated.predicted_delay_months * 10],
          backgroundColor: 'rgba(52, 211, 153, 0.85)',
          borderColor: 'rgba(52, 211, 153, 1)',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animations: BOTTOM_TO_TOP_ANIMATION,
      scales: {
        y: {
          grid: { color: 'rgba(174, 195, 176, 0.1)' },
          ticks: { color: '#AEC3B0', font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        x: {
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#AEC3B0', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } } },
        tooltip: {
          backgroundColor: 'rgba(15, 42, 29, 0.96)',
          titleColor: '#E3EED4',
          bodyColor: '#AEC3B0',
          borderColor: 'rgba(107, 144, 113, 0.45)',
          borderWidth: 1,
          padding: 10
        }
      }
    }
  });
}

/**
 * Render Model Retraining & Accuracy Progression Line Chart
 * Animates strictly from bottom to top
 */
function renderModelDriftChart(history) {
  const ctx = document.getElementById('modelDriftChart');
  if (!ctx) return;

  const labels = history.map(h => h.version);
  const rocAuc = history.map(h => h.roc_auc);
  const accuracy = history.map(h => h.accuracy_pct);

  if (modelDriftChartInstance) modelDriftChartInstance.destroy();

  modelDriftChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'ROC-AUC Score',
          data: rocAuc,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          pointBackgroundColor: '#34d399',
          pointRadius: 5,
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Classification Accuracy (%)',
          data: accuracy,
          borderColor: '#E3EED4',
          backgroundColor: 'rgba(107, 144, 113, 0.15)',
          pointBackgroundColor: '#E3EED4',
          pointRadius: 5,
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animations: BOTTOM_TO_TOP_ANIMATION,
      scales: {
        y: {
          min: 0.85,
          max: 1.0,
          grid: { color: 'rgba(174, 195, 176, 0.1)' },
          ticks: { color: '#34d399', font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y1: {
          position: 'right',
          min: 80,
          max: 100,
          grid: { drawOnChartArea: false },
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11 }, callback: v => `${v}%` }
        },
        x: {
          ticks: { color: '#E3EED4', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#AEC3B0', font: { family: 'Plus Jakarta Sans', size: 11 } } },
        tooltip: {
          backgroundColor: 'rgba(15, 42, 29, 0.96)',
          titleColor: '#E3EED4',
          bodyColor: '#AEC3B0',
          borderColor: 'rgba(107, 144, 113, 0.45)',
          borderWidth: 1,
          padding: 10
        }
      }
    }
  });
}
