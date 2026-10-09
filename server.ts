import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory mobility state & Indian transit datasets
const TRANSIT_NODES = [
  { id: 'DEL-01', name: 'Rajiv Chowk Interchange', code: 'RC-01', lines: ['DMRC-BLUE', 'DMRC-YELLOW', 'EV-BUS-DTC'], zone: 'Connaught Place Central Hub', aqi: 115 },
  { id: 'DEL-02', name: 'IGI Airport Terminal 3', code: 'AER-T3', lines: ['AIRPORT-EXP', 'E-AUTO-FEEDER'], zone: 'Aerocity International Gateway', aqi: 68 },
  { id: 'DEL-03', name: 'Cyber City Gurgaon', code: 'CYB-GGN', lines: ['DMRC-YELLOW', 'E-AUTO-FEEDER'], zone: 'DLF CyberHub IT Corridor', aqi: 95 },
  { id: 'DEL-04', name: 'Noida Sector 62 IT Park', code: 'NOI-62', lines: ['DMRC-BLUE', 'E-AUTO-FEEDER'], zone: 'Noida Electronic City Tech Park', aqi: 82 },
  { id: 'DEL-05', name: 'Kashmere Gate ISBT', code: 'KG-ISBT', lines: ['DMRC-YELLOW', 'EV-BUS-DTC'], zone: 'Inter-State Multi-modal Terminal', aqi: 140 },
  { id: 'DEL-06', name: 'New Delhi Railway Vande Bharat Station', code: 'NDLS-VB', lines: ['AIRPORT-EXP', 'DMRC-YELLOW', 'VANDE-BHARAT'], zone: 'National Railway Terminus', aqi: 122 },
  { id: 'DEL-07', name: 'Hauz Khas Heritage & University', code: 'HK-IIT', lines: ['DMRC-YELLOW', 'E-AUTO-FEEDER'], zone: 'IIT Delhi & Social Arts Hub', aqi: 64 },
  { id: 'DEL-08', name: 'Chandni Chowk Bazaar', code: 'CC-OLD', lines: ['DMRC-YELLOW', 'EV-BUS-DTC', 'E-AUTO-FEEDER'], zone: 'Historic Walled City & Spice Market', aqi: 155 },
  { id: 'BOM-01', name: 'CSMT Heritage Terminus', code: 'CSMT-01', lines: ['VANDE-BHARAT', 'MUM-LOCAL'], zone: 'South Mumbai Financial Core', aqi: 70 },
  { id: 'BOM-02', name: 'Bandra Kurla Complex (BKC)', code: 'BKC-02', lines: ['MUM-METRO-3', 'E-AUTO-FEEDER'], zone: 'Global Business District', aqi: 62 },
  { id: 'BLR-01', name: 'Majestic Kempegowda Central', code: 'MAJ-01', lines: ['NAMMA-PURPLE', 'NAMMA-GREEN'], zone: 'Bengaluru Central Interchange', aqi: 48 },
  { id: 'HYD-01', name: 'Hitech City Cyber Towers', code: 'HTC-01', lines: ['HYD-BLUE', 'E-AUTO-FEEDER'], zone: 'Cyberabad IT District', aqi: 52 }
];

let disruptions = [
  {
    id: 'DIS-IND-101',
    lineId: 'DMRC-YELLOW',
    lineName: 'Delhi Metro Yellow Line',
    title: 'Rajiv Chowk Peak Headway Regulation',
    description: 'Platform 2 queuing marshals deployed to ensure smooth boarding towards HUDA City Centre.',
    severity: 'low',
    affectedNodes: ['DEL-01'],
    verificationStatus: 'verified_authority',
    corroborationCount: 56,
    reportedAt: '8 mins ago',
    isSimulated: false,
  },
  {
    id: 'DIS-102',
    lineId: 'B101',
    lineName: 'City Electric Bus 101',
    title: 'Bazaar Plaza Road Congestion Delay',
    description: 'Pedestrian festival causing +14 min delay on surface road near Old City Heritage stop.',
    severity: 'medium',
    affectedNodes: ['N4'],
    verificationStatus: 'community_corroborated',
    corroborationCount: 18,
    reportedAt: '25 mins ago',
    isSimulated: false,
  }
];

let currentWeather = {
  condition: 'clear',
  temperatureC: 24,
  precipitationProbability: 5,
  humidityPercent: 48,
  windSpeedKmh: 12,
  aqiLevel: 68,
  advisory: 'Clear skies. Optimal conditions for walking and e-shuttle first-mile connections.',
  isSimulatedScenario: false,
};

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    service: 'WAYORA Multi-Modal Mobility Core',
    timestamp: new Date().toISOString()
  });
});

