const https = require('https');

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams({ data: query }).toString();
    const options = {
      hostname: 'lz4.overpass-api.de',
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
  const query = `
    [out:json][timeout:25];
    node["aeroway"="aerodrome"]["iata"](34,-25,72,45);
    out center;
  `;
  try {
    const data = await fetchOverpass(query);
    console.log(`Found ${data.elements.length} airports.`);
  } catch (e) {
    console.error(e);
  }
}

main();
