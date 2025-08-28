# Complete Automation Architecture for Media Stream Management

## Overview
Building a fully automated system for scraping, collecting, verifying, and managing global media streams is a substantial undertaking. This document outlines a comprehensive architecture for this system.

## Project Structure

```bash
automation/
├── scrapers/
│   ├── stream_sources.json          # Config for sources to scrape
│   ├── crawler.py                   # Main crawling orchestrator
│   ├── radio_scrapers/
│   │   ├── shoutcast_scraper.py
│   │   ├── icecast_scraper.py
│   │   ├── directory_scraper.py
│   │   └── metadata_extractor.py
│   └── tv_scrapers/
│       ├── iptv_scraper.py
│       ├── m3u_parser.py
│       └── stream_validator.py
├── database/
│   ├── models/
│   │   ├── stream.py
│   │   ├── geolocation.py
│   │   ├── quality_metrics.py
│   │   └── verification_history.py
│   └── migrations/
├── ml/
│   ├── verification/
│   │   ├── stream_classifier.py
│   │   ├── quality_predictor.py
│   │   └── fraud_detector.py
│   └── geocoding/
│       ├── location_predictor.py
│       └── accuracy_improver.py
├── monitoring/
│   ├── health_checker.py
│   ├── alert_system.py
│   └── performance_analyzer.py
└── automation/
    ├── scheduler.py
    ├── stream_manager.py
    └── cleanup_service.py
```

## Database Schema (PostgreSQL/MongoDB)

```sql
-- Core tables for stream management
CREATE TABLE streams (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) UNIQUE NOT NULL,
    name VARCHAR(255),
    type VARCHAR(10), -- 'radio' or 'tv'
    genre VARCHAR(100),
    bitrate INTEGER,
    codec VARCHAR(50),
    country_code CHAR(2),
    country_name VARCHAR(100),
    city VARCHAR(100),
    language VARCHAR(50),
    website VARCHAR(500),
    description TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMP,
    last_success TIMESTAMP,
    check_frequency INTERVAL DEFAULT '1 hour',
    reliability_score DECIMAL(3,2) DEFAULT 1.0,
    quality_score DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stream_metrics (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER REFERENCES streams(id),
    response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2),
    error_count INTEGER,
    last_error_type VARCHAR(50),
    bandwidth_kbps INTEGER,
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE geolocation_data (
    stream_id INTEGER REFERENCES streams(id),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    accuracy_radius_km INTEGER,
    geocoding_method VARCHAR(50),
    confidence_score DECIMAL(3,2),
    verified BOOLEAN DEFAULT false
);
```

## Scraper Implementation

```python
# crawler.py - Main crawling orchestrator
import asyncio
import aiohttp
from typing import List, Dict
import json
from datetime import datetime
import logging

class StreamCrawler:
    def __init__(self, config_file: str):
        self.config = self.load_config(config_file)
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            
    def load_config(self, config_file: str) -> Dict:
        with open(config_file, 'r') as f:
            return json.load(f)
            
    async def crawl_sources(self) -> List[Dict]:
        """Crawl multiple stream sources concurrently"""
        tasks = []
        for source in self.config['sources']:
            if source['type'] == 'shoutcast':
                tasks.append(self.crawl_shoutcast_directory(source))
            elif source['type'] == 'icecast':
                tasks.append(self.crawl_icecast_directory(source))
            elif source['type'] == 'iptv':
                tasks.append(self.crawl_iptv_playlists(source))
                
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [item for sublist in results if not isinstance(sublist, Exception) for item in sublist]
        
    async def crawl_shoutcast_directory(self, source: Dict) -> List[Dict]:
        """Crawl Shoutcast directory API"""
        streams = []
        try:
            # Shoutcast API endpoint
            url = f"http://directory.shoutcast.com/Server/PublicSearch"
            params = {
                'query': source.get('query', ''),
                'limit': source.get('limit', 1000)
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    for station in data:
                        stream = {
                            'url': station.get('URI'),
                            'name': station.get('Name'),
                            'genre': station.get('Genre'),
                            'bitrate': station.get('Bitrate'),
                            'codec': station.get('Mime'),
                            'listeners': station.get('Listeners'),
                            'country': station.get('Country'),
                            'website': station.get('Website')
                        }
                        streams.append(stream)
        except Exception as e:
            logging.error(f"Error crawling Shoutcast: {e}")
            
        return streams
```

