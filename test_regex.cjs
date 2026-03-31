const line = '{ world_rank: 2,   europe_rank: 1,   name: "Imperial College London",                        country: "United Kingdom",    flag: "🇬🇧", lat: 51.4988,  lng: -0.1749,  website: "https://www.imperial.ac.uk",          specializations: ["Engineering", "Medicine", "Natural Sciences", "Business"], nearest_train_station: { name: "Central Station", lat: 51.5188, lng: -0.1549 } },';

let newLine = line.replace(/,\s*nearest_airport:\s*\{[^}]+\}/g, '');
newLine = newLine.replace(/,\s*nearest_train_station:\s*\{[^}]+\}/g, '');

const additions = `, nearest_airport: { name: "Test Airport", lat: 1, lng: 2 }, nearest_train_station: { name: "Test Station", lat: 3, lng: 4 }`;

const lastBraceIndex = newLine.lastIndexOf('}');
if (lastBraceIndex !== -1) {
  newLine = newLine.substring(0, lastBraceIndex) + additions + ' ' + newLine.substring(lastBraceIndex);
}

console.log(newLine);
