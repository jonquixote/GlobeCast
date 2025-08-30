import fs from 'fs';
import path from 'path';
import axios from 'axios';

const TV_STATIONS_PATH = path.join('src', 'data', 'tvStationsWithUrls.json');
const RADIO_STATIONS_PATH = path.join('src', 'data', 'radioStations.json');
const BACKUP_DIR = 'backups';

// --- Manual Override Data ---

const corrected_tv_locations = {
    "KERODT1.us": { "city": "Bakersfield", "country": "USA" },
    "360RFTV.cr": { "city": "Nosara", "country": "Costa Rica" },
    "APlusGuate.gt": { "city": "Guatemala City", "country": "Guatemala" },
    "ABCAustralia.au@Vietnam": { "city": "Sydney", "country": "Australia" },
    "AbuDhabiAloula.ae@SD": { "city": "Abu Dhabi", "country": "UAE" },
    "AbuDhabiEmirates.ae@SD": { "city": "Abu Dhabi", "country": "UAE" },
    "ACTV.be": { "city": "Wallonia", "country": "Belgium" },
    "ACWUGTV.ug": { "city": "Kampala", "country": "Uganda" },
    "AlAoula.ma@Inter": { "city": "Rabat", "country": "Morocco" },
    "LaayouneTV.ma@SD": { "city": "Laayoune", "country": "Morocco" },
    "AlJadeed.lb@SD": { "city": "Beirut", "country": "Lebanon" },
    "AlMaghribia.ma@SD": { "city": "Rabat", "country": "Morocco" },
    "AlShoub.eg@SD": { "city": "Cairo", "country": "Egypt" },
    "AltantoTV.do": { "city": "Santo Domingo", "country": "Dominican Republic" },
    "AltynAsyr.tm": { "city": "Ashgabat", "country": "Turkmenistan" },
    "AmericaTeVe.pr": { "city": "San Juan", "country": "Puerto Rico" },
    "AmouzeshTV.ir@SD": { "city": "Tehran", "country": "Iran" },
    "Antena3Internacional.es@SD": { "city": "Madrid", "country": "Spain" },
    "Asgabat.tm": { "city": "Ashgabat", "country": "Turkmenistan" },
    "AstroVaanavil.my@SD": { "city": "Kuala Lumpur", "country": "Malaysia" },
    "ATBLaPaz.bo": { "city": "La Paz", "country": "Bolivia" },
    "aurLifeHD.pk": { "city": "Karachi", "country": "Pakistan" },
    "AztecaGuatemala.gt": { "city": "Guatemala City", "country": "Guatemala" },
    "AztecaHonduras.hn": { "city": "Tegucigalpa", "country": "Honduras" },
    "BahrainInternational.bh": { "city": "Manama", "country": "Bahrain" },
    "BBCFourCBeebies.uk@HD": { "city": "London", "country": "UK" },
    "BBCOne.uk@ChannelIslands": { "city": "Saint Helier", "country": "Jersey" },
    "BBCOne.uk@YorkshireHD": { "city": "Leeds", "country": "UK" },
    "BBCOne.uk@EastMidlands": { "city": "Nottingham", "country": "UK" },
    "BBCOne.uk@EastMidlandsHD": { "city": "Nottingham", "country": "UK" },
    "BBCOne.uk@Yorkshire": { "city": "Hull", "country": "UK" },
    "BBCOne.uk@NorthEastCumbria": { "city": "Newcastle upon Tyne", "country": "UK" },
    "BBCOne.uk@NorthEastCumbriaHD": { "city": "Newcastle upon Tyne", "country": "UK" },
    "BBCOne.uk@NorthWest": { "city": "Manchester", "country": "UK" },
    "BBCOne.uk@NorthWestHD": { "city": "Manchester", "country": "UK" },
    "BBCOne.uk@NorthernIreland": { "city": "Belfast", "country": "UK" },
    "BBCOne.uk@NorthernIrelandHD": { "city": "Belfast", "country": "UK" },
    "BBCOne.uk@Scotland": { "city": "Glasgow", "country": "UK" },
    "BBCOne.uk@ScotlandHD": { "city": "Glasgow", "country": "UK" },
    "BBCOne.uk@South": { "city": "Southampton", "country": "UK" },
    "BBCOne.uk@SouthEast": { "city": "Tunbridge Wells", "country": "UK" },
    "BBCOne.uk@SouthWest": { "city": "Plymouth", "country": "UK" },
    "BBCOne.uk@SouthWestHD": { "city": "Plymouth", "country": "UK" },
    "BBCOne.uk@Wales": { "city": "Cardiff", "country": "UK" },
    "BBCOne.uk@West": { "city": "Bristol", "country": "UK" },
    "BBCOne.uk@WestMidlands": { "city": "Birmingham", "country": "UK" },
    "BBCOne.uk@YorkshireLincolnshire": { "city": "Leeds", "country": "UK" },
    "BBCThree.uk@HD": { "city": "London", "country": "UK" },
    "BBCTwo.uk@England": { "city": "London", "country": "UK" },
    "BBCTwo.uk@HD": { "city": "London", "country": "UK" },
    "BBCTwo.uk@NorthernIrelandHD": { "city": "Belfast", "country": "UK" },
    "BBCTwo.uk@Wales": { "city": "Cardiff", "country": "UK" },
    "BCSStarCrossTV.ng@SD": { "city": "Lagos", "country": "Nigeria" },
    "Bolivision.bo": { "city": "La Paz", "country": "Bolivia" },
    "Canal4RD.do": { "city": "Santo Domingo", "country": "Dominican Republic" },
    "Canal13Esquipulas.gt": { "city": "Esquipulas", "country": "Guatemala" },
    "Canal25.do@SD": { "city": "Santo Domingo", "country": "Dominican Republic" },
    "CanalMacau.mo": { "city": "Macau", "country": "China" },
    "CatveFM.br": { "city": "Cascavel", "country": "Brazil" },
    "CBC.eg": { "city": "Cairo", "country": "Egypt" }
};