## Geocoding & Verification System

```python
# geolocation_service.py - Enhanced geocoding
import requests
import ipinfo
import geoip2.database
from typing import Dict, Optional

class GeolocationService:
    def __init__(self, ipinfo_token: str, geoip_db_path: str):
        self.ipinfo_handler = ipinfo.getHandler(ipinfo_token)
        self.geoip_reader = geoip2.database.Reader(geoip_db_path)
        
    def geocode_stream(self, stream_url: str) -> Optional[Dict]:
        """Multi-method geocoding for maximum accuracy"""
        try:
            # Method 1: Extract IP from URL and use IP geolocation
            ip = self.extract_ip_from_url(stream_url)
            if ip:
                ip_location = self.geocode_by_ip(ip)
                if ip_location:
                    return ip_location
                    
            # Method 2: Extract domain and use domain-based geolocation
            domain = self.extract_domain(stream_url)
            if domain:
                domain_location = self.geocode_by_domain(domain)
                if domain_location:
                    return domain_location
                    
            # Method 3: Use metadata from stream itself
            metadata_location = self.geocode_by_metadata(stream_url)
            if metadata_location:
                return metadata_location
                
        except Exception as e:
            logging.error(f"Geocoding error: {e}")
            
        return None
        
    def extract_ip_from_url(self, url: str) -> Optional[str]:
        """Extract IP address from stream URL"""
        import re
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        match = re.search(ip_pattern, url)
        return match.group() if match else None
        
    def geocode_by_ip(self, ip: str) -> Optional[Dict]:
        """Geocode using IP address"""
        try:
            details = self.ipinfo_handler.getDetails(ip)
            return {
                'latitude': float(details.latitude) if details.latitude else None,
                'longitude': float(details.longitude) if details.longitude else None,
                'country_code': details.country,
                'country_name': details.country_name,
                'city': details.city,
                'accuracy_radius': 10  # Approximate radius in km
            }
        except:
            return None
```

## ML-Based Verification System

```python
# stream_verifier.py - ML-powered stream verification
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import librosa
import cv2

class StreamVerifier:
    def __init__(self, model_path: str = None):
        self.scaler = StandardScaler()
        if model_path:
            self.model = joblib.load(model_path)
        else:
            self.model = RandomForestClassifier(n_estimators=100)
            
    def extract_features(self, stream_url: str) -> np.ndarray:
        """Extract audio/video features for verification"""
        features = []
        
        try:
            # For audio streams
            if self.is_audio_stream(stream_url):
                # Extract audio features using librosa
                y, sr = librosa.load(stream_url, duration=30)  # 30 seconds sample
                features.extend([
                    np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)),
                    np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)),
                    np.mean(librosa.feature.zero_crossing_rate(y)),
                    np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)),
                ])
                
            # For video streams
            else:
                # Extract video features using OpenCV
                cap = cv2.VideoCapture(stream_url)
                frame_count = 0
                motion_scores = []
                
                while frame_count < 100:  # Analyze first 100 frames
                    ret, frame = cap.read()
                    if not ret:
                        break
                        
                    # Convert to grayscale
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    
                    # Calculate motion between frames
                    if frame_count > 0:
                        diff = cv2.absdiff(prev_frame, gray)
                        motion_score = np.mean(diff)
                        motion_scores.append(motion_score)
                        
                    prev_frame = gray
                    frame_count += 1
                    
                cap.release()
                
                features.extend([
                    np.mean(motion_scores) if motion_scores else 0,
                    np.std(motion_scores) if motion_scores else 0,
                    len(motion_scores)
                ])
                
        except Exception as e:
            logging.warning(f"Feature extraction error: {e}")
            features = [0] * 10  # Default features
            
        return np.array(features).reshape(1, -1)
        
    def verify_stream(self, stream_url: str) -> Dict[str, float]:
        """Verify stream quality and authenticity"""
        features = self.extract_features(stream_url)
        features_scaled = self.scaler.transform(features)
        
        # Predict probability of being a valid stream
        probability = self.model.predict_proba(features_scaled)[0]
        
        return {
            'is_valid': probability[1] > 0.7,  # Assuming class 1 is valid
            'confidence': float(probability[1]),
            'risk_score': float(1 - probability[1])
        }
```

