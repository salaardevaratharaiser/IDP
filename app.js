const centersUrl = './data/centers.json';
let centers = [];
let map;
let markers = [];

async function loadCenters(){
  try {
    const res = await fetch(centersUrl);
    centers = await res.json();
  } catch(e) {
    centers = [];
  }
}

function initMap(){
  map = L.map('map').setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(map);
  addMarkers(centers);
}

function addMarkers(list){
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  if(!list || list.length === 0) return;
  const group = [];
  list.forEach(c => {
    const m = L.marker([c.lat, c.lng]).addTo(map).bindPopup(`<b>${c.name}</b><br>${c.address} (${c.city})`);
    markers.push(m);
    group.push([c.lat, c.lng]);
  });
  map.fitBounds(group, {padding:[50,50]});
}

function filterByQuery(query){
  const q = query.trim().toLowerCase();
  return centers.filter(c => (
    c.city.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    (c.pin ? String(c.pin).includes(q) : false)
  ));
}

async function useMyLocation(){
  if(!navigator.geolocation) return alert('Geolocation not supported');
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    map.setView([latitude, longitude], 12);
    L.circleMarker([latitude, longitude], { radius:6, color:'#f1c40f' }).addTo(map).bindPopup('You are here');
  }, () => alert('Unable to get your location'));
}

function renderResults(list){
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';
  if(!list || list.length === 0){
    resultsDiv.innerHTML = '<p>No centers found in your area.</p>';
    addMarkers([]);
    return;
  }
  list.forEach(c => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `<strong>${c.name}</strong><br>${c.address} (${c.city})`;
    resultsDiv.appendChild(div);
  });
  addMarkers(list);
}

function setupAuth(){
  // No modal on index page. Auth handled on dedicated pages.
}

function ensureLoggedIn(){
  if(sessionStorage.getItem('loggedIn') !== 'true'){
    alert('Please login first.');
    window.location.href = './pages/login.html';
    return false;
  }
  return true;
}

function setupForms(){
  document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    if(!ensureLoggedIn()) return;
    const input = document.getElementById('locationInput').value;
    renderResults(filterByQuery(input));
  });

  document.getElementById('btnUseMyLocation').addEventListener('click', () => {
    if(!ensureLoggedIn()) return;
    useMyLocation();
  });

  document.getElementById('recycleForm').addEventListener('submit', e => {
    e.preventDefault();
    if(!ensureLoggedIn()) return;
    const email = sessionStorage.getItem('currentUserEmail');
    const itemType = document.getElementById('itemType').value;
    const itemCount = parseInt(document.getElementById('itemCount').value, 10);
    const pickupAddress = document.getElementById('pickupAddress').value;
    const pickupDate = document.getElementById('pickupDate').value;

    const folderKey = `folder:${email}`;
    const now = new Date().toISOString();
    const record = { id: now, type: itemType, count: itemCount, address: pickupAddress, date: pickupDate };
    const folder = JSON.parse(localStorage.getItem(folderKey) || '[]');
    folder.push(record);
    localStorage.setItem(folderKey, JSON.stringify(folder));
    alert('Pickup request saved in your folder.');
    e.target.reset();
  });

  document.getElementById('exportMyFolder').addEventListener('click', () => {
    if(!ensureLoggedIn()) return;
    const email = sessionStorage.getItem('currentUserEmail');
    const folderKey = `folder:${email}`;
    const folder = localStorage.getItem(folderKey) || '[]';
    const blob = new Blob([folder], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ewaste-folder-${email.replace(/[^a-z0-9]/gi,'_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('messageForm').addEventListener('submit', e => {
    e.preventDefault();
    if(!ensureLoggedIn()) return;
    alert('Message sent! Our team will respond shortly.');
    e.target.reset();
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupAuth();
  await loadCenters();
  initMap();
  setupForms();
});


