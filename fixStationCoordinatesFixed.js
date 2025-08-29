import fs from 'fs/promises';

// Country code to country name mapping
const countryCodeMap = {
  'af': 'Afghanistan',
  'al': 'Albania',
  'dz': 'Algeria',
  'ad': 'Andorra',
  'ao': 'Angola',
  'ag': 'Antigua and Barbuda',
  'ar': 'Argentina',
  'am': 'Armenia',
  'au': 'Australia',
  'at': 'Austria',
  'az': 'Azerbaijan',
  'bs': 'Bahamas',
  'bh': 'Bahrain',
  'bd': 'Bangladesh',
  'bb': 'Barbados',
  'by': 'Belarus',
  'be': 'Belgium',
  'bz': 'Belize',
  'bj': 'Benin',
  'bt': 'Bhutan',
  'bo': 'Bolivia',
  'ba': 'Bosnia and Herzegovina',
  'bw': 'Botswana',
  'br': 'Brazil',
  'bn': 'Brunei',
  'bg': 'Bulgaria',
  'bf': 'Burkina Faso',
  'bi': 'Burundi',
  'cv': 'Cabo Verde',
  'kh': 'Cambodia',
  'cm': 'Cameroon',
  'ca': 'Canada',
  'cf': 'Central African Republic',
  'td': 'Chad',
  'cl': 'Chile',
  'cn': 'China',
  'co': 'Colombia',
  'km': 'Comoros',
  'cg': 'Congo',
  'cd': 'Congo (Democratic Republic)',
  'cr': 'Costa Rica',
  'ci': 'Cote d\'Ivoire',
  'hr': 'Croatia',
  'cu': 'Cuba',
  'cy': 'Cyprus',
  'cz': 'Czech Republic',
  'dk': 'Denmark',
  'dj': 'Djibouti',
  'dm': 'Dominica',
  'do': 'Dominican Republic',
  'ec': 'Ecuador',
  'eg': 'Egypt',
  'sv': 'El Salvador',
  'gq': 'Equatorial Guinea',
  'er': 'Eritrea',
  'ee': 'Estonia',
  'sz': 'Eswatini',
  'et': 'Ethiopia',
  'fj': 'Fiji',
  'fi': 'Finland',
  'fr': 'France',
  'ga': 'Gabon',
  'gm': 'Gambia',
  'ge': 'Georgia',
  'de': 'Germany',
  'gh': 'Ghana',
  'gr': 'Greece',
  'gd': 'Grenada',
  'gt': 'Guatemala',
  'gn': 'Guinea',
  'gw': 'Guinea-Bissau',
  'gy': 'Guyana',
  'ht': 'Haiti',
  'hn': 'Honduras',
  'hu': 'Hungary',
  'is': 'Iceland',
  'in': 'India',
  'id': 'Indonesia',
  'ir': 'Iran',
  'iq': 'Iraq',
  'ie': 'Ireland',
  'il': 'Israel',
  'it': 'Italy',
  'jm': 'Jamaica',
  'jp': 'Japan',
  'jo': 'Jordan',
  'kz': 'Kazakhstan',
  'ke': 'Kenya',
  'ki': 'Kiribati',
  'kp': 'Korea (North)',
  'kr': 'Korea (South)',
  'kw': 'Kuwait',
  'kg': 'Kyrgyzstan',
  'la': 'Laos',
  'lv': 'Latvia',
  'lb': 'Lebanon',
  'ls': 'Lesotho',
  'lr': 'Liberia',
  'ly': 'Libya',
  'li': 'Liechtenstein',
  'lt': 'Lithuania',
  'lu': 'Luxembourg',
  'mg': 'Madagascar',
  'mw': 'Malawi',
  'my': 'Malaysia',
  'mv': 'Maldives',
  'ml': 'Mali',
  'mt': 'Malta',
  'mh': 'Marshall Islands',
  'mr': 'Mauritania',
  'mu': 'Mauritius',
  'mx': 'Mexico',
  'fm': 'Micronesia',
  'md': 'Moldova',
  'mc': 'Monaco',
  'mn': 'Mongolia',
  'me': 'Montenegro',
  'ma': 'Morocco',
  'mz': 'Mozambique',
  'mm': 'Myanmar',
  'na': 'Namibia',
  'nr': 'Nauru',
  'np': 'Nepal',
  'nl': 'Netherlands',
  'nz': 'New Zealand',
  'ni': 'Nicaragua',
  'ne': 'Niger',
  'ng': 'Nigeria',
  'mk': 'North Macedonia',
  'no': 'Norway',
  'om': 'Oman',
  'pk': 'Pakistan',
  'pw': 'Palau',
  'pa': 'Panama',
  'pg': 'Papua New Guinea',
  'py': 'Paraguay',
  'pe': 'Peru',
  'ph': 'Philippines',
  'pl': 'Poland',
  'pt': 'Portugal',
  'qa': 'Qatar',
  'ro': 'Romania',
  'ru': 'Russia',
  'rw': 'Rwanda',
  'kn': 'Saint Kitts and Nevis',
  'lc': 'Saint Lucia',
  'vc': 'Saint Vincent and the Grenadines',
  'ws': 'Samoa',
  'sm': 'San Marino',
  'st': 'Sao Tome and Principe',
  'sa': 'Saudi Arabia',
  'sn': 'Senegal',
  'rs': 'Serbia',
  'sc': 'Seychelles',
  'sl': 'Sierra Leone',
  'sg': 'Singapore',
  'sk': 'Slovakia',
  'si': 'Slovenia',
  'sb': 'Solomon Islands',
  'so': 'Somalia',
  'za': 'South Africa',
  'es': 'Spain',
  'lk': 'Sri Lanka',
  'sd': 'Sudan',
  'sr': 'Suriname',
  'se': 'Sweden',
  'ch': 'Switzerland',
  'sy': 'Syria',
  'tj': 'Tajikistan',
  'tz': 'Tanzania',
  'th': 'Thailand',
  'tl': 'Timor-Leste',
  'tg': 'Togo',
  'to': 'Tonga',
  'tt': 'Trinidad and Tobago',
  'tn': 'Tunisia',
  'tr': 'Turkey',
  'tm': 'Turkmenistan',
  'tv': 'Tuvalu',
  'ug': 'Uganda',
  'ua': 'Ukraine',
  'ae': 'United Arab Emirates',
  'gb': 'United Kingdom',
  'us': 'United States',
  'uy': 'Uruguay',
  'uz': 'Uzbekistan',
  'vu': 'Vanuatu',
  'va': 'Vatican City',
  've': 'Venezuela',
  'vn': 'Vietnam',
  'ye': 'Yemen',
  'zm': 'Zambia',
  'zw': 'Zimbabwe'
};