## Monitoring & Alert System

```python
# health_monitor.py - Continuous monitoring system
import asyncio
import aiohttp
import time
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
import logging

class StreamHealthMonitor:
    def __init__(self, db_connection, alert_config: Dict):
        self.db = db_connection
        self.alert_config = alert_config
        self.session = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            
    async def monitor_all_streams(self):
        """Monitor all streams continuously"""
        while True:
            try:
                # Get streams that need checking
                streams = await self.get_streams_to_check()
                
                # Check streams concurrently
                tasks = [self.check_stream_health(stream) for stream in streams]
                await asyncio.gather(*tasks, return_exceptions=True)
                
                # Wait before next check cycle
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logging.error(f"Monitoring error: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
                
    async def check_stream_health(self, stream: Dict):
        """Check individual stream health"""
        start_time = time.time()
        is_healthy = False
        error_type = None
        
        try:
            # Perform HTTP HEAD request first (faster)
            async with self.session.head(stream['url'], timeout=10) as response:
                if response.status == 200:
                    # If HEAD works, try actual stream connection
                    async with self.session.get(stream['url'], timeout=30) as stream_response:
                        if stream_response.status == 200:
                            # Read a small chunk to verify it's actually streaming
                            chunk = await stream_response.content.read(1024)
                            if chunk:
                                is_healthy = True
                                
        except asyncio.TimeoutError:
            error_type = "timeout"
        except aiohttp.ClientError as e:
            error_type = type(e).__name__
        except Exception as e:
            error_type = "unknown"
            
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Update database with results
        await self.update_stream_status(stream['id'], is_healthy, response_time, error_type)
        
        # Send alerts if needed
        if not is_healthy:
            await self.check_and_send_alerts(stream, error_type)
            
    async def check_and_send_alerts(self, stream: Dict, error_type: str):
        """Send alerts for problematic streams"""
        # Check if we should send alert (avoid spam)
        last_alert = await self.get_last_alert_time(stream['id'])
        if last_alert and datetime.now() - last_alert < timedelta(hours=1):
            return  # Don't send alert if last one was less than an hour ago
            
        # Send alert
        await self.send_alert(stream, error_type)
        await self.record_alert(stream['id'])
```

## Automation & Scheduling

```python
# automation_scheduler.py - Task scheduling and automation
import schedule
import time
import threading
from datetime import datetime
import logging

class AutomationScheduler:
    def __init__(self, crawler, verifier, monitor):
        self.crawler = crawler
        self.verifier = verifier
        self.monitor = monitor
        
    def start_scheduled_tasks(self):
        """Start all scheduled automation tasks"""
        # Schedule crawling every 6 hours
        schedule.every(6).hours.do(self.run_crawling_task)
        
        # Schedule verification every 2 hours
        schedule.every(2).hours.do(self.run_verification_task)
        
        # Schedule cleanup daily
        schedule.every().day.at("02:00").do(self.run_cleanup_task)
        
        # Start scheduler in background thread
        scheduler_thread = threading.Thread(target=self.run_scheduler)
        scheduler_thread.daemon = True
        scheduler_thread.start()
        
    def run_scheduler(self):
        """Run the scheduler loop"""
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
            
    def run_crawling_task(self):
        """Run stream crawling task"""
        try:
            logging.info("Starting stream crawling task")
            asyncio.run(self.crawler.crawl_sources())
            logging.info("Stream crawling completed")
        except Exception as e:
            logging.error(f"Crawling task failed: {e}")
            
    def run_verification_task(self):
        """Run stream verification task"""
        try:
            logging.info("Starting stream verification task")
            # This would call the verifier on all streams
            logging.info("Stream verification completed")
        except Exception as e:
            logging.error(f"Verification task failed: {e}")
            
    def run_cleanup_task(self):
        """Run database cleanup task"""
        try:
            logging.info("Starting cleanup task")
            # Remove dead streams, optimize database, etc.
            logging.info("Cleanup completed")
        except Exception as e:
            logging.error(f"Cleanup task failed: {e}")
```

