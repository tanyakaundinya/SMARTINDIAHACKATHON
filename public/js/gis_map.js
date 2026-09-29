/**
 * Advanced GIS Spatial Mapping Engine for BHU-DRISHTI
 * Integrates Dark Basemap, Esri Satellite Imagery, Mega Corridors, Cadastral Parcels & GeoAI Encroachments
 */

let mapInstance = null;
let projectMarkersLayer = null;
let corridorsLayer = null;
let cadastralParcelsLayer = null;
let encroachmentLayer = null;
let darkTileLayer = null;
let lightTileLayer = null;
let satelliteTileLayer = null;

let allProjectsData = [];
let corridorsVisible = true;
let parcelsVisible = false;
let satelliteActive = false;
let encroachmentVisible = false;

function initGisMap() {
  if (mapInstance) return;

  // Center on India
  mapInstance = L.map('leafletMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([22.5937, 78.9629], 5);

  // Free Government-grade Esri Dark Gray Canvas (No API Key Required, No Watermark)
  const darkBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16
  });
  const darkLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16
  });
  darkTileLayer = L.layerGroup([darkBase, darkLabels]);

  // Free Government-grade Esri Light Gray Canvas (No API Key Required)
  const lightBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16
  });
  const lightLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 16
  });
  lightTileLayer = L.layerGroup([lightBase, lightLabels]);

  // Initial Basemap based on active theme
  const initialTheme = localStorage.getItem('bhuDrishtiTheme') || 'dark';
  if (initialTheme === 'light') {
    lightTileLayer.addTo(mapInstance);
  } else {
    darkTileLayer.addTo(mapInstance);
  }

  // Esri World Imagery Satellite Basemap (100% Free, No API Key Required)
  satelliteTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18
  });

  projectMarkersLayer = L.layerGroup().addTo(mapInstance);
  corridorsLayer = L.layerGroup().addTo(mapInstance);
  cadastralParcelsLayer = L.layerGroup().addTo(mapInstance);
  encroachmentLayer = L.layerGroup().addTo(mapInstance);

  loadCorridorsGis();
  loadEncroachmentHotspots();
}

function updateGisMapTheme(theme) {
  if (!mapInstance || satelliteActive) return;
  if (theme === 'light') {
    if (darkTileLayer && mapInstance.hasLayer(darkTileLayer)) mapInstance.removeLayer(darkTileLayer);
    if (lightTileLayer && !mapInstance.hasLayer(lightTileLayer)) mapInstance.addLayer(lightTileLayer);
  } else {
    if (lightTileLayer && mapInstance.hasLayer(lightTileLayer)) mapInstance.removeLayer(lightTileLayer);
    if (darkTileLayer && !mapInstance.hasLayer(darkTileLayer)) mapInstance.addLayer(darkTileLayer);
  }
}

function toggleSatelliteView() {
  const btn = document.getElementById('btnMapSatellite');
  const currentActiveTheme = localStorage.getItem('bhuDrishtiTheme') || 'dark';
  const targetBaseLayer = currentActiveTheme === 'light' ? lightTileLayer : darkTileLayer;

  if (satelliteActive) {
    mapInstance.removeLayer(satelliteTileLayer);
    mapInstance.addLayer(targetBaseLayer);
    btn.classList.remove('active');
    btn.textContent = 'Satellite View';
    satelliteActive = false;
  } else {
    if (mapInstance.hasLayer(darkTileLayer)) mapInstance.removeLayer(darkTileLayer);
    if (mapInstance.hasLayer(lightTileLayer)) mapInstance.removeLayer(lightTileLayer);
    mapInstance.addLayer(satelliteTileLayer);
    btn.classList.add('active');
    btn.textContent = currentActiveTheme === 'light' ? 'Light Map' : 'Dark Map';
    satelliteActive = true;
  }
}

