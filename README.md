# BHU-DRISHTI (भू-दृष्टि)
### National Land Acquisition Predictive Intelligence & Decision Support System
**Sub-theme:** Artificial Intelligence, Machine Learning & Predictive Analytics for Infrastructure Governance and Public Administration  
**Aligned with:** RFCTLARR Act 2013, PM GatiShakti National Master Plan, BhoomiRashi 2.0 & DILRMP

---

## 📌 Executive Overview
Land acquisition delays account for over **55% of all national infrastructure time and cost overruns in India**, locking over **₹4.5 Lakh Crore ($55 Billion)** in public exchequer capital.

**BHU-DRISHTI** shifts infrastructure monitoring from **reactive reporting to proactive, explainable, and prescriptive decision-making**, providing **Policymakers** (Ministers, Central Secretaries) and **Administrators** (District Collectors/DMs, CALA, State Revenue Officers) with **6 to 12 months of early warning** to resolve friction points before statutory deadlines lapse.

---

## 🏛️ Statutory Domain Alignment (RFCTLARR Act 2013)
The platform models the full multi-stage legal and administrative acquisition pipeline:
1. **Stage 1:** Preliminary Notification & Proposal (Sec 4 / Sec 11)
2. **Stage 2:** Social Impact Assessment (SIA) & Objections Hearing (Sec 15)
3. **Stage 3:** Rehabilitation & Resettlement (R&R) Scheme Declaration (Sec 19)
4. **Stage 4:** Land Valuation, Inquiry & Award Passing (Sec 23/26–30)
5. **Stage 5:** Direct Benefit Transfer (DBT) & Escrow Compensation Disbursement
6. **Stage 6:** Encumbrance-Free Physical Possession Handover (Sec 38)
*Includes automatic surveillance of the mandatory Section 25 12-month statutory lapse rule.*

---

## ⚡ Core Platform Capabilities

1. **AI/ML Predictive Risk Engine:**
   - Multi-stage delay classifier computing **Composite Risk Score (0–100)** and **Delay Probability %**.
   - Regression engine forecasting **Estimated Delay Duration (in Days and Months)**.

2. **Explainable AI (XAI / SHAP-Style Decomposition):**
   - Decomposes exact mathematical percentage contributions of legal disputes, compensation lags, mutation backlogs, and forest clearances.

3. **Prescriptive Action Playbooks ("Next Best Action"):**
   - Tailors statutory interventions (Sec 28 Consent Awards, Revenue Lok Adalats, SLEC Forest Escalations) directly to the District Collector and CALA.

4. **GIS Spatial Intelligence & Corridor Routing (Leaflet.js):**
   - Pan-India interactive map with glowing risk pins (🔴 High, 🟡 Medium, 🟢 Low) and polyline alignment layers for major mega-corridors.

5. **Interactive "What-If" Policy Simulation Studio:**
   - Real-time slider studio allowing officials to model policy interventions and see instant risk score reductions and days saved.

6. **Automated Alert & Official Ministerial Directive Generator:**
   - Generates official Demi-Official (D.O.) letters with government letterheads and dispatches multi-channel SMS/Email alerts.

7. **Continuous Model Learning & Retraining Hub:**
   - Ingests monthly milestone records, updates model parameters, and tracks ROC-AUC and Accuracy metrics.

8. **Role-Based Access Control (RBAC) & Immutable Audit Trail:**
   - Switchable views for Central Ministry, State Secretary, District Collector, and Project Agency.
   - SHA-256 hash-verified immutable audit log.

---

## 🚀 How to Run the Platform

### 1. Prerequisites
- Node.js (v18+)

### 2. Start the Server
```bash
node server.js
```

### 3. Open the Dashboard
Navigate to:
```
http://localhost:3000
```