## Integration with Your Current App

```javascript
// api/streamSources.js - API endpoints for the automation system
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get verified streams for the globe
router.get('/streams', async (req, res) => {
  try {
    const { type, country, limit = 1000 } = req.query;
    
    let query = `
      SELECT s.*, g.latitude, g.longitude 
      FROM streams s 
      LEFT JOIN geolocation_data g ON s.id = g.stream_id 
      WHERE s.is_active = true 
      AND s.reliability_score > 0.7
    `;
    
    const params = [];
    
    if (type) {
      query += ' AND s.type = $' + (params.length + 1);
      params.push(type);
    }
    
    if (country) {
      query += ' AND s.country_code = $' + (params.length + 1);
      params.push(country);
    }
    
    query += ' ORDER BY s.reliability_score DESC, s.quality_score DESC';
    query += ' LIMIT $' + (params.length + 1);
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching streams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stream statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_streams,
        COUNT(CASE WHEN type = 'radio' THEN 1 END) as radio_streams,
        COUNT(CASE WHEN type = 'tv' THEN 1 END) as tv_streams,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_streams,
        AVG(reliability_score) as avg_reliability,
        STRING_AGG(DISTINCT country_code, ',') as countries
      FROM streams
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## Docker Compose for Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: stream_db
      POSTGRES_USER: stream_user
      POSTGRES_PASSWORD: stream_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  crawler:
    build: ./automation
    command: python -m automation.scrapers.crawler
    environment:
      - DATABASE_URL=postgresql://stream_user:stream_pass@postgres:5432/stream_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  monitor:
    build: ./automation
    command: python -m automation.monitoring.health_checker
    environment:
      - DATABASE_URL=postgresql://stream_user:stream_pass@postgres:5432/stream_db
    depends_on:
      - postgres

  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://stream_user:stream_pass@postgres:5432/stream_db
    depends_on:
      - postgres

volumes:
  postgres_data:
```

## Key Technologies & Tools

1. **Scraping**: 
   - `aiohttp` for async HTTP requests
   - `BeautifulSoup` for HTML parsing
   - `Scrapy` for complex scraping needs

2. **Database**:
   - PostgreSQL for relational data
   - Redis for caching and queue management

3. **ML/AI**:
   - `scikit-learn` for classification and prediction
   - `librosa` for audio analysis
   - `OpenCV` for video analysis
   - `TensorFlow/PyTorch` for advanced models

4. **Monitoring**:
   - Prometheus + Grafana for metrics
   - ELK stack for logging
   - AlertManager for notifications

5. **Infrastructure**:
   - Docker for containerization
   - Kubernetes for orchestration
   - Cloud services (AWS/GCP/Azure) for scaling

## Implementation Roadmap

1. **Phase 1**: Basic scraper and database setup
2. **Phase 2**: Geocoding and basic verification
3. **Phase 3**: ML models for quality prediction
4. **Phase 4**: Real-time monitoring and alerts
5. **Phase 5**: Advanced automation and optimization

This architecture provides a robust foundation for fully automated stream management while being scalable and maintainable. The system can handle thousands of streams, automatically verify their quality, geocode them accurately, and provide real-time monitoring.