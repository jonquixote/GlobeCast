import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Existing stations from the current file
const existingStations = [
  {"id": "BBCOne.uk", "name": "BBC One", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "general"},
  {"id": "CBSTV.us", "name": "CBS", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "general"},
  {"id": "ARD.de", "name": "ARD", "city": "Berlin", "country": "DE", "latitude": 52.5200, "longitude": 13.4050, "categories": "general"},
  {"id": "TF1.fr", "name": "TF1", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "general"},
  {"id": "RaiUno.it", "name": "Rai Uno", "city": "Rome", "country": "IT", "latitude": 41.9028, "longitude": 12.4964, "categories": "general"},
  {"id": "NHK.jp", "name": "NHK", "city": "Tokyo", "country": "JP", "latitude": 35.6762, "longitude": 139.6503, "categories": "general"},
  {"id": "CTV.ca", "name": "CTV", "city": "Toronto", "country": "CA", "latitude": 43.6532, "longitude": -79.3832, "categories": "general"},
  {"id": "SevenNetwork.au", "name": "Seven Network", "city": "Sydney", "country": "AU", "latitude": -33.8688, "longitude": 151.2093, "categories": "general"},
  {"id": "TVGlobo.br", "name": "TV Globo", "city": "Rio de Janeiro", "country": "BR", "latitude": -22.9068, "longitude": -43.1729, "categories": "general"},
  {"id": "RTVE.es", "name": "RTVE", "city": "Madrid", "country": "ES", "latitude": 40.4168, "longitude": -3.7038, "categories": "general"},
  {"id": "SVT.se", "name": "SVT", "city": "Stockholm", "country": "SE", "latitude": 59.3293, "longitude": 18.0686, "categories": "general"},
  {"id": "NRK.no", "name": "NRK", "city": "Oslo", "country": "NO", "latitude": 59.9139, "longitude": 10.7522, "categories": "general"},
  {"id": "YLE.fi", "name": "YLE", "city": "Helsinki", "country": "FI", "latitude": 60.1699, "longitude": 24.9384, "categories": "general"},
  {"id": "DR.dk", "name": "DR", "city": "Copenhagen", "country": "DK", "latitude": 55.6761, "longitude": 12.5683, "categories": "general"},
  {"id": "VPRO.nl", "name": "VPRO", "city": "Hilversum", "country": "NL", "latitude": 52.2397, "longitude": 5.1710, "categories": "general"},
  {"id": "RTBF.be", "name": "RTBF", "city": "Brussels", "country": "BE", "latitude": 50.8503, "longitude": 4.3517, "categories": "general"},
  {"id": "RTS.ch", "name": "RTS", "city": "Geneva", "country": "CH", "latitude": 46.2044, "longitude": 6.1432, "categories": "general"},
  {"id": "ORF.at", "name": "ORF", "city": "Vienna", "country": "AT", "latitude": 48.2082, "longitude": 16.3738, "categories": "general"},
  {"id": "RTV.si", "name": "RTV", "city": "Ljubljana", "country": "SI", "latitude": 46.0569, "longitude": 14.5058, "categories": "general"},
  {"id": "Ceskatelevize.cz", "name": "Česká televize", "city": "Prague", "country": "CZ", "latitude": 50.0755, "longitude": 14.4378, "categories": "general"},
  {"id": "AlJazeera.qa", "name": "Al Jazeera", "city": "Doha", "country": "QA", "latitude": 25.2854, "longitude": 51.5310, "categories": "news"},
  {"id": "CNN.us", "name": "CNN", "city": "Atlanta", "country": "US", "latitude": 33.7490, "longitude": -84.3880, "categories": "news"},
  {"id": "DW.de", "name": "DW", "city": "Berlin", "country": "DE", "latitude": 52.5200, "longitude": 13.4050, "categories": "news"},
  {"id": "France24.fr", "name": "France 24", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "news"},
  {"id": "Euronews.fr", "name": "Euronews", "city": "Lyon", "country": "FR", "latitude": 45.7640, "longitude": 4.8357, "categories": "news"}
];

