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
  if (!coordsStr || !coordsStr.startsWith('Point(')) return null;
  const parts = coordsStr.replace('Point(', '').replace(')', '').split(' ');
  if (parts.length !== 2) return null;
  return {
    lng: parseFloat(parts[0]),
    lat: parseFloat(parts[1])
  };
}

async function main() {
  console.log('Fetching airports...');
  const airportsQuery = `
    SELECT ?airport ?airportLabel ?coords WHERE {
      ?airport wdt:P31/wdt:P279* wd:Q644371. # International airport
      ?airport wdt:P17 ?country.
      ?country wdt:P30 wd:Q46.
      ?airport wdt:P625 ?coords.
      ?airport wdt:P238 ?iata. # Must have IATA code
      MINUS { ?airport wdt:P582 ?endTime. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  const airportsRaw = await fetchWikidata(airportsQuery);
  const airports = airportsRaw.map(a => {
    const c = parseCoords(a.coords);
    if (!c) return null;
    return { name: a.airportLabel, lat: c.lat, lng: c.lng };
  }).filter(Boolean);
  console.log(`Parsed ${airports.length} international airports.`);

  console.log('Fetching train stations...');
  const stationsQuery = `
    SELECT ?station ?stationLabel ?coords WHERE {
      ?station wdt:P31/wdt:P279* wd:Q55488.
      ?station wdt:P17 ?country.
      ?country wdt:P30 wd:Q46.
      ?station wdt:P625 ?coords.
      MINUS { ?station wdt:P582 ?endTime. }
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

  console.log('Reading universities...');
  let content = fs.readFileSync('src/data.ts', 'utf8');
  const lines = content.split('\n');
  
  const updatedLines = lines.map(line => {
    if (line.trim().startsWith('{ world_rank:') || line.trim().startsWith('// { world_rank:')) {
      const latMatch = line.match(/lat:\s*([\d.-]+)/);
      const lngMatch = line.match(/lng:\s*([\d.-]+)/);
      
      if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        
        let nearestAirport = null;
        let minAirportDist = Infinity;
        airports.forEach(a => {
          const dist = getDistanceFromLatLonInKm(lat, lng, a.lat, a.lng);
          if (dist < minAirportDist) {
            minAirportDist = dist;
            nearestAirport = a;
          }
        });
        
        let nearestStation = null;
        let minStationDist = Infinity;
        stations.forEach(s => {
          const dist = getDistanceFromLatLonInKm(lat, lng, s.lat, s.lng);
          if (dist < minStationDist) {
            minStationDist = dist;
            nearestStation = s;
          }
        });
        
        // Remove existing nearest_airport and nearest_train_station
        let newLine = line.replace(/,\s*nearest_airport:\s*\{[^}]+\}/g, '');
        newLine = newLine.replace(/,\s*nearest_train_station:\s*\{[^}]+\}/g, '');
        
        // Also handle cases where there are multiple nested braces (e.g., if there were multiple properties)
        // A safer way is to just find the last `}` before the end of the line and insert there.
        // But wait, the previous script might have left some garbage. Let's clean it up.
        newLine = newLine.replace(/,\s*nearest_airport:\s*\{[^}]+\}/g, '');
        newLine = newLine.replace(/,\s*nearest_train_station:\s*\{[^}]+\}/g, '');
        
        let additions = '';
        if (nearestAirport) {
          additions += `, nearest_airport: { name: ${JSON.stringify(nearestAirport.name)}, lat: ${nearestAirport.lat.toFixed(4)}, lng: ${nearestAirport.lng.toFixed(4)}, distance_km: ${minAirportDist.toFixed(1)} }`;
        }
        if (nearestStation) {
          additions += `, nearest_train_station: { name: ${JSON.stringify(nearestStation.name)}, lat: ${nearestStation.lat.toFixed(4)}, lng: ${nearestStation.lng.toFixed(4)}, distance_km: ${minStationDist.toFixed(1)} }`;
        }
        
        // Find the last `}` and replace it with `additions + ' }'`
        const lastBraceIndex = newLine.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          newLine = newLine.substring(0, lastBraceIndex) + additions + ' ' + newLine.substring(lastBraceIndex);
        }
        
        return newLine;
      }
    }
    return line;
  });
  
  fs.writeFileSync('src/data.ts', updatedLines.join('\n'));
  console.log('Successfully updated src/data.ts with real transport data!');
}

main().catch(console.error);
