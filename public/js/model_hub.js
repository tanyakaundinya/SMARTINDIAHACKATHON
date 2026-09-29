/**
 * Continuous Learning & Model Retraining Hub Controller
 */

function loadModelHubData() {
  const versionEl = document.getElementById('mlVersion');
  if (!versionEl) return;

  fetch('/api/model/status')
    .then(res => res.json())
    .then(data => {
      if (document.getElementById('mlVersion')) document.getElementById('mlVersion').textContent = data.version;
      if (document.getElementById('mlRocAuc')) document.getElementById('mlRocAuc').textContent = data.metrics.roc_auc;
      if (document.getElementById('mlAccuracy')) document.getElementById('mlAccuracy').textContent = `${data.metrics.accuracy_pct}%`;
      if (document.getElementById('mlTotalCases')) document.getElementById('mlTotalCases').textContent = data.total_training_samples.toLocaleString();

      if (document.getElementById('cmTP')) document.getElementById('cmTP').textContent = `${data.confusion_matrix.true_positive} (True Pos)`;
      if (document.getElementById('cmFP')) document.getElementById('cmFP').textContent = `${data.confusion_matrix.false_positive} (False Pos)`;
      if (document.getElementById('cmFN')) document.getElementById('cmFN').textContent = `${data.confusion_matrix.false_negative} (False Neg)`;
      if (document.getElementById('cmTN')) document.getElementById('cmTN').textContent = `${data.confusion_matrix.true_negative.toLocaleString()} (True Neg)`;

      renderModelDriftChart(data.retraining_history || []);
    })
    .catch(err => console.error('Model hub error:', err));
}

function triggerModelRetrain() {
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Ingesting & Retraining...';
  btn.disabled = true;

  fetch('/api/model/retrain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      actor: 'AI System Administrator',
      role: 'Central Ministry'
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(`[RETRAINING COMPLETE] Production Model Updated:\nNew Version: ${data.new_version}\nROC-AUC: ${data.updated_metrics.roc_auc}\nAccuracy: ${data.updated_metrics.accuracy_pct}%\nTotal Training Samples: ${data.total_dataset_size}`);
    loadModelHubData();
    loadAuditLogs();
    btn.innerHTML = originalText;
    btn.disabled = false;
  })
  .catch(err => {
    console.error('Retrain error:', err);
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
}
