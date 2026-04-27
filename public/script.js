// API URL (Update this if backend is deployed)
const API_BASE_URL = "http://localhost:8000/api";

// Map variables
let map;
let userMarker;
let resourceMarkers = [];

// Dashboard Stats
let stats = {
  alerts: 0,
  fakeNews: 0,
  incidents: 0
};

// UI Logic: Live Time Updates
setInterval(() => {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('timeNow').innerText = timeString;
}, 1000);

// UI Logic: Sidebar Toggle (Mobile)
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// UI Logic: Switch Sections
function switchSection(sectionId, element) {
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (element) element.classList.add('active');

  // Switch content
  document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active-section'));
  document.getElementById(sectionId).classList.add('active-section');

  // Close sidebar on mobile after clicking
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // Important: Resize map when its container becomes visible
  if (sectionId === 'live-map-section' && map) {
    google.maps.event.trigger(map, 'resize');
    if (userMarker) {
      map.setCenter(userMarker.getPosition());
    }
  }
}

// UI Logic: Update Counters
function updateCounters() {
  animateValue("statAlerts", parseInt(document.getElementById("statAlerts").innerText), stats.alerts, 500);
  animateValue("statFakeNews", parseInt(document.getElementById("statFakeNews").innerText), stats.fakeNews, 500);
  animateValue("statIncidents", parseInt(document.getElementById("statIncidents").innerText), stats.incidents, 500);
}

function animateValue(id, start, end, duration) {
  if (start === end) return;
  let range = end - start;
  let current = start;
  let increment = end > start ? 1 : -1;
  let stepTime = Math.abs(Math.floor(duration / range));
  let obj = document.getElementById(id);
  let timer = setInterval(function() {
    current += increment;
    obj.innerHTML = current;
    if (current == end) {
      clearInterval(timer);
    }
  }, stepTime);
}



// Initialize Map (called by Google Maps script in index.html)
function initMap() {
  const defaultLocation = { lat: 20.5937, lng: 78.9629 };
  
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 5,
    center: defaultLocation,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
      { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
    ]
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        map.setCenter(pos);
        map.setZoom(13);
        userMarker = new google.maps.Marker({
          position: pos, map: map, title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE, scale: 8,
            fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "#ffffff"
          }
        });
      },
      () => console.log("Geolocation failed or denied.")
    );
  }
}

// Generate Mock Resources around a location
function generateMockResources(centerLat, centerLng, disasterType) {
  resourceMarkers.forEach(marker => marker.setMap(null));
  resourceMarkers = [];
  
  const resourceGrid = document.getElementById("resourceGrid");
  resourceGrid.innerHTML = ""; 
  
  const resources = [
    { type: 'SHELTER', name: 'Safe Zone Alpha', latOffset: 0.01, lngOffset: 0.01 },
    { type: 'HOSPITAL', name: 'City Care Hospital', latOffset: -0.015, lngOffset: 0.005 },
    { type: 'RESCUE', name: 'NDRF Unit 4', latOffset: 0.005, lngOffset: -0.01 }
  ];
  
  resources.forEach(res => {
    const resLat = centerLat + res.latOffset;
    const resLng = centerLng + res.lngOffset;
    
    const marker = new google.maps.Marker({
      position: { lat: resLat, lng: resLng },
      map: map, title: res.name,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 6,
        fillColor: res.type === 'HOSPITAL' ? '#FF2D2D' : '#00C864',
        fillOpacity: 1, strokeWeight: 1, strokeColor: "#ffffff"
      }
    });
    resourceMarkers.push(marker);
    
    const card = document.createElement("div");
    card.className = "resource-card";
    card.innerHTML = `
      <div class="resource-type">${res.type}</div>
      <div class="resource-name">${res.name}</div>
      <div class="resource-dist">~ ${(Math.abs(res.latOffset) * 111).toFixed(1)} km away</div>
    `;
    card.onclick = () => { map.setCenter({ lat: resLat, lng: resLng }); map.setZoom(15); };
    resourceGrid.appendChild(card);
  });
}

