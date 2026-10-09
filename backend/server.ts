import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory Indian transit nodes
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
    id: 'DIS-101',
    lineId: 'M2',
    lineName: 'Metro Green Line',
    title: 'Platform Signaling Synchronization Delay',
    description: 'Minor 6-minute frequency variance between Grand Central and Old City Heritage Bazaar.',
    severity: 'low',
    affectedNodes: ['N3', 'N4'],
    verificationStatus: 'verified_authority',
    corroborationCount: 42,
    reportedAt: '12 mins ago',
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

// Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'online', service: 'WAYORA Backend Engine' });
});

app.get('/api/network', (_req: Request, res: Response) => {
  res.json({ nodes: TRANSIT_NODES, disruptions, weather: currentWeather });
});

app.post('/api/journey/plan', (req: Request, res: Response) => {
  const { originId = 'N1', destinationId = 'N5', preference = 'fastest' } = req.body;
  const originNode = TRANSIT_NODES.find(n => n.id === originId) || TRANSIT_NODES[0];
  const destNode = TRANSIT_NODES.find(n => n.id === destinationId) || TRANSIT_NODES[4];

  res.json({
    origin: originNode,
    destination: destNode,
    preference,
    calculatedRoutes: [
      {
        id: 'rt-1',
        title: 'Skyway Express & Rapid Transit',
        totalDurationMinutes: 28,
        totalCost: 55,
        totalWalkingMeters: 380,
        carbonSavedKg: 2.8,
        modeSequence: ['Walk', 'Express Rail R1', 'Metro Green M2', 'Walk']
      },
      {
        id: 'rt-2',
        title: 'Green Economy Electric Bus Line',
        totalDurationMinutes: 44,
        totalCost: 30,
        totalWalkingMeters: 590,
        carbonSavedKg: 3.4,
        modeSequence: ['Walk', 'Electric Bus 101', 'Feeder Shuttle EF-4', 'Walk']
      }
    ]
  });
});

app.post('/api/journey/reroute', (req: Request, res: Response) => {
  const { missedAtNodeId = 'N3', destinationId = 'N5' } = req.body;
  res.json({
    success: true,
    reroutedAt: missedAtNodeId,
    recoveredPath: 'Direct bypass via Electric Feeder Shuttle EF-4 to Lotus Lake Waterfront (Duration: 23 min, Cost: ₹40)'
  });
});

app.get('/api/disruptions', (_req: Request, res: Response) => {
  res.json({ disruptions });
});

app.post('/api/disruptions/report', (req: Request, res: Response) => {
  const report = req.body;
  disruptions.unshift({
    id: `DIS-${Date.now()}`,
    lineId: report.lineId || 'M2',
    lineName: 'Metro Green Line',
    title: `Community: ${report.issueType || 'Delay'}`,
    description: report.description || 'Reported variance',
    severity: 'medium',
    affectedNodes: [report.stationId || 'N3'],
    verificationStatus: 'community_corroborated',
    corroborationCount: 1,
    reportedAt: 'Just now',
    isSimulated: false,
  });
  res.status(201).json({ success: true, count: disruptions.length });
});

app.post('/api/aura/assist', (req: Request, res: Response) => {
  const { query = '' } = req.body;
  res.json({
    reply: `WAYORA Aura received "${query}". All 6 multimodal corridors are synchronized.`,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[WAYORA Backend] Running on http://localhost:${PORT}`);
});