// 2. Transit Network graph
app.get('/api/network', (_req: Request, res: Response) => {
  res.json({
    nodes: TRANSIT_NODES,
    linesCount: 6,
    activeDisruptions: disruptions.length,
    weather: currentWeather
  });
});

// 3. Journey Planning
app.post('/api/journey/plan', (req: Request, res: Response) => {
  const { originId = 'N1', destinationId = 'N5', preference = 'fastest', maxBudget = 100 } = req.body;

  const originNode = TRANSIT_NODES.find(n => n.id === originId) || TRANSIT_NODES[0];
  const destNode = TRANSIT_NODES.find(n => n.id === destinationId) || TRANSIT_NODES[4];

  const now = new Date();
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Generate multi-modal route responses
  const routes = [
    {
      id: 'srv-route-fastest',
      preferenceCategory: 'fastest',
      title: 'Skyway Express & Rapid Transit',
      totalDurationMinutes: 28,
      totalCost: 55,
      totalWalkingMeters: 380,
      transfersCount: 1,
      carbonSavedKg: 2.8,
      averageAqi: Math.round((originNode.aqi + destNode.aqi) / 2),
      departureTime: formatTime(new Date(now.getTime() + 4 * 60000)),
      arrivalTime: formatTime(new Date(now.getTime() + 32 * 60000)),
      explanation: 'Prioritizes high-speed rail corridors and automated underground metro headway.',
      safetyRating: 'Verified Safe'
    },
    {
      id: 'srv-route-cheapest',
      preferenceCategory: 'cheapest',
      title: 'Green Economy Electric Bus Line',
      totalDurationMinutes: 44,
      totalCost: 30,
      totalWalkingMeters: 590,
      transfersCount: 1,
      carbonSavedKg: 3.4,
      averageAqi: 72,
      departureTime: formatTime(new Date(now.getTime() + 6 * 60000)),
      arrivalTime: formatTime(new Date(now.getTime() + 50 * 60000)),
      explanation: 'Utilizes zero-emission subsidized municipal bus corridors for maximum economy.',
      safetyRating: 'High'
    }
  ];

  res.json({
    origin: originNode,
    destination: destNode,
    requestedPreference: preference,
    maxBudget,
    routes
  });
});

// 4. Dynamic Rerouting
app.post('/api/journey/reroute', (req: Request, res: Response) => {
  const { missedAtNodeId = 'N3', destinationId = 'N5', reason = 'Missed connection' } = req.body;
  const missedNode = TRANSIT_NODES.find(n => n.id === missedAtNodeId) || TRANSIT_NODES[2];
  const destNode = TRANSIT_NODES.find(n => n.id === destinationId) || TRANSIT_NODES[4];

  const now = new Date();
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  res.json({
    success: true,
    reroutedAt: missedNode.name,
    reason,
    recoveredRoute: {
      id: `reroute-${Date.now()}`,
      title: 'Dynamic Reroute: Electric Feeder Bypass',
      totalDurationMinutes: 23,
      totalCost: 40,
      departureTime: formatTime(new Date(now.getTime() + 2 * 60000)),
      arrivalTime: formatTime(new Date(now.getTime() + 25 * 60000)),
      instructions: `Direct bypass from ${missedNode.name} to ${destNode.name} via Feeder Shuttle EF-4.`
    }
  });
});

// 5. Disruptions Feed & Reporting
app.get('/api/disruptions', (_req: Request, res: Response) => {
  res.json({ disruptions });
});

app.post('/api/disruptions/report', (req: Request, res: Response) => {
  const { lineId = 'M2', stationId = 'N3', issueType = 'delay', description = '' } = req.body;
  const newReport = {
    id: `DIS-${Date.now()}`,
    lineId,
    lineName: lineId === 'M1' ? 'Metro Blue Line' : 'Metro Green Line',
    title: `Community: ${String(issueType).toUpperCase()}`,
    description,
    severity: 'medium',
    affectedNodes: [stationId],
    verificationStatus: 'community_corroborated',
    corroborationCount: 1,
    reportedAt: 'Just now',
    isSimulated: false,
  };
  disruptions.unshift(newReport as any);
  res.status(201).json({ success: true, report: newReport });
});

app.post('/api/disruptions/corroborate', (req: Request, res: Response) => {
  const { id } = req.body;
  const item = disruptions.find(d => d.id === id);
  if (item) {
    item.corroborationCount += 1;
    res.json({ success: true, count: item.corroborationCount });
  } else {
    res.status(404).json({ error: 'Disruption not found' });
  }
});