// Read and process TV stations to fix placeholder coordinates
async function fixPlaceholderStations() {
  try {
    // Read the current TV stations file
    const tvStationsData = await fs.readFile('./src/data/tvStationsWithUrls.json', 'utf8');
    let tvStations = JSON.parse(tvStationsData);

    console.log('Processing ' + tvStations.length + ' TV stations...');
    
    // Counter for stations fixed
    let stationsFixed = 0;
    
    // Process each station
    for (let i = 0; i < tvStations.length; i++) {
      const station = tvStations[i];
      
      // Check if coordinates are placeholder values
      const isPlaceholderCoord = 
        (station.geo_lat === 40 && station.geo_long === -98) ||
        (station.geo_lat === 40 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -100) ||
        (station.geo_lat === 42 && station.geo_long === -98) ||
        (station.geo_lat === 44 && station.geo_long === -98) ||
        (station.geo_lat === 46 && station.geo_long === -98) ||
        (station.geo_lat === 48 && station.geo_long === -98) ||
        (station.geo_lat === 50 && station.geo_long === -98) ||
        (station.geo_lat === 52 && station.geo_long === -98) ||
        (station.geo_lat === 54 && station.geo_long === -98) ||
        (station.geo_lat === 56 && station.geo_long === -98) ||
        (station.geo_lat === 58 && station.geo_long === -98) ||
        (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) ||
        (station.geo_lat === 0 && station.geo_long === 0);
      
      if (isPlaceholderCoord) {
        console.log('\nFixing station: ' + station.name);
        console.log('  Current coords: ' + station.geo_lat + ', ' + station.geo_long);
        console.log('  Current country: ' + station.country);
        console.log('  Station ID: ' + station.id);
        
        // Try to extract country code from ID
        const idParts = station.id.split('.');
        if (idParts.length > 1) {
          const countryCode = idParts[idParts.length - 1].split('@')[0];
          const countryName = countryCodeMap[countryCode.toLowerCase()];
          
          if (countryName) {
            console.log('  Found country from ID: ' + countryName + ' (' + countryCode + ')');
            station.country = countryName;
            
            // For now, we'll set coordinates to the center of the country
            // In a real implementation, you might want to geocode the city as well
            switch (countryCode.toLowerCase()) {
              case 'de': // Germany
                station.geo_lat = 51.1657;
                station.geo_long = 10.4515;
                break;
              case 'es': // Spain
                station.geo_lat = 40.4637;
                station.geo_long = -3.7492;
                break;
              case 'fr': // France
                station.geo_lat = 46.6034;
                station.geo_long = 1.8883;
                break;
              case 'it': // Italy
                station.geo_lat = 41.8719;
                station.geo_long = 12.5674;
                break;
              case 'nl': // Netherlands
                station.geo_lat = 52.1326;
                station.geo_long = 5.2913;
                break;
              case 'ru': // Russia
                station.geo_lat = 61.5240;
                station.geo_long = 105.3188;
                break;
              case 'us': // United States
                station.geo_lat = 37.0902;
                station.geo_long = -95.7129;
                break;
              case 'uk': // United Kingdom
              case 'gb':
                station.geo_lat = 55.3781;
                station.geo_long = -3.4360;
                break;
              default:
                // For other countries, use a generic central coordinate
                station.geo_lat = 0;
                station.geo_long = 0;
            }
            
            stationsFixed++;
            console.log('  New coords: ' + station.geo_lat + ', ' + station.geo_long);
            continue;
          }
        }
        
        // If we can't determine the country from the ID, use a default location
        // but only for stations that are clearly not geolocated properly
        if (station.geo_lat === 12.4989994 && station.geo_long === 124.6746741) {
          // This appears to be a default coordinate, set to 0,0
          station.geo_lat = 0;
          station.geo_long = 0;
          stationsFixed++;
          console.log('  Reset default coordinates to 0,0');
        }
      }
    }
    
    console.log('\nFixed ' + stationsFixed + ' stations with placeholder coordinates.');
    
    // Write the fixed data back to the file
    await fs.writeFile('./src/data/tvStationsWithUrlsFixed.json', JSON.stringify(tvStations, null, 2));
    
    console.log('Fixed TV stations data saved to tvStationsWithUrlsFixed.json');
  } catch (error) {
    console.error('Error fixing TV station coordinates:', error);
  }
}

fixPlaceholderStations();