function loadCorridorsGis() {
  fetch('/api/gis/corridors')
    .then(res => res.json())
    .then(geojson => {
      corridorsLayer.clearLayers();
      L.geoJSON(geojson, {
        style: function(feature) {
          return {
            color: feature.properties.color || '#3b82f6',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 6'
          };
        },
        onEachFeature: function(feature, layer) {
          const p = feature.properties;
          layer.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong style="font-size: 13px; color: #1e3a8a;">${p.name}</strong><br>
              <span>Length: <b>${p.length_km} km</b></span><br>
              <span>Status: <b style="color: #b45309;">${p.status}</b></span>
            </div>
          `);
        }
      }).addTo(corridorsLayer);
    })
    .catch(err => console.error('Corridors load error:', err));
}

function toggleCadastralParcels() {
  const btn = document.getElementById('btnMapParcels');
  if (parcelsVisible) {
    cadastralParcelsLayer.clearLayers();
    btn.classList.remove('active');
    parcelsVisible = false;
  } else {
    btn.classList.add('active');
    parcelsVisible = true;

    fetch('/api/gis/parcels')
      .then(res => res.json())
      .then(geojson => {
        cadastralParcelsLayer.clearLayers();
        L.geoJSON(geojson, {
          style: function(feature) {
            return {
              color: feature.properties.color || '#f59e0b',
              weight: 2,
              fillOpacity: 0.45,
              fillColor: feature.properties.color || '#f59e0b'
            };
          },
          onEachFeature: function(feature, layer) {
            const p = feature.properties;
            layer.bindPopup(`
              <div style="color: #0f172a; font-family: 'Inter', sans-serif; font-size: 11px; padding: 4px; min-width: 220px;">
                <div style="font-size: 10px; color: #64748b; font-weight: bold;">CADASTRAL SURVEY PARCEL</div>
                <h4 style="font-size: 13px; color: #0f172a; margin: 2px 0 6px 0;">Khasra: ${p.khasra_no} (Survey: ${p.survey_no})</h4>
                <div><b>Village:</b> ${p.village}, ${p.district}</div>
                <div><b>Landowner:</b> ${p.owner_name}</div>
                <div><b>Area:</b> ${p.area_acres} Acres | <b>Award:</b> ₹${p.compensation_amount_lakhs} Lakhs</div>
                <div style="margin-top: 4px;"><b>Disbursement:</b> ${p.disbursement_status}</div>
                <div><b>Encumbrance Status:</b> <span style="color: ${p.color}; font-weight: bold;">${p.encumbrance_status}</span></div>
              </div>
            `);
          }
        }).addTo(cadastralParcelsLayer);

        // Zoom to cadastral area (Bharuch, Gujarat)
        mapInstance.flyTo([21.6264, 73.0033], 14, { duration: 1.5 });
      })
      .catch(err => console.error('Parcels load error:', err));
  }
}

function loadEncroachmentHotspots() {
  const sampleEncroachments = [
    { lat: 21.6280, lng: 73.0045, title: 'Commercial Encroachment (12 Dhabas / Sheds)', severity: 'High', action: 'Issue Sec 38 Notice' },
    { lat: 25.0480, lng: 83.6180, title: 'Unauthorized Brick Kiln Cluster', severity: 'Critical', action: 'Magisterial Demolition Order' },
    { lat: 18.5240, lng: 73.8590, title: 'Temporary Settlement along RoW Alignment', severity: 'Medium', action: 'R&R Resettlement Transit' }
  ];

  sampleEncroachments.forEach(enc => {
    const encIcon = L.divIcon({
      className: 'encroach-pin',
      html: `
        <div style="
          width: 20px; 
          height: 20px; 
          background: #dc2626; 
          border-radius: 4px; 
          border: 2px solid #fff; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-size: 10px; 
          font-weight: bold;
          color: #fff;
          box-shadow: 0 0 10px #dc2626;
          cursor: pointer;
        ">
          !
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([enc.lat, enc.lng], { icon: encIcon });
    marker.bindPopup(`
      <div style="color: #0f172a; font-family: 'Inter', sans-serif; font-size: 11px; padding: 4px;">
        <span style="background: #dc2626; color: #fff; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 10px;">AI GEO-DETECTION: ENCROACHMENT</span>
        <h4 style="font-size: 12px; margin: 4px 0;">${enc.title}</h4>
        <div><b>Severity:</b> <span style="color: #dc2626; font-weight: bold;">${enc.severity}</span></div>
        <div><b>Prescribed Action:</b> ${enc.action}</div>
      </div>
    `);

    encroachmentLayer.addLayer(marker);
  });
}

function toggleEncroachmentLayer() {
  const btn = document.getElementById('btnMapEncroach');
  if (encroachmentVisible) {
    mapInstance.removeLayer(encroachmentLayer);
    btn.classList.remove('active');
    encroachmentVisible = false;
  } else {
    mapInstance.addLayer(encroachmentLayer);
    btn.classList.add('active');
    encroachmentVisible = true;
  }
}

function plotProjectsOnMap(projects) {
  allProjectsData = projects;
  if (!projectMarkersLayer) return;

  projectMarkersLayer.clearLayers();

  projects.forEach(p => {
    if (!p.lat || !p.lng) return;

    let markerColor = '#10b981';
    if (p.delay_risk_score >= 75) markerColor = '#ef4444';
    else if (p.delay_risk_score >= 40) markerColor = '#f59e0b';

    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 22px; 
          height: 22px; 
          background: ${markerColor}; 
          border-radius: 50%; 
          border: 2px solid #ffffff; 
          box-shadow: 0 0 14px ${markerColor}; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
          font-size: 10px; 
          font-weight: bold;
          cursor: pointer;
        ">
          ${p.delay_risk_score}
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const marker = L.marker([p.lat, p.lng], { icon: customIcon });

    const popupHtml = `
      <div style="font-family: 'Inter', sans-serif; color: #0f172a; min-width: 240px; padding: 6px;">
        <div style="font-size: 10.5px; color: #64748b; text-transform: uppercase; font-weight: 700;">${p.agency}</div>
        <h4 style="font-size: 13px; margin: 4px 0 8px 0; font-weight: 700; color: #0f172a; line-height: 1.35;">${p.name}</h4>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span>Location:</span>
          <b>${p.district}, ${p.state}</b>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span>Delay Risk Score:</span>
          <b style="color: ${markerColor};">${p.delay_risk_score}/100 (${p.risk_category})</b>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11px;">
          <span>Est. Delay Duration:</span>
          <b>${p.predicted_delay_days} Days</b>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          <button onclick="inspectProjectGroundLand('${p.id}')" style="
            width: 100%; 
            background: linear-gradient(135deg, #0284c7, #0369a1); 
            color: #fff; 
            border: none; 
            padding: 7px; 
            border-radius: 4px; 
            font-size: 11px; 
            font-weight: 700; 
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
          ">
            Inspect Land Up-Close & Ground Issues
          </button>
          
          <button onclick="openProjectModal('${p.id}')" style="
            width: 100%; 
            background: rgba(30, 41, 59, 0.9); 
            color: #cbd5e1; 
            border: 1px solid #475569; 
            padding: 5px; 
            border-radius: 4px; 
            font-size: 10.5px; 
            font-weight: 600; 
            cursor: pointer;
          ">
            Full XAI Waterfall Details
          </button>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    projectMarkersLayer.addLayer(marker);
  });
}

/**
 * Zoom into project land from UP CLOSE (Zoom 16.2 on high-res satellite)
 * Generates dynamic cadastral survey parcels and displays the Ground Land Issue HUD inspector
 */
let activeInspectedProject = null;

function inspectProjectGroundLand(projectId) {
  const p = allProjectsData.find(x => x.id === projectId);
  if (!p || !p.lat || !p.lng) return;

  activeInspectedProject = p;

  // 1. Close popup
  if (mapInstance) mapInstance.closePopup();

  // 2. Automatically activate high-resolution satellite basemap for authentic ground view
  if (!satelliteActive) {
    toggleSatelliteView();
  }

  // 3. Fly to land from up close (Zoom 16.2)
  mapInstance.flyTo([p.lat, p.lng], 16.2, { duration: 1.8 });

  // 4. Render geo-referenced Cadastral Khasra survey polygons & ground hazard pins
  renderProjectUpCloseParcels(p);

  // 5. Populate and show the Up-Close Geospatial Ground Land Issue Inspector HUD
  const hud = document.getElementById('upCloseGroundInspector');
  if (hud) {
    document.getElementById('hudProjectName').textContent = p.name;
    document.getElementById('hudProjectMeta').textContent = `${p.district}, ${p.state} • ${p.risk_category} (${p.delay_risk_score}/100) • Est. Delay: ${p.predicted_delay_days} Days`;
    
    // Litigation
    document.getElementById('hudLitigationVal').textContent = `${p.active_court_cases} Cases (${p.stay_orders_active} Stays)`;
    document.getElementById('hudLitigationSub').textContent = p.stay_orders_active > 0 ? `Active Injunction on Survey Plots` : `No active civil stay`;
    
    // Compensation
    document.getElementById('hudCompVal').textContent = `${p.compensation_disbursed_pct}% Disbursed`;
    const pendingCr = ((p.escrow_deposited_cr || 500) * (1 - p.compensation_disbursed_pct / 100)).toFixed(1);
    document.getElementById('hudCompSub').textContent = `₹${pendingCr} Cr Escrow Pending DBT`;

    // Tehsil Mutation
    document.getElementById('hudMutationVal').textContent = `${p.mutation_pendency_pct}% Pendency`;
    document.getElementById('hudMutationSub').textContent = `DILRMP Digitization: ${p.dilrmp_digitization_score}%`;

    // Statutory Countdown
    const daysLeft = Math.max(0, 365 - (p.days_since_sec19 || 300));
    document.getElementById('hudSec25Val').textContent = `${daysLeft} Days Buffer`;
    document.getElementById('hudSec25Sub').textContent = `${p.days_since_sec19 || 300} / 365 Days Post-Sec 19`;

    // Prescriptions
    const presc = (p.prescriptive_recommendations && p.prescriptive_recommendations.length > 0)
      ? `${p.prescriptive_recommendations[0].title}: ${p.prescriptive_recommendations[0].description}`
      : `Convene Special Revenue Lok Adalat to settle title partitions and file Section 41(ha) Injunction Vacate Petition in District Court.`;
    document.getElementById('hudPrescriptionText').textContent = presc;

    hud.style.display = 'block';
  }
}

/**
 * Generate Cadastral Khasra survey parcels & ground issue hotspots around project coordinates
 */
function renderProjectUpCloseParcels(p) {
  if (!cadastralParcelsLayer) return;
  cadastralParcelsLayer.clearLayers();

  const lat = p.lat;
  const lng = p.lng;
  const d = 0.0022; // ~240m grid offsets

  const sampleParcels = [
    {
      khasra: `KH-${Math.floor(120 + (p.delay_risk_score % 40))}/A`,
      survey: `${Math.floor(45 + (p.delay_risk_score % 30))}-A`,
      owner: 'Rameshwar & 3 Co-sharers',
      area: 4.8,
      status: 'Disputed Title (Civil Suit No. 14/2023)',
      color: '#ef4444',
      disbursement: 'Escrow Deposited (Pending Partition)',
      coords: [
        [lat - d, lng - d],
        [lat - d, lng + 0.0005],
        [lat + 0.0008, lng + 0.0005],
        [lat + 0.0008, lng - d],
        [lat - d, lng - d]
      ]
    },
    {
      khasra: `KH-${Math.floor(121 + (p.delay_risk_score % 40))}/B`,
      survey: `${Math.floor(46 + (p.delay_risk_score % 30))}-B`,
      owner: 'Gram Panchayat Common Grazing Land',
      area: 7.2,
      status: 'Gram Sabha R&R Consent Hearing Pending',
      color: '#f59e0b',
      disbursement: 'SIA Consultation In Progress',
      coords: [
        [lat - d, lng + 0.0007],
        [lat - d, lng + d + 0.001],
        [lat + 0.0008, lng + d + 0.001],
        [lat + 0.0008, lng + 0.0007],
        [lat - d, lng + 0.0007]
      ]
    },
    {
      khasra: `KH-${Math.floor(122 + (p.delay_risk_score % 40))}/C`,
      survey: `${Math.floor(47 + (p.delay_risk_score % 30))}-C`,
      owner: 'Verified Private Landholders',
      area: 5.5,
      status: 'Clean Possession (Sec 38 Complete)',
      color: '#10b981',
      disbursement: '100% Paid via DBT Escrow',
      coords: [
        [lat + 0.0010, lng - d],
        [lat + 0.0010, lng + 0.0005],
        [lat + d + 0.001, lng + 0.0005],
        [lat + d + 0.001, lng - d],
        [lat + 0.0010, lng - d]
      ]
    },
    {
      khasra: `KH-${Math.floor(123 + (p.delay_risk_score % 40))}/D`,
      survey: `${Math.floor(48 + (p.delay_risk_score % 30))}-D`,
      owner: 'State Revenue Department & Forest Reserve',
      area: 8.9,
      status: 'Stage-II Forest Clearance Alignment Check',
      color: '#38bdf8',
      disbursement: 'Government Land Transfer',
      coords: [
        [lat + 0.0010, lng + 0.0007],
        [lat + 0.0010, lng + d + 0.001],
        [lat + d + 0.001, lng + d + 0.001],
        [lat + d + 0.001, lng + 0.0007],
        [lat + 0.0010, lng + 0.0007]
      ]
    }
  ];

  sampleParcels.forEach(parcel => {
    const polygon = L.polygon(parcel.coords, {
      color: parcel.color,
      weight: 2.5,
      fillColor: parcel.color,
      fillOpacity: 0.4
    });

    polygon.bindPopup(`
      <div style="font-family: 'Inter', sans-serif; font-size: 11.5px; color: #0f172a; min-width: 220px; padding: 4px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; letter-spacing: 0.5px;">CADASTRAL SURVEY PARCEL</span>
        <h4 style="font-size: 13px; margin: 2px 0 6px 0; color: #0f172a;">Khasra: ${parcel.khasra} (Survey: ${parcel.survey})</h4>
        <div><b>Village / Tehsil:</b> ${p.tehsil || p.district} Rural</div>
        <div><b>Landowner:</b> ${parcel.owner}</div>
        <div><b>Surveyed Area:</b> ${parcel.area} Acres</div>
        <div style="margin-top: 4px;"><b>Disbursement:</b> ${parcel.disbursement}</div>
        <div style="margin-top: 2px;"><b>Encumbrance Status:</b> <span style="color: ${parcel.color}; font-weight: 700;">${parcel.status}</span></div>
      </div>
    `);

    cadastralParcelsLayer.addLayer(polygon);
  });

  // Add specific ground issue hazard pins
  if (p.stay_orders_active > 0) {
    const stayIcon = L.divIcon({
      className: 'stay-pin',
      html: `
        <div style="
          background: #dc2626; 
          color: white; 
          padding: 3px 6px; 
          border-radius: 4px; 
          font-size: 10px; 
          font-weight: 800; 
          border: 2px solid white; 
          box-shadow: 0 0 12px #dc2626; 
          white-space: nowrap; 
          cursor: pointer;
        ">
          [!] Civil Stay Order
        </div>
      `,
      iconSize: [110, 24],
      iconAnchor: [55, 12]
    });
    const stayMarker = L.marker([lat - 0.0003, lng - 0.0006], { icon: stayIcon });
    stayMarker.bindPopup(`
      <div style="font-family: 'Inter', sans-serif; font-size: 11.5px; color: #0f172a; padding: 4px;">
        <b style="color: #dc2626;">CIVIL COURT INJUNCTION</b><br>
        Stay order active on Khasra plot pending partition suit.<br>
        <i>Prescribed Action:</i> File Sec 41(ha) Urgent Vacate Petition.
      </div>
    `);
    cadastralParcelsLayer.addLayer(stayMarker);
  }
}

function closeGroundInspector() {
  const hud = document.getElementById('upCloseGroundInspector');
  if (hud) hud.style.display = 'none';
}

function resetMapToNational() {
  closeGroundInspector();
  if (cadastralParcelsLayer) cadastralParcelsLayer.clearLayers();
  if (mapInstance) {
    mapInstance.flyTo([22.5937, 78.9629], 5, { duration: 1.5 });
  }
}

function goToXaiFromHud() {
  if (activeInspectedProject) {
    switchTab('tab-xai');
    loadXaiForProject(activeInspectedProject.id);
  }
}

function goToSimFromHud() {
  if (activeInspectedProject) {
    switchTab('tab-whatif');
    initWhatIfSimulator(activeInspectedProject.id);
  }
}

function filterMapRisk(filter) {
  document.getElementById('btnMapAll').classList.remove('active');
  document.getElementById('btnMapHigh').classList.remove('active');

  if (filter === 'HIGH') {
    document.getElementById('btnMapHigh').classList.add('active');
    const highProjects = allProjectsData.filter(p => p.delay_risk_score >= 75);
    plotProjectsOnMap(highProjects);
  } else {
    document.getElementById('btnMapAll').classList.add('active');
    plotProjectsOnMap(allProjectsData);
  }
}

function toggleCorridors() {
  const btn = document.getElementById('btnMapCorridors');
  if (corridorsVisible) {
    mapInstance.removeLayer(corridorsLayer);
    btn.classList.remove('active');
    corridorsVisible = false;
  } else {
    mapInstance.addLayer(corridorsLayer);
    btn.classList.add('active');
    corridorsVisible = true;
  }
}

function focusMapOnProject(lat, lng, projectId) {
  if (mapInstance && lat && lng) {
    mapInstance.flyTo([lat, lng], 10, { duration: 1.5 });
    
    // Find and open the project marker popup automatically
    if (projectMarkersLayer) {
      projectMarkersLayer.eachLayer(layer => {
        const markerLatLng = layer.getLatLng();
        if (Math.abs(markerLatLng.lat - lat) < 0.001 && Math.abs(markerLatLng.lng - lng) < 0.001) {
          setTimeout(() => layer.openPopup(), 600);
        }
      });
    }
  }
}
