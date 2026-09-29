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

  // Dark Basemap
  darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    subdomains: 'abcd'
  }).addTo(mapInstance);

  // Esri World Imagery Satellite Basemap
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

function toggleSatelliteView() {
  const btn = document.getElementById('btnMapSatellite');
  if (satelliteActive) {
    mapInstance.removeLayer(satelliteTileLayer);
    mapInstance.addLayer(darkTileLayer);
    btn.classList.remove('active');
    btn.textContent = 'Satellite View';
    satelliteActive = false;
  } else {
    mapInstance.removeLayer(darkTileLayer);
    mapInstance.addLayer(satelliteTileLayer);
    btn.classList.add('active');
    btn.textContent = 'Dark Map';
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
      <div style="font-family: 'Inter', sans-serif; color: #0f172a; min-width: 220px; padding: 6px;">
        <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">${p.agency}</div>
        <h4 style="font-size: 13px; margin: 4px 0 8px 0; font-weight: 700; color: #0f172a;">${p.name}</h4>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span>Location:</span>
          <b>${p.district}, ${p.state}</b>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 11px;">
          <span>Delay Risk Score:</span>
          <b style="color: ${markerColor};">${p.delay_risk_score}/100 (${p.risk_category})</b>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px;">
          <span>Est. Delay Duration:</span>
          <b>${p.predicted_delay_days} Days</b>
        </div>

        <button onclick="openProjectModal('${p.id}')" style="
          width: 100%; 
          background: #2563eb; 
          color: #fff; 
          border: none; 
          padding: 6px; 
          border-radius: 4px; 
          font-size: 11px; 
          font-weight: 600; 
          cursor: pointer;
        ">
          Deep-Dive XAI Analysis
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    projectMarkersLayer.addLayer(marker);
  });
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

function focusMapOnProject(lat, lng) {
  if (mapInstance && lat && lng) {
    mapInstance.flyTo([lat, lng], 8, { duration: 1.5 });
  }
}