// Handle Disaster Selection
async function selectDisaster(element, type) {
  // Update Stats
  stats.incidents++;
  stats.alerts++;
  updateCounters();

  // UI Updates
  document.querySelectorAll('.disaster-card').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
  
  if (userMarker) {
    generateMockResources(userMarker.getPosition().lat(), userMarker.getPosition().lng(), type);
  } else if (map) {
    generateMockResources(map.getCenter().lat(), map.getCenter().lng(), type);
  }

  // Pre-load UI states for Safety Hub
  const skeletonEl = document.getElementById("safetySkeleton");
  const contentEl = document.getElementById("safetyContent");
  const placeholderEl = document.getElementById("safetyPlaceholder");
  
  placeholderEl.style.display = "none";
  contentEl.style.display = "none";
  skeletonEl.style.display = "block";

  // Optionally jump to safety hub to see it load (user experience choice, we'll keep them on map, but if they switch, it's loading)
  
  try {
    const response = await fetch(`${API_BASE_URL}/safety-tips`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disaster_type: type })
    });
    
    if (!response.ok) throw new Error(`Server returned status ${response.status}`);

    const data = await response.json();
    
    document.getElementById("safetyEmergency").innerText = data.emergency || "Stay alert and await official instructions.";
    
    const dosList = document.getElementById("safetyDos");
    dosList.innerHTML = "";
    if (data.dos) { data.dos.forEach(d => { const li = document.createElement("li"); li.innerText = d; dosList.appendChild(li); }); }
    
    const dontsList = document.getElementById("safetyDonts");
    dontsList.innerHTML = "";
    if (data.donts) { data.donts.forEach(d => { const li = document.createElement("li"); li.innerText = d; dontsList.appendChild(li); }); }
    
    skeletonEl.style.display = "none";
    contentEl.style.display = "block";
  } catch (error) {
    console.error("Safety Tips Error:", error);
    skeletonEl.style.display = "none";
    placeholderEl.style.display = "block";
    placeholderEl.innerHTML = `<strong>⚠️ Error:</strong> Could not load safety tips due to a server error. Please try again later.`;
    placeholderEl.style.color = "var(--red)";
  }
}

// Handle Fake News Check
async function checkNews() {
  const input = document.getElementById('newsInput').value;
  const resultDiv = document.getElementById('checkerResult');
  const skeletonDiv = document.getElementById('newsSkeleton');
  const btn = document.getElementById('checkNewsBtn');
  
  if (!input.trim()) return;

  stats.alerts++;
  updateCounters();

  btn.disabled = true;
  resultDiv.style.display = "none";
  skeletonDiv.style.display = "block";
  
  try {
    const response = await fetch(`${API_BASE_URL}/check-news`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input })
    });
    
    if (!response.ok) throw new Error(`Server returned status ${response.status}`);

    const data = await response.json();

    skeletonDiv.style.display = "none";
    resultDiv.style.display = "block";
    
    // Dynamic confidence string if provided
    const confidenceText = data.confidence ? ` (${data.confidence}% Confidence)` : "";

    if (data.status === "Fake") {
      stats.fakeNews++;
      updateCounters();
      resultDiv.className = 'checker-result fake';
      resultDiv.innerHTML = `<strong>⚠️ FAKE / UNVERIFIED${confidenceText}</strong><br>${data.explanation}`;
    } else if (data.status === "Safe") {
      resultDiv.className = 'checker-result safe';
      resultDiv.innerHTML = `<strong>✅ SAFE / CREDIBLE${confidenceText}</strong><br>${data.explanation}`;
    } else if (data.status === "Invalid") {
      resultDiv.className = 'checker-result fake'; // using fake class for yellow/red warning styling
      resultDiv.innerHTML = `<strong>⚠️ INSUFFICIENT DATA</strong><br>${data.explanation}`;
    }
  } catch (error) {
    console.error("News Checker Error:", error);
    skeletonDiv.style.display = "none";
    resultDiv.style.display = "block";
    resultDiv.className = 'checker-result fake';
    resultDiv.innerHTML = `<strong>⚠️ Error:</strong> Could not analyze the message due to a server error. Please try again later.`;
  } finally {
    btn.disabled = false;
  }
}
