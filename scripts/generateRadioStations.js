import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to geocode a city
async function geocodeCity(city, country) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${city}, ${country}`,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'GlobeMediaStreamer/1.0 (globe-media-streamer)'
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }
  } catch (error) {
    console.warn(`Geocoding failed for ${city}, ${country}:`, error.message);
  }
  return null;
}

// Generate 1000 diverse radio stations with real coordinates
const countries = [
  { code: 'US', name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'] },
  { code: 'GB', name: 'United Kingdom', cities: ['London', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Liverpool', 'Manchester', 'Bristol', 'Wakefield'] },
  { code: 'DE', name: 'Germany', cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'] },
  { code: 'FR', name: 'France', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'] },
  { code: 'IT', name: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Catania'] },
  { code: 'ES', name: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'] },
  { code: 'CA', name: 'Canada', cities: ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton'] },
  { code: 'AU', name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'] },
  { code: 'JP', name: 'Japan', cities: ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama'] },
  { code: 'BR', name: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'] },
  { code: 'IN', name: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'] },
  { code: 'RU', name: 'Russia', cities: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don'] },
  { code: 'CN', name: 'China', cities: ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Dongguan', 'Chongqing', 'Chengdu', 'Nanjing'] },
  { code: 'KR', name: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gwangju', 'Daejeon', 'Suwon', 'Ulsan', 'Seongnam', 'Jeonju'] },
  { code: 'NL', name: 'Netherlands', cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda', 'Nijmegen'] },
  { code: 'SE', name: 'Sweden', cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping'] },
  { code: 'NO', name: 'Norway', cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Sarpsborg', 'Skien', 'Ålesund', 'Tromsø'] },
  { code: 'FI', name: 'Finland', cities: ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Kouvola'] },
  { code: 'DK', name: 'Denmark', cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde'] },
  { code: 'BE', name: 'Belgium', cities: ['Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst'] },
  { code: 'CH', name: 'Switzerland', cities: ['Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano', 'Biel'] },
  { code: 'AT', name: 'Austria', cities: ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'] },
  { code: 'PL', name: 'Poland', cities: ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'] },
  { code: 'CZ', name: 'Czech Republic', cities: ['Prague', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Pardubice', 'Zlín'] },
  { code: 'HU', name: 'Hungary', cities: ['Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely'] }
];

// Generate stations
const stations = [];
let id = 1;

async function generateStations() {
  for (const country of countries) {
    for (const city of country.cities) {
      // Get real coordinates for the city
      const coords = await geocodeCity(city, country.name);
      
      // Generate 40 stations per city (but we'll limit to 1000 total)
      for (let i = 1; i <= 40; i++) {
        if (stations.length >= 1000) break;
        
        const station = {
          "stationuuid": `station-${id}`,
          "name": `${city} Radio ${i}`,
          "url": `http://stream.radio-${id}.com/stream.mp3`,
          "homepage": `http://www.radio-${id}.com`,
          "favicon": `http://www.radio-${id}.com/favicon.ico`,
          "country": country.name,
          "countrycode": country.code,
          "state": city,
          "language": "English",
          "tags": "pop,rock,music",
          "codec": "MP3",
          "bitrate": Math.floor(Math.random() * 320) + 64,
          "geo_lat": coords ? coords.lat : ((Math.random() * 180) - 90), // Fallback to random if geocoding fails
          "geo_long": coords ? coords.lon : ((Math.random() * 360) - 180), // Fallback to random if geocoding fails
          "votes": Math.floor(Math.random() * 1000),
          "clickcount": Math.floor(Math.random() * 10000),
          "lastcheckok": 1,
          "type": "radio"
        };
        
        stations.push(station);
        id++;
      }
      
      if (stations.length >= 1000) break;
      
      // Add a small delay to be respectful to the geocoding API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (stations.length >= 1000) break;
  }

  // Write to file
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'radioStations.json');
  fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2));

  console.log(`Generated ${stations.length} radio stations and saved to ${outputPath}`);
}

// Run the generation
generateStations().catch(console.error);