const corrected_radio_locations = {
    "talkSPORT": { "city": "London", "country": "UK" },
    "talkRADIO": { "city": "London", "country": "UK" },
    "Радио Маяк (Radio Mayak)": { "city": "Moscow", "country": "Russia" },
    "Дорожное радио": { "city": "Moscow", "country": "Russia" },
    "Комсомольская правда": { "city": "Moscow", "country": "Russia" },
    "Radio Record - Russian Mix": { "city": "Saint Petersburg", "country": "Russia" },
    "Радио Русские Песни": { "city": "Moscow", "country": "Russia" },
    "BBC Radio 6 Music": { "city": "London", "country": "UK" },
    "Radio Mars": { "city": "Casablanca", "country": "Morocco" },
    "CNN": { "city": "Atlanta", "country": "USA" },
    "MSNBC": { "city": "New York", "country": "USA" },
    "NPR 24 Hour Program Stream": { "city": "Washington D.C.", "country": "USA" }
};

// --- Helper Functions ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const backupFile = (filePath) => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${timestamp}-${path.basename(filePath)}`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`Backup of ${filePath} created at ${backupPath}`);
};

// --- Geocoding ---

const GEOCODE_CACHE = new Map();

async function geocodeLocation(query) {
  if (GEOCODE_CACHE.has(query)) {
    return GEOCODE_CACHE.get(query);
  }
  try {
    console.log(`Geocoding: "${query}"`);
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: query, format: 'json', limit: 1, 'accept-language': 'en' },
      headers: { 'User-Agent': 'Cool-Station-Fixer/1.0' }
    });
    await sleep(1100);
    if (response.data && response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      const address = response.data[0].address;
      const country = address?.country || '';
      const city = address?.city || address?.town || address?.village || address?.hamlet || '';
      const result = { lat: parseFloat(lat), lon: parseFloat(lon), displayName: display_name, country: country, city: city };
      GEOCODE_CACHE.set(query, result);
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Error geocoding "${query}":`, error.message);
    await sleep(1100);
    return null;
  }
}

// --- Location Logic ---

function isInvalidLocation(station) {
    const lat = parseFloat(station.geo_lat);
    const lon = parseFloat(station.geo_long);
    const inAtlanticBox = lat > 20 && lat < 70 && lon > -100 && lon < -10; // Bounding box for incorrectly placed stations
    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0) || inAtlanticBox) {
        return true;
    }
    if (station.country === 'Unknown') {
        return true;
    }
    return false;
}

function getGeocodeQuery(station, isRadio = false) {
    const override_map = isRadio ? corrected_radio_locations : corrected_tv_locations;
    const key = isRadio ? station.name : station.id;

    if (override_map[key]) {
        const { city, country } = override_map[key];
        return `${city}, ${country}`;
    }

    if (station.city !== 'Unknown' && station.country !== 'Unknown') {
        return `${station.city}, ${station.country}`;
    }

    let query = station.city !== 'Unknown' ? station.city : station.name;
    if (typeof query !== 'string') return null;

    const cityStateMatch = query.match(/\b([A-Za-z\s]+?)\s([A-Z]{2})\b/);
    if (cityStateMatch && cityStateMatch[2] !== 'TV') return `${cityStateMatch[1]}, ${cityStateMatch[2]}, USA`;

    if (query.includes('BBC')) {
        const regionMatch = query.match(/BBC\s(?:One|Two|Four|Scotland|Alba|Three)\s(.+?)(?:\sHD|\s\(|\s$)/);
        if (regionMatch && regionMatch[1]) return `${regionMatch[1]}, UK`;
    }

    const tldMatch = station.id && station.id.match(/\.([a-z]{2})$/);
    if (tldMatch) {
        const countryMap = { de: 'Germany', fr: 'France', it: 'Italy', es: 'Spain', uk: 'United Kingdom', nl: 'Netherlands', za: 'South Africa', af: 'Afghanistan', ge: 'Georgia', ru: 'Russia', th: 'Thailand', ar: 'Argentina', sn: 'Senegal', mx: 'Mexico', hu: 'Hungary', us: 'USA', ci: 'Ivory Coast', tr: 'Turkey', ro: 'Romania', ma: 'Morocco', ps: 'Palestine', kr: 'South Korea', ae: 'United Arab Emirates', ug: 'Uganda', cy: 'Cyprus', et: 'Ethiopia', br: 'Brazil', gh: 'Ghana', iq: 'Iraq', ca: 'Canada', lb: 'Lebanon', qa: 'Qatar', sa: 'Saudi Arabia', sy: 'Syria', az: 'Azerbaijan', ir: 'Iran', am: 'Armenia', gr: 'Greece', id: 'Indonesia', ua: 'Ukraine', cl: 'Chile', ve: 'Venezuela', np: 'Nepal', ec: 'Ecuador', py: 'Paraguay', cm: 'Cameroon', vn: 'Vietnam', dk: 'Denmark', ng: 'Nigeria', mn: 'Mongolia', co: 'Colombia', sv: 'El Salvador', ad: 'Andorra', at: 'Austria', gn: 'Guinea', pe: 'Peru', kz: 'Kazakhstan', au: 'Australia', pk: 'Pakistan', tj: 'Tajikistan', ba: 'Bosnia and Herzegovina', bd: 'Bangladesh', my: 'Malaysia', rw: 'Rwanda', jo: 'Jordan', lc: 'Saint Lucia' };
        if (countryMap[tldMatch[1]]) return countryMap[tldMatch[1]];
    }

    if (station.city && station.city !== 'Unknown') return station.city;
    if (station.country && station.country !== 'Unknown') return station.country;

    return null;
}

// --- Main Processing ---

async function processStations(filePath, isRadio = false) {
  console.log(`\n--- Processing ${filePath} ---`);
  const stations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let fixedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    if (isInvalidLocation(station) || (isRadio ? corrected_radio_locations[station.name] : corrected_tv_locations[station.id])) {
      const query = getGeocodeQuery(station, isRadio);
      if (query) {
        const geodata = await geocodeLocation(query);
        if (geodata) {
          console.log(`  [FIXED] ${station.name}: ${geodata.displayName}`);
          station.geo_lat = geodata.lat;
          station.geo_long = geodata.lon;
          if (geodata.city) station.city = geodata.city;
          if (geodata.country) station.country = geodata.country;
          fixedCount++;
        } else {
          console.log(`  [FAILED] Could not geocode "${query}" for station: ${station.name}`);
          failedCount++;
        }
      } else {
          console.log(`  [SKIPPED] Could not parse location for station: ${station.name}`);
          failedCount++;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(stations, null, 2));
  console.log(`--- Finished processing ${filePath} ---`);
  console.log(`Fixed: ${fixedCount}, Failed/Skipped: ${failedCount}`);
  return { fixedCount, failedCount };
}

// --- Execution ---

(async () => {
  console.log("Starting consolidated station coordinate correction process...");

  backupFile(TV_STATIONS_PATH);
  backupFile(RADIO_STATIONS_PATH);

  const tvResults = await processStations(TV_STATIONS_PATH, false);
  const radioResults = await processStations(RADIO_STATIONS_PATH, true);

  console.log("\n--- Summary ---");
  console.log(`TV Stations: ${tvResults.fixedCount} fixed, ${tvResults.failedCount} failed/skipped.`);
  console.log(`Radio Stations: ${radioResults.fixedCount} fixed, ${radioResults.failedCount} failed/skipped.`);
  console.log("Process complete.");
})();