// Additional stations to add
const additionalStations = [
  // US Stations
  {"id": "NBC.us", "name": "NBC", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "general"},
  {"id": "ABC.us", "name": "ABC", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "general"},
  {"id": "Fox.us", "name": "Fox", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "general"},
  {"id": "TheCW.us", "name": "The CW", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "general"},
  {"id": "PBS.us", "name": "PBS", "city": "Arlington", "country": "US", "latitude": 38.8810, "longitude": -77.1043, "categories": "educational"},
  {"id": "HBO.us", "name": "HBO", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "entertainment"},
  {"id": "Showtime.us", "name": "Showtime", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "entertainment"},
  {"id": "FX.us", "name": "FX", "city": "Los Angeles", "country": "US", "latitude": 34.0522, "longitude": -118.2437, "categories": "entertainment"},
  {"id": "AMC.us", "name": "AMC", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "entertainment"},
  {"id": "ESPN.us", "name": "ESPN", "city": "Bristol", "country": "US", "latitude": 41.7107, "longitude": -72.7695, "categories": "sports"},
  {"id": "FoxSports.us", "name": "Fox Sports", "city": "Los Angeles", "country": "US", "latitude": 34.0522, "longitude": -118.2437, "categories": "sports"},
  {"id": "NBCSports.us", "name": "NBC Sports", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "sports"},
  
  // UK Stations
  {"id": "BBCNews.uk", "name": "BBC News", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "news"},
  {"id": "BBCWorldNews.uk", "name": "BBC World News", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "news"},
  {"id": "SkyNews.uk", "name": "Sky News", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "news"},
  {"id": "ITV.uk", "name": "ITV", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "general"},
  {"id": "Channel4.uk", "name": "Channel 4", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "general"},
  {"id": "Channel5.uk", "name": "Channel 5", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "general"},
  {"id": "SkyAtlantic.uk", "name": "Sky Atlantic", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "entertainment"},
  {"id": "SkySports.uk", "name": "Sky Sports", "city": "London", "country": "UK", "latitude": 51.5074, "longitude": -0.1278, "categories": "sports"},
  
  // Germany
  {"id": "ZDF.de", "name": "ZDF", "city": "Mainz", "country": "DE", "latitude": 50.0000, "longitude": 8.2711, "categories": "general"},
  {"id": "RTL.de", "name": "RTL", "city": "Cologne", "country": "DE", "latitude": 50.9375, "longitude": 6.9603, "categories": "general"},
  {"id": "Sat1.de", "name": "Sat.1", "city": "Munich", "country": "DE", "latitude": 48.1351, "longitude": 11.5820, "categories": "general"},
  {"id": "Pro7.de", "name": "ProSieben", "city": "Munich", "country": "DE", "latitude": 48.1351, "longitude": 11.5820, "categories": "general"},
  {"id": "RTL2.de", "name": "RTL II", "city": "Cologne", "country": "DE", "latitude": 50.9375, "longitude": 6.9603, "categories": "general"},
  
  // France
  {"id": "France2.fr", "name": "France 2", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "general"},
  {"id": "France3.fr", "name": "France 3", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "general"},
  {"id": "France5.fr", "name": "France 5", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "educational"},
  {"id": "M6.fr", "name": "M6", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "general"},
  {"id": "TF1Series.fr", "name": "TF1 Séries Films", "city": "Paris", "country": "FR", "latitude": 48.8566, "longitude": 2.3522, "categories": "entertainment"},
  
  // Italy
  {"id": "RaiDue.it", "name": "Rai Due", "city": "Rome", "country": "IT", "latitude": 41.9028, "longitude": 12.4964, "categories": "general"},
  {"id": "RaiTre.it", "name": "Rai Tre", "city": "Rome", "country": "IT", "latitude": 41.9028, "longitude": 12.4964, "categories": "general"},
  {"id": "Mediaset.it", "name": "Mediaset", "city": "Milan", "country": "IT", "latitude": 45.4642, "longitude": 9.1900, "categories": "general"},
  {"id": "La7.it", "name": "La7", "city": "Milan", "country": "IT", "latitude": 45.4642, "longitude": 9.1900, "categories": "general"},
  
  // Spain
  {"id": "Antena3.es", "name": "Antena 3", "city": "Madrid", "country": "ES", "latitude": 40.4168, "longitude": -3.7038, "categories": "general"},
  {"id": "La4.es", "name": "Cuatro", "city": "Madrid", "country": "ES", "latitude": 40.4168, "longitude": -3.7038, "categories": "general"},
  {"id": "Telecinco.es", "name": "Telecinco", "city": "Madrid", "country": "ES", "latitude": 40.4168, "longitude": -3.7038, "categories": "general"},
  {"id": "LaSexta.es", "name": "La Sexta", "city": "Madrid", "country": "ES", "latitude": 40.4168, "longitude": -3.7038, "categories": "general"},
  
  // Japan
  {"id": "FujiTV.jp", "name": "Fuji TV", "city": "Tokyo", "country": "JP", "latitude": 35.6762, "longitude": 139.6503, "categories": "general"},
  {"id": "TBS.jp", "name": "TBS", "city": "Tokyo", "country": "JP", "latitude": 35.6762, "longitude": 139.6503, "categories": "general"},
  {"id": "TVAsahi.jp", "name": "TV Asahi", "city": "Tokyo", "country": "JP", "latitude": 35.6762, "longitude": 139.6503, "categories": "general"},
  {"id": "TVTokyo.jp", "name": "TV Tokyo", "city": "Tokyo", "country": "JP", "latitude": 35.6762, "longitude": 139.6503, "categories": "general"},
  
  // Canada
  {"id": "Global.ca", "name": "Global", "city": "Toronto", "country": "CA", "latitude": 43.6532, "longitude": -79.3832, "categories": "general"},
  {"id": "CTV2.ca", "name": "CTV 2", "city": "Toronto", "country": "CA", "latitude": 43.6532, "longitude": -79.3832, "categories": "general"},
  {"id": "CityTV.ca", "name": "Citytv", "city": "Toronto", "country": "CA", "latitude": 43.6532, "longitude": -79.3832, "categories": "general"},
  
  // Australia
  {"id": "NineNetwork.au", "name": "Nine Network", "city": "Sydney", "country": "AU", "latitude": -33.8688, "longitude": 151.2093, "categories": "general"},
  {"id": "Network10.au", "name": "Network 10", "city": "Sydney", "country": "AU", "latitude": -33.8688, "longitude": 151.2093, "categories": "general"},
  {"id": "ABC.au", "name": "ABC", "city": "Sydney", "country": "AU", "latitude": -33.8688, "longitude": 151.2093, "categories": "general"},
  {"id": "SBS.au", "name": "SBS", "city": "Sydney", "country": "AU", "latitude": -33.8688, "longitude": 151.2093, "categories": "general"},
  
  // Brazil
  {"id": "SBT.br", "name": "SBT", "city": "São Paulo", "country": "BR", "latitude": -23.5505, "longitude": -46.6333, "categories": "general"},
  {"id": "Record.br", "name": "Record", "city": "São Paulo", "country": "BR", "latitude": -23.5505, "longitude": -46.6333, "categories": "general"},
  {"id": "Band.br", "name": "Band", "city": "São Paulo", "country": "BR", "latitude": -23.5505, "longitude": -46.6333, "categories": "general"},
  
  // India
  {"id": "StarPlus.in", "name": "Star Plus", "city": "Mumbai", "country": "IN", "latitude": 19.0760, "longitude": 72.8777, "categories": "general"},
  {"id": "Colors.in", "name": "Colors", "city": "Mumbai", "country": "IN", "latitude": 19.0760, "longitude": 72.8777, "categories": "general"},
  {"id": "ZeeTV.in", "name": "Zee TV", "city": "Mumbai", "country": "IN", "latitude": 19.0760, "longitude": 72.8777, "categories": "general"},
  {"id": "SonyTV.in", "name": "Sony TV", "city": "Mumbai", "country": "IN", "latitude": 19.0760, "longitude": 72.8777, "categories": "general"},
  {"id": "NDTV.in", "name": "NDTV", "city": "New Delhi", "country": "IN", "latitude": 28.6139, "longitude": 77.2090, "categories": "news"},
  {"id": "RepublicTV.in", "name": "Republic TV", "city": "New Delhi", "country": "IN", "latitude": 28.6139, "longitude": 77.2090, "categories": "news"},
  
  // Russia
  {"id": "ChannelOne.ru", "name": "Channel One", "city": "Moscow", "country": "RU", "latitude": 55.7558, "longitude": 37.6173, "categories": "general"},
  {"id": "Russia1.ru", "name": "Russia-1", "city": "Moscow", "country": "RU", "latitude": 55.7558, "longitude": 37.6173, "categories": "general"},
  {"id": "NTV.ru", "name": "NTV", "city": "Moscow", "country": "RU", "latitude": 55.7558, "longitude": 37.6173, "categories": "news"},
  
  // China
  {"id": "CCTV1.cn", "name": "CCTV-1", "city": "Beijing", "country": "CN", "latitude": 39.9042, "longitude": 116.4074, "categories": "general"},
  {"id": "CCTV13.cn", "name": "CCTV-13", "city": "Beijing", "country": "CN", "latitude": 39.9042, "longitude": 116.4074, "categories": "news"},
  
  // South Korea
  {"id": "KBS1.kr", "name": "KBS1", "city": "Seoul", "country": "KR", "latitude": 37.5665, "longitude": 126.9780, "categories": "general"},
  {"id": "KBS2.kr", "name": "KBS2", "city": "Seoul", "country": "KR", "latitude": 37.5665, "longitude": 126.9780, "categories": "general"},
  {"id": "MBC.kr", "name": "MBC", "city": "Seoul", "country": "KR", "latitude": 37.5665, "longitude": 126.9780, "categories": "general"},
  {"id": "SBS.kr", "name": "SBS", "city": "Seoul", "country": "KR", "latitude": 37.5665, "longitude": 126.9780, "categories": "general"},
  
  // Netherlands
  {"id": "NPO1.nl", "name": "NPO 1", "city": "Hilversum", "country": "NL", "latitude": 52.2397, "longitude": 5.1710, "categories": "general"},
  {"id": "NPO2.nl", "name": "NPO 2", "city": "Hilversum", "country": "NL", "latitude": 52.2397, "longitude": 5.1710, "categories": "general"},
  {"id": "NPO3.nl", "name": "NPO 3", "city": "Hilversum", "country": "NL", "latitude": 52.2397, "longitude": 5.1710, "categories": "general"},
  
  // Sweden
  {"id": "SVT1.se", "name": "SVT1", "city": "Stockholm", "country": "SE", "latitude": 59.3293, "longitude": 18.0686, "categories": "general"},
  {"id": "SVT2.se", "name": "SVT2", "city": "Stockholm", "country": "SE", "latitude": 59.3293, "longitude": 18.0686, "categories": "general"},
  {"id": "TV4.se", "name": "TV4", "city": "Stockholm", "country": "SE", "latitude": 59.3293, "longitude": 18.0686, "categories": "general"},
  
  // Norway
  {"id": "NRK1.no", "name": "NRK1", "city": "Oslo", "country": "NO", "latitude": 59.9139, "longitude": 10.7522, "categories": "general"},
  {"id": "NRK2.no", "name": "NRK2", "city": "Oslo", "country": "NO", "latitude": 59.9139, "longitude": 10.7522, "categories": "general"},
  {"id": "TV2.no", "name": "TV 2", "city": "Oslo", "country": "NO", "latitude": 59.9139, "longitude": 10.7522, "categories": "general"},
  
  // Finland
  {"id": "YLE1.fi", "name": "YLE TV1", "city": "Helsinki", "country": "FI", "latitude": 60.1699, "longitude": 24.9384, "categories": "general"},
  {"id": "YLE2.fi", "name": "YLE TV2", "city": "Helsinki", "country": "FI", "latitude": 60.1699, "longitude": 24.9384, "categories": "general"},
  
  // Denmark
  {"id": "DR1.dk", "name": "DR1", "city": "Copenhagen", "country": "DK", "latitude": 55.6761, "longitude": 12.5683, "categories": "general"},
  {"id": "DR2.dk", "name": "DR2", "city": "Copenhagen", "country": "DK", "latitude": 55.6761, "longitude": 12.5683, "categories": "general"},
  {"id": "TV2.dk", "name": "TV 2", "city": "Copenhagen", "country": "DK", "latitude": 55.6761, "longitude": 12.5683, "categories": "general"},
  
  // Belgium
  {"id": "VRT1.be", "name": "VRT 1", "city": "Brussels", "country": "BE", "latitude": 50.8503, "longitude": 4.3517, "categories": "general"},
  {"id": "RTBF1.be", "name": "RTBF 1", "city": "Brussels", "country": "BE", "latitude": 50.8503, "longitude": 4.3517, "categories": "general"},
  
  // Switzerland
  {"id": "RSI1.ch", "name": "RSI 1", "city": "Geneva", "country": "CH", "latitude": 46.2044, "longitude": 6.1432, "categories": "general"},
  {"id": "SRF1.ch", "name": "SRF 1", "city": "Geneva", "country": "CH", "latitude": 46.2044, "longitude": 6.1432, "categories": "general"},
  
  // Austria
  {"id": "ORF1.at", "name": "ORF 1", "city": "Vienna", "country": "AT", "latitude": 48.2082, "longitude": 16.3738, "categories": "general"},
  {"id": "ORF2.at", "name": "ORF 2", "city": "Vienna", "country": "AT", "latitude": 48.2082, "longitude": 16.3738, "categories": "general"},
  
  // Additional entertainment channels
  {"id": "ComedyCentral.us", "name": "Comedy Central", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "entertainment"},
  {"id": "MTV.us", "name": "MTV", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "entertainment"},
  {"id": "Nickelodeon.us", "name": "Nickelodeon", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "entertainment"},
  {"id": "DisneyChannel.us", "name": "Disney Channel", "city": "Burbank", "country": "US", "latitude": 34.1851, "longitude": -118.3264, "categories": "entertainment"},
  {"id": "CartoonNetwork.us", "name": "Cartoon Network", "city": "Atlanta", "country": "US", "latitude": 33.7490, "longitude": -84.3880, "categories": "entertainment"},
  
  // Additional news channels
  {"id": "MSNBC.us", "name": "MSNBC", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "news"},
  {"id": "FoxNews.us", "name": "Fox News", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "news"},
  {"id": "Bloomberg.us", "name": "Bloomberg", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "business"},
  {"id": "CNBC.us", "name": "CNBC", "city": "Englewood Cliffs", "country": "US", "latitude": 40.8894, "longitude": -73.9462, "categories": "business"},
  
  // Additional sports channels
  {"id": "NBA.us", "name": "NBA TV", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "sports"},
  {"id": "NFL.us", "name": "NFL Network", "city": "Los Angeles", "country": "US", "latitude": 34.0522, "longitude": -118.2437, "categories": "sports"},
  {"id": "GolfChannel.us", "name": "Golf Channel", "city": "Orlando", "country": "US", "latitude": 28.5383, "longitude": -81.3792, "categories": "sports"},
  {"id": "TennisChannel.us", "name": "Tennis Channel", "city": "New York", "country": "US", "latitude": 40.7128, "longitude": -74.0060, "categories": "sports"},
  
  // Documentary channels
  {"id": "Discovery.us", "name": "Discovery Channel", "city": "Silver Spring", "country": "US", "latitude": 39.0049, "longitude": -77.0214, "categories": "documentary"},
  {"id": "NationalGeographic.us", "name": "National Geographic", "city": "Washington", "country": "US", "latitude": 38.8951, "longitude": -77.0364, "categories": "documentary"},
  {"id": "History.us", "name": "The History Channel", "city": "Los Angeles", "country": "US", "latitude": 34.0522, "longitude": -118.2437, "categories": "documentary"}
];

// Combine existing and additional stations
const allStations = [...existingStations, ...additionalStations];

// Write to file
const outputPath = path.join(__dirname, '..', 'src', 'data', 'tvStations.json');
fs.writeFileSync(outputPath, JSON.stringify(allStations, null, 2));

console.log(`Generated ${allStations.length} TV stations and saved to ${outputPath}`);