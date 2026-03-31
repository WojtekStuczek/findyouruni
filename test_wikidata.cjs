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
  
  // Simple CSV parser
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Handle quotes in CSV
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
        obj[h.replace(/"/g, '')] = row[idx].replace(/^"|"$/g, '');
      });
      results.push(obj);
    }
  }
  return results;
}

async function main() {
  const query = `
    SELECT ?station ?stationLabel ?coords WHERE {
      ?station wdt:P31/wdt:P279* wd:Q55488.
      ?station wdt:P17 ?country.
      ?country wdt:P30 wd:Q46.
      ?station wdt:P625 ?coords.
      ?article schema:about ?station ; schema:isPartOf <https://en.wikipedia.org/>.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;
  try {
    console.log('Fetching train stations...');
    const data = await fetchWikidata(query);
    console.log(`Found ${data.length} stations.`);
  } catch (e) {
    console.error(e);
  }
}

main();
