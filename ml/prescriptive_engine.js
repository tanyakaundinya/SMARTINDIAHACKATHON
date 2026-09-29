/**
 * Prescriptive Action Recommendation Engine for Infrastructure Administrators
 * Generates tailored, statutory-compliant mitigation playbooks
 */

function generateRecommendations(project, xaiExplanation) {
  const recommendations = [];
  const topDrivers = xaiExplanation.top_drivers || [];

  topDrivers.forEach((driver) => {
    switch (driver.feature_key) {
      case 'litigation_disputes':
        recommendations.push({
          id: 'ACT-LIT-01',
          priority: 'High',
          target_role: 'District Collector (CALA)',
          title: 'Convene Special Revenue Lok Adalat for Title & Boundary Disputes',
          action_type: 'Dispute Resolution',
          description: `Schedule a Dedicated Revenue Lok Adalat on Friday for the ${project.active_court_cases || 5} pending title suits in ${project.tehsil || 'the district'} to enable mutually agreed settlements.`,
          expected_risk_reduction_pct: 22,
          statutory_reference: 'Legal Services Authorities Act & Section 64 RFCTLARR Act 2013',
          timeline_days: 14
        });
        if (project.stay_orders_active > 0) {
          recommendations.push({
            id: 'ACT-LIT-02',
            priority: 'Critical',
            target_role: 'State Revenue Secretary / Legal Cell',
            title: 'File Urgent Vacate-Stay Application in High Court',
            action_type: 'Judicial Escalation',
            description: `Instruct Standing Counsel to file an urgent application for vacating ${project.stay_orders_active} interim stay order(s) citing public infrastructure priority under Specific Relief Amendment Act.`,
            expected_risk_reduction_pct: 28,
            statutory_reference: 'Section 41(ha) Specific Relief Act & Section 25 RFCTLARR Act',
            timeline_days: 7
          });
        }
        break;

      case 'compensation_lag':
        recommendations.push({
          id: 'ACT-COMP-01',
          priority: 'High',
          target_role: 'Competent Authority Land Acquisition (CALA)',
          title: 'Activate Direct DBT Tranche Release to Verified Beneficiaries',
          action_type: 'Disbursement Acceleration',
          description: `Expedite Direct Benefit Transfer (DBT) disbursement from the deposited escrow of ₹${project.escrow_deposited_cr || 100} Cr to reach >80% coverage within 21 days.`,
          expected_risk_reduction_pct: 25,
          statutory_reference: 'Section 77 RFCTLARR Act 2013 & BhoomiRashi CALA Portal',
          timeline_days: 21
        });
        recommendations.push({
          id: 'ACT-COMP-02',
          priority: 'Medium',
          target_role: 'District Collector (CALA)',
          title: 'Execute Section 28 Fast-Track Consent Awards',
          action_type: 'Incentive Acceleration',
          description: `Issue notices for consent awards with 100% solatium to eligible willing landowners to bypass protracted inquiry hearings.`,
          expected_risk_reduction_pct: 18,
          statutory_reference: 'Section 28 & Section 30 RFCTLARR Act 2013',
          timeline_days: 15
        });
        break;

      case 'statutory_lapse_urgency':
        recommendations.push({
          id: 'ACT-STAT-01',
          priority: 'Critical',
          target_role: 'District Collector / Principal Secretary',
          title: 'Emergency Award Passing Directive (Section 25 Compliance)',
          action_type: 'Statutory Safeguard',
          description: `Project has reached ${project.days_since_sec19 || 300} days post-Sec 19. Convene daily review to pass final Section 23 Award before statutory 365-day lapse deadline.`,
          expected_risk_reduction_pct: 35,
          statutory_reference: 'Section 25 RFCTLARR Act 2013 (Mandatory 12-Month Period)',
          timeline_days: 10
        });
        break;

      case 'mutation_backlog':
        recommendations.push({
          id: 'ACT-MUT-01',
          priority: 'Medium',
          target_role: 'Sub-Divisional Magistrate (SDM) / Tehsildar',
          title: 'Special Tehsil Mutation Drive with DILRMP Digital Records',
          action_type: 'Record Modernization',
          description: `Deploy a 5-day special camp in ${project.tehsil || 'the tehsil'} to clear ${project.mutation_pendency_pct || 20}% pending inheritance and partition mutations for affected survey numbers.`,
          expected_risk_reduction_pct: 15,
          statutory_reference: 'State Land Revenue Code & DILRMP Modernization Framework',
          timeline_days: 12
        });
        break;

      case 'rr_resistance':
        recommendations.push({
          id: 'ACT-RR-01',
          priority: 'High',
          target_role: 'Administrator R&R / Collectorate',
          title: 'Deploy Multi-Disciplinary Gram Sabha Grievance Facilitation Camp',
          action_type: 'Community Engagement',
          description: `Conduct public hearing camp for ${project.pafs_count || 500} Project Affected Families to finalize R&R land allocation and annuity options.`,
          expected_risk_reduction_pct: 20,
          statutory_reference: 'Sections 16 to 19 & Second Schedule RFCTLARR Act 2013',
          timeline_days: 14
        });
        break;

      case 'forest_clearance':
        recommendations.push({
          id: 'ACT-ENV-01',
          priority: 'High',
          target_role: 'State Revenue Secretary / Forest Dept',
          title: 'Escalate Stage-II Clearance to State Level Empowered Committee (SLEC)',
          action_type: 'Inter-Departmental Escalation',
          description: `Fast-track compensatory afforestation land handover to Forest Department to secure final Stage-II Working Permission.`,
          expected_risk_reduction_pct: 24,
          statutory_reference: 'Forest Conservation Act 1980 & PARIVESH Portal Rules',
          timeline_days: 18
        });
        break;

      case 'survey_capacity':
        recommendations.push({
          id: 'ACT-SURV-01',
          priority: 'Medium',
          target_role: 'Competent Authority Land Acquisition (CALA)',
          title: 'Depute 2 Additional Joint Measurement Survey (JMS) Teams',
          action_type: 'Capacity Augmentation',
          description: `Requisition 2 additional certified Ameen / Patwari teams with DGPS equipment from adjoining subdivisions to double survey throughput.`,
          expected_risk_reduction_pct: 12,
          statutory_reference: 'Section 12 RFCTLARR Act 2013',
          timeline_days: 7
        });
        break;
    }
  });

  // Fallback if low risk
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'ACT-NORM-01',
      priority: 'Low',
      target_role: 'Project Implementing Agency (NHAI/DFCCIL)',
      title: 'Maintain Standard Milestone Cadence & Section 38 Handover',
      action_type: 'Monitoring',
      description: 'Proceed with scheduled encumbrance-free site handover to concessionaire / contractor.',
      expected_risk_reduction_pct: 5,
      statutory_reference: 'Section 38 RFCTLARR Act 2013',
      timeline_days: 30
    });
  }

  return recommendations;
}

module.exports = {
  generateRecommendations
};
