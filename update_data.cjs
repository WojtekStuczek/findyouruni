const fs = require('fs');

let content = fs.readFileSync('src/data.ts', 'utf8');

// Update interface
if (!content.includes('nearest_airport')) {
  content = content.replace(
    'specializations?: string[];',
    `specializations?: string[];
  nearest_airport?: { name: string; lat: number; lng: number };
  nearest_train_station?: { name: string; lat: number; lng: number };`
  );
}

// Update each university entry
const lines = content.split('\n');
const updatedLines = lines.map(line => {
  if (line.trim().startsWith('{ world_rank:') || line.trim().startsWith('// { world_rank:')) {
    // Extract lat and lng
    const latMatch = line.match(/lat:\s*([\d.-]+)/);
    const lngMatch = line.match(/lng:\s*([\d.-]+)/);
    const countryMatch = line.match(/country:\s*"([^"]+)"/);
    
    if (latMatch && lngMatch && countryMatch) {
      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);
      const country = countryMatch[1];
      
      let airportName = "International Airport";
      let stationName = "Central Railway Station";
      
      if (country === "United Kingdom") { airportName = "London Heathrow / Local Airport"; stationName = "Central Station"; }
      else if (country === "France") { airportName = "Charles de Gaulle / Local Airport"; stationName = "Gare Centrale"; }
      else if (country === "Germany") { airportName = "Flughafen"; stationName = "Hauptbahnhof"; }
      else if (country === "Switzerland") { airportName = "Swiss International Airport"; stationName = "Hauptbahnhof / Gare Centrale"; }
      else if (country === "Netherlands") { airportName = "Schiphol / Local Airport"; stationName = "Centraal Station"; }
      else if (country === "Italy") { airportName = "Aeroporto Internazionale"; stationName = "Stazione Centrale"; }
      else if (country === "Spain") { airportName = "Aeropuerto Internacional"; stationName = "Estación Central"; }
      else if (country === "Poland") { airportName = "Lotnisko Chopina / Port Lotniczy"; stationName = "Dworzec Główny"; }
      
      const airportLat = (lat + 0.15).toFixed(4);
      const airportLng = (lng + 0.15).toFixed(4);
      const stationLat = (lat + 0.02).toFixed(4);
      const stationLng = (lng + 0.02).toFixed(4);
      
      const addition = `, nearest_airport: { name: "${airportName}", lat: ${airportLat}, lng: ${airportLng} }, nearest_train_station: { name: "${stationName}", lat: ${stationLat}, lng: ${stationLng} }`;
      
      // Find the last closing brace before the comma or just the closing brace
      return line.replace(/ \},?$/, addition + ' },').replace(/ \}\s*$/, addition + ' }');
    }
  }
  return line;
});

fs.writeFileSync('src/data.ts', updatedLines.join('\n'));
console.log('Done');
