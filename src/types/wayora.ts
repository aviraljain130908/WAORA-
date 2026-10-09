export type TransitMode = 'walk' | 'metro' | 'rail' | 'bus' | 'feeder';

export type IndianCity = 'delhi_ncr' | 'mumbai' | 'bengaluru' | 'hyderabad';

export type RoutePreference = 
  | 'fastest' 
  | 'cheapest' 
  | 'balanced' 
  | 'family' 
  | 'low_walking' 
  | 'safety_conscious' 
  | 'weather_aware' 
  | 'accessible';

export interface TransitNode {
  id: string;
  name: string;
  hindiName?: string;
  code: string;
  city: IndianCity;
  x: number; // Normalized coordinate 0-1000 for map rendering
  y: number;
  lat: number;
  lng: number;
  type: 'metro_station' | 'rail_hub' | 'bus_terminal' | 'feeder_stop' | 'landmark';
  lines: string[];
  hasElevator: boolean;
  hasCCTV: boolean;
  isStaffedNight: boolean;
  crowdingLevel: 'low' | 'medium' | 'high';
  aqi: number;
  zone: string;
}

export interface TransitLine {
  id: string;
  name: string;
  hindiName?: string;
  type: TransitMode;
  color: string;
  stops: string[]; // Node IDs
  frequencyMinutes: number;
  averageSpeedKmh: number;
  vehicleImage?: string;
}

export interface RouteLeg {
  id: string;
  mode: TransitMode;
  lineId?: string;
  lineName?: string;
  lineColor?: string;
  fromNode: TransitNode;
  toNode: TransitNode;
  durationMinutes: number;
  distanceMeters: number;
  cost: number;
  platform?: string;
  instructions: string;
  crowding: 'low' | 'medium' | 'high';
  isElevatorAccessible: boolean;
  carbonEmissionGrams: number;
  weatherProtected: boolean;
  roadCoordinates?: { lat: number; lng: number }[];
}

export interface JourneyRoute {
  id: string;
  preferenceCategory: RoutePreference;
  title: string;
  totalDurationMinutes: number;
  totalCost: number; // In INR (₹)
  totalWalkingMeters: number;
  transfersCount: number;
  carbonSavedKg: number;
  averageAqi: number;
  departureTime: string;
  arrivalTime: string;
  legs: RouteLeg[];
  explanation: string;
  safetyRating: 'High' | 'Very High' | 'Verified Safe';
  isElevatorAccessible: boolean;
  crowdingOverview: 'Low' | 'Moderate' | 'Busy';
  warnings: string[];
  isSimulatedFallback?: boolean;
  roadCoordinates?: { lat: number; lng: number }[];
}

export interface DisruptionAlert {
  id: string;
  lineId: string;
  lineName: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedNodes: string[];
  verificationStatus: 'verified_authority' | 'community_corroborated' | 'unverified_report';
  corroborationCount: number;
  reportedAt: string;
  isSimulated: boolean;
}

export interface CommunityReport {
  id: string;
  lineId: string;
  stationId: string;
  issueType: 'delay' | 'overcrowding' | 'elevator_fault' | 'waterlogging' | 'security_concern';
  description: string;
  timestamp: string;
  upvotes: number;
  verified: boolean;
}

export interface WeatherCondition {
  condition: 'clear' | 'partly_cloudy' | 'rain' | 'monsoon_downpour' | 'windy';
  temperatureC: number;
  precipitationProbability: number;
  humidityPercent: number;
  windSpeedKmh: number;
  aqiLevel: number;
  advisory: string;
  isSimulatedScenario: boolean;
}

export interface AuraMessage {
  id: string;
  sender: 'user' | 'aura';
  text: string;
  timestamp: string;
  actionTaken?: string;
  recommendedRouteId?: string;
}

export type AuraState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface LiveGPSState {
  isActive: boolean;
  isSimulated: boolean;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  headingDegrees: number;
  currentStationIndex: number;
  distanceToNextStopMeters: number;
  nextStopName: string;
  estimatedArrivalMins: number;
  turnInstruction: string;
}