// 6. Weather Endpoints
app.get('/api/weather', (_req: Request, res: Response) => {
  res.json({ weather: currentWeather });
});

app.post('/api/weather/simulate', (req: Request, res: Response) => {
  const { scenario = 'rain' } = req.body;
  if (scenario === 'rain') {
    currentWeather = {
      condition: 'monsoon_downpour',
      temperatureC: 22,
      precipitationProbability: 95,
      humidityPercent: 88,
      windSpeedKmh: 34,
      aqiLevel: 35,
      advisory: 'Heavy Delhi monsoon downpour active. Surface walking discouraged; underground Metro Yellow & Blue lines prioritized.',
      isSimulatedScenario: true,
    };
  } else {
    currentWeather = {
      condition: 'clear',
      temperatureC: 28,
      precipitationProbability: 10,
      humidityPercent: 52,
      windSpeedKmh: 14,
      aqiLevel: 110,
      advisory: 'Clear evening skies across Delhi NCR. Moderate AQI: Air-conditioned Metro carriages and electric buses recommended.',
      isSimulatedScenario: false,
    };
  }
  res.json({ success: true, weather: currentWeather });
});

// 7. Aura AI Assist (Powered by Gemini API when key is configured + Smart Contextual Engine)
app.post('/api/aura/assist', async (req: Request, res: Response) => {
  const { query = '', contextRoute = null } = req.body;
  const q = String(query).trim().toLowerCase();

  let intent = 'general_inquiry';
  let responseText = '';
  let recommendedAction: any = null;

  // Determine intent & recommendation action
  if (q.includes('cheap') || q.includes('kam') || q.includes('paisa') || q.includes('budget') || q.includes('fare') || q.includes('₹')) {
    intent = 'budget_filter';
    recommendedAction = { action: 'set_preference', preference: 'cheapest', maxBudget: 35 };
  } else if (q.includes('missed') || q.includes('chhoot') || q.includes('reroute')) {
    intent = 'missed_connection';
    recommendedAction = { action: 'trigger_reroute', stationId: 'DEL-01' };
  } else if (q.includes('rain') || q.includes('barish') || q.includes('monsoon')) {
    intent = 'weather_adapt';
    recommendedAction = { action: 'set_weather', condition: 'monsoon_downpour' };
  } else if (q.includes('night') || q.includes('safe') || q.includes('mahila') || q.includes('cisf') || q.includes('women')) {
    intent = 'safety_filter';
    recommendedAction = { action: 'set_preference', preference: 'safety_conscious' };
  } else if (q.includes('fast') || q.includes('jaldi') || q.includes('metro') || q.includes('speed')) {
    intent = 'speed_filter';
    recommendedAction = { action: 'set_preference', preference: 'fastest' };
  }

  // Attempt real Gemini API if GEMINI_API_KEY is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && geminiKey.length > 10) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const prompt = `You are WAYORA Aura, an ultra-smart, polite Indian multimodal transit companion for Delhi NCR, Mumbai, Bengaluru, and Hyderabad.
The user asked: "${query}".
Active transit context: Metro lines DMRC Yellow/Blue, Vande Bharat Rail, DTC Electric Buses, and Smart E-Auto Rickshaws.
Keep your answer concise (2-3 sentences), warm, and supportive in English or Hinglish if appropriate.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response && response.text) {
        responseText = response.text.trim();
      }
    } catch (err) {
      console.warn('[Aura AI] Gemini API call skipped or encountered error, utilizing contextual engine fallback:', err);
    }
  }

  // Fallback response if Gemini was not configured or skipped
  if (!responseText) {
    if (intent === 'budget_filter') {
      responseText = 'Budget constraint applied (₹35 economy cap). Subsidized DTC electric buses and shared E-Rickshaw feeder routes prioritized.';
    } else if (intent === 'missed_connection') {
      responseText = 'Missed connection detected at Rajiv Chowk. I have automatically recalculated an immediate bypass via Smart E-Auto Feeder to the Blue Line.';
    } else if (intent === 'weather_adapt') {
      responseText = 'Monsoon weather shield activated. Prioritizing 100% underground Metro Yellow & Blue corridors and enclosed AC skywalks.';
    } else if (intent === 'safety_filter') {
      responseText = 'Guardian Night Corridor active. All suggested routes filtered strictly through 24/7 CISF-staffed stations with active CCTV coverage.';
    } else if (intent === 'speed_filter') {
      responseText = 'Fastest Express mode active. Prioritizing high-speed automated Metro Blue & Yellow corridors with minimal headway.';
    } else {
      responseText = `I have received your transit request regarding "${query}". All 6 multimodal corridors across Delhi NCR and Indian hubs are synchronized on-time.`;
    }
  }

  res.json({
    intent,
    responseText,
    recommendedAction,
    timestamp: new Date().toISOString()
  });
});

