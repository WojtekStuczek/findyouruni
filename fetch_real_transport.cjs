const fs = require('fs');
const https = require('https');

// Helper to calculate distance between two coordinates in km
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

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({ data: query }).toString();
    const options = {
      hostname: 'overpass-api.de',
      port: 443,
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'UniversityFinderApp/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Overpass API error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Reading universities...');
  
  // We need to parse src/data.ts. Since it's a TS file with an exported array, we can use regex to extract the data, or just evaluate it.
  // But it's safer to extract using regex.
  let content = fs.readFileSync('src/data.ts', 'utf8');
  
  // Extract the universities array part
  const match = content.match(/export const universities: University\[\] = \[([\s\S]*?)\];/);
  if (!match) {
    console.error('Could not find universities array in src/data.ts');
    return;
  }
  
  const arrayContent = match[1];
  
  // We will parse each object.
  const uniRegex = /\{[^}]*world_rank:[^}]*\}/g;
  const unis = [];
  let m;
  while ((m = uniRegex.exec(arrayContent)) !== null) {
    const uniStr = m[0];
    const nameMatch = uniStr.match(/name:\s*"([^"]+)"/);
    const latMatch = uniStr.match(/lat:\s*([\d.-]+)/);
    const lngMatch = uniStr.match(/lng:\s*([\d.-]+)/);
    const worldRankMatch = uniStr.match(/world_rank:\s*([^,]+)/);
    const europeRankMatch = uniStr.match(/europe_rank:\s*([^,]+)/);
    
    if (nameMatch && latMatch && lngMatch && worldRankMatch && europeRankMatch) {
      unis.push({
        str: uniStr,
        name: nameMatch[1],
        lat: parseFloat(latMatch[1]),
        lng: parseFloat(lngMatch[1]),
        world_rank: worldRankMatch[1].trim(),
        europe_rank: europeRankMatch[1].trim()
      });
    }
  }
  
  console.log(`Found ${unis.length} universities.`);

  // Fetch all airports with IATA code in Europe (approx bounding box)
  console.log('Fetching airports...');
  const airportsQuery = `
    [out:json][timeout:250];
    (
      node["aeroway"="aerodrome"]["iata"](34,-25,72,45);
      way["aeroway"="aerodrome"]["iata"](34,-25,72,45);
      relation["aeroway"="aerodrome"]["iata"](34,-25,72,45);
    );
    out center;
  `;
  
  let airportsData;
  try {
    airportsData = await fetchOverpass(airportsQuery);
    console.log(`Found ${airportsData.elements.length} airports.`);
  } catch (e) {
    console.error('Failed to fetch airports:', e);
    return;
  }
  
  const airports = airportsData.elements.map(el => {
    const lat = el.lat || el.center?.lat;
    const lon = el.lon || el.center?.lon;
    const name = el.tags.name || el.tags.iata + ' Airport';
    return { name, lat, lng: lon };
  }).filter(a => a.lat && a.lng);

  // For train stations, we will batch them. 50 universities per batch.
  console.log('Fetching train stations in batches...');
  const batchSize = 50;
  const stations = [];
  
  for (let i = 0; i < unis.length; i += batchSize) {
    const batch = unis.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(unis.length / batchSize)}...`);
    
    let queryParts = batch.map(u => `
      node["railway"="station"](around:20000, ${u.lat}, ${u.lng});
      way["railway"="station"](around:20000, ${u.lat}, ${u.lng});
      relation["railway"="station"](around:20000, ${u.lat}, ${u.lng});
    `).join('');
    
    const stationsQuery = `
      [out:json][timeout:250];
      (
        ${queryParts}
      );
      out center;
    `;
    
    try {
      const stationsData = await fetchOverpass(stationsQuery);
      stationsData.elements.forEach(el => {
        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;
        const name = el.tags.name || 'Train Station';
        if (lat && lon && el.tags.name) {
          stations.push({ name, lat, lng: lon });
        }
      });
    } catch (e) {
      console.error(`Failed to fetch stations for batch ${i / batchSize + 1}:`, e);
    }
    
    // Sleep a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`Found ${stations.length} train stations (with duplicates).`);

  // Now update each university
  let updatedContent = content;
  
  unis.forEach(uni => {
    // Find nearest airport
    let nearestAirport = null;
    let minAirportDist = Infinity;
    airports.forEach(a => {
      const dist = getDistanceFromLatLonInKm(uni.lat, uni.lng, a.lat, a.lng);
      if (dist < minAirportDist) {
        minAirportDist = dist;
        nearestAirport = a;
      }
    });
    
    // Find nearest train station
    let nearestStation = null;
    let minStationDist = Infinity;
    stations.forEach(s => {
      const dist = getDistanceFromLatLonInKm(uni.lat, uni.lng, s.lat, s.lng);
      if (dist < minStationDist) {
        minStationDist = dist;
        nearestStation = s;
      }
    });
    
    // Replace the old nearest_airport and nearest_train_station in the string
    let newUniStr = uni.str;
    
    // Remove existing nearest_airport and nearest_train_station
    newUniStr = newUniStr.replace(/,\s*nearest_airport:\s*\{[^}]+\}/g, '');
    newUniStr = newUniStr.replace(/,\s*nearest_train_station:\s*\{[^}]+\}/g, '');
    
    let additions = '';
    if (nearestAirport) {
      additions += `, nearest_airport: { name: ${JSON.stringify(nearestAirport.name)}, lat: ${nearestAirport.lat}, lng: ${nearestAirport.lng} }`;
    }
    if (nearestStation) {
      additions += `, nearest_train_station: { name: ${JSON.stringify(nearestStation.name)}, lat: ${nearestStation.lat}, lng: ${nearestStation.lng} }`;
    }
    
    // Insert additions before the last brace
    newUniStr = newUniStr.replace(/\s*\}$/, additions + ' }');
    
    updatedContent = updatedContent.replace(uni.str, newUniStr);
  });
  
  fs.writeFileSync('src/data.ts', updatedContent);
  console.log('Successfully updated src/data.ts with real transport data!');
}

main();
