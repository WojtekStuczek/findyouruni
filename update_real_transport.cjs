const fs = require('fs');

async function fetchWikidata(query) {
  const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'UniversityFinderApp/1.0 (Wojtekstuczek@gmail.com)',
      'Accept': 'text/csv'
    }
  });
  if (!response.ok) {
    throw new Error(`Wikidata API error: ${response.status} ${await response.text()}`);
  }
  const text = await response.text();
  
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const row = [];
    let inQuotes = false;
    let currentVal = '';
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal);
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal);
    
    if (row.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx].replace(/^"|"$/g, '').trim();
      });
      results.push(obj);
    }
  }
  return results;
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function parseCoords(coordsStr) {
  // Point(lon lat)
  if (!coordsStr || !coordsStr.startsWith('Point(')) return null;
  const parts = coordsStr.replace('Point(', '').replace(')', '').split(' ');
  if (parts.length !== 2) return null;
  return {
    lng: parseFloat(parts[0]),
    lat: parseFloat(parts[1])
  };
}

async function main() {
  console.log('Reading universities...');
  let content = fs.readFileSync('src/data.ts', 'utf8');
  
  const match = content.match(/export const universities: University\[\] = \[([\s\S]*?)\];/);
  if (!match) {
    console.error('Could not find universities array in src/data.ts');
    return;
  }
  
  const arrayContent = match[1];
  const uniRegex = /\{[^}]*world_rank:[^}]*\}/g;
  const unis = [];
  let m;
  while ((m = uniRegex.exec(arrayContent)) !== null) {
    const uniStr = m[0];
    const nameMatch = uniStr.match(/name:\s*"([^"]+)"/);
    const latMatch = uniStr.match(/lat:\s*([\d.-]+)/);
    const lngMatch = uniStr.match(/lng:\s*([\d.-]+)/);
    
    if (nameMatch && latMatch && lngMatch) {
      unis.push({
        str: uniStr,
        name: nameMatch[1],
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1])
      });
    }
  }
  
  console.log(`Found ${unis.length} universities.`);

  console.log('Fetching airports...');
  const airportsQuery = `
    SELECT ?airport ?airportLabel ?coords WHERE {
      ?airport wdt:P31/wdt:P279* wd:Q1248784.
      ?airport wdt:P17 ?country.
      ?country wdt:P30 wd:Q46.
      ?airport wdt:P625 ?coords.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const airportsRaw = await fetchWikidata(airportsQuery);
  const airports = airportsRaw.map(a => {
    const c = parseCoords(a.coords);
    if (!c) return null;
    return { name: a.airportLabel, lat: c.lat, lng: c.lng };
  }).filter(Boolean);
  console.log(`Parsed ${airports.length} airports.`);

  console.log('Fetching train stations...');
  const stationsQuery = `
    SELECT ?station ?stationLabel ?coords WHERE {
      ?station wdt:P31/wdt:P279* wd:Q55488.
      ?station wdt:P17 ?country.
      ?country wdt:P30 wd:Q46.
      ?station wdt:P625 ?coords.
      ?article schema:about ?station ; schema:isPartOf <https://en.wikipedia.org/>.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const stationsRaw = await fetchWikidata(stationsQuery);
  const stations = stationsRaw.map(s => {
    const c = parseCoords(s.coords);
    if (!c) return null;
    return { name: s.stationLabel, lat: c.lat, lng: c.lng };
  }).filter(Boolean);
  console.log(`Parsed ${stations.length} train stations.`);

  console.log('Calculating nearest transport for each university...');
  let updatedContent = content;
  
  unis.forEach(uni => {
    let nearestAirport = null;
    let minAirportDist = Infinity;
    airports.forEach(a => {
      const dist = getDistanceFromLatLonInKm(uni.lat, uni.lng, a.lat, a.lng);
      if (dist < minAirportDist) {
        minAirportDist = dist;
        nearestAirport = a;
      }
    });
    
    let nearestStation = null;
    let minStationDist = Infinity;
    stations.forEach(s => {
      const dist = getDistanceFromLatLonInKm(uni.lat, uni.lng, s.lat, s.lng);
      if (dist < minStationDist) {
        minStationDist = dist;
        nearestStation = s;
      }
    });
    
    let newUniStr = uni.str;
    newUniStr = newUniStr.replace(/,\s*nearest_airport:\s*\{[^}]+\}/g, '');
    newUniStr = newUniStr.replace(/,\s*nearest_train_station:\s*\{[^}]+\}/g, '');
    
    let additions = '';
    if (nearestAirport) {
      additions += `, nearest_airport: { name: ${JSON.stringify(nearestAirport.name)}, lat: ${nearestAirport.lat.toFixed(4)}, lng: ${nearestAirport.lng.toFixed(4)} }`;
    }
    if (nearestStation) {
      additions += `, nearest_train_station: { name: ${JSON.stringify(nearestStation.name)}, lat: ${nearestStation.lat.toFixed(4)}, lng: ${nearestStation.lng.toFixed(4)} }`;
    }
    
    newUniStr = newUniStr.replace(/\s*\}$/, additions + ' }');
    updatedContent = updatedContent.replace(uni.str, newUniStr);
  });
  
  fs.writeFileSync('src/data.ts', updatedContent);
  console.log('Successfully updated src/data.ts with real transport data!');
}

main().catch(console.error);