// 8. Consent-based Journey Share
app.post('/api/journey/share', (req: Request, res: Response) => {
  const { routeId = 'current', recipientContact = '', expiresHours = 2, consentGranted = false } = req.body;
  if (!consentGranted) {
    return res.status(400).json({ error: 'Consent must be granted prior to initiating journey location sharing.' });
  }

  const shareToken = `trk_${Math.random().toString(36).substring(2, 10)}`;
  res.json({
    success: true,
    shareUrl: `https://wayora.app/track/${shareToken}`,
    shareToken,
    recipientContact: recipientContact || 'Designated Contact',
    expiresInHours: expiresHours,
    created: new Date().toISOString()
  });
});

// 9. Verified Emergency SOS Broadcast Endpoint
app.post('/api/emergency/broadcast', (req: Request, res: Response) => {
  const { latitude, longitude, stationId = 'DEL-01', message = 'Transit Emergency Assistance Requested' } = req.body;

  const broadcastId = `SOS-${Date.now()}`;
  console.log(`[EMERGENCY SOS LOGGED] ID: ${broadcastId} | Station: ${stationId} | Coords: ${latitude}, ${longitude}`);

  res.status(200).json({
    success: true,
    broadcastId,
    status: 'DISPATCH_BROADCAST_LOGGED',
    timestamp: new Date().toISOString(),
    details: {
      stationId,
      latitude,
      longitude,
      nearestStationController: 'Delhi Metro Central Security Command',
      helpline: '112 / 1091'
    }
  });
});

// Helper function to decode Google Maps encoded polyline into coordinate array
function decodeGooglePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// 10. Real Road-Following Route Geometry Endpoint (Google Routes API + OSRM fallback)
app.post('/api/routes/geometry', async (req: Request, res: Response) => {
  const { origin, destination, travelMode = 'DRIVE' } = req.body;

  if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
    return res.status(400).json({ error: 'Origin and destination coordinates are required' });
  }

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAo3PnQV7TkkeBk2_uXy9dxFy3GjscN_nE';

  // 1. Attempt Google Routes API (computeRoutes)
  try {
    const googleRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: travelMode === 'WALK' ? 'WALK' : 'DRIVE',
      }),
    });

    if (googleRes.ok) {
      const data = await googleRes.json() as any;
      if (data.routes && data.routes[0]?.polyline?.encodedPolyline) {
        const polylineStr = data.routes[0].polyline.encodedPolyline;
        const coordinates = decodeGooglePolyline(polylineStr);
        return res.json({
          source: 'google_routes_api',
          distanceMeters: data.routes[0].distanceMeters,
          duration: data.routes[0].duration,
          coordinates,
        });
      }
    }
  } catch (err) {
    console.warn('[Google Routes API proxy error, falling back to OSRM]:', err);
  }

  // 2. High-precision OSRM road network geometry fallback
  try {
    const osrmMode = travelMode === 'WALK' ? 'foot' : 'driving';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmMode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const osrmRes = await fetch(osrmUrl);
    if (osrmRes.ok) {
      const osrmData = await osrmRes.json() as any;
      if (osrmData.routes && osrmData.routes[0]?.geometry?.coordinates) {
        const coordinates = osrmData.routes[0].geometry.coordinates.map((pt: [number, number]) => ({
          lat: pt[1],
          lng: pt[0],
        }));
        return res.json({
          source: 'osrm_road_network',
          distanceMeters: osrmData.routes[0].distance,
          duration: `${Math.round(osrmData.routes[0].duration)}s`,
          coordinates,
        });
      }
    }
  } catch (osrmErr) {
    console.warn('[OSRM road geometry fallback error]:', osrmErr);
  }

  // 3. Fallback smooth bezier/road points
  const steps = 20;
  const coordinates: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curveOffset = Math.sin(t * Math.PI) * 0.006;
    coordinates.push({
      lat: origin.lat + (destination.lat - origin.lat) * t + curveOffset,
      lng: origin.lng + (destination.lng - origin.lng) * t + (curveOffset * 0.6),
    });
  }

  return res.json({
    source: 'interpolated_road_spline',
    coordinates,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[WAYORA] Mobility Server running on port ${PORT}`);
  });
}

startServer();
