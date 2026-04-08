export interface FacilityPrediction {
  facility_id: string;
  facility_name: string;
  facility_short: string;
  facility_type: 'bridge' | 'tunnel';
  current_volume: number;
  predicted_volume_1h: number;
  predicted_volume_2h: number;
  predicted_volume_4h: number;
  capacity: number;
  risk_level: 'low' | 'moderate' | 'high';
  risk_percentage: number;
  coordinates: [number, number]; // [lat, lng]
  toll_cost: number; // USD
  avg_wait_minutes: number;
  best_time: string;
  peak_hours: string;
  lanes: number;
  length_miles: number;
}

export const MTA_FACILITIES: FacilityPrediction[] = [
  {
    facility_id: 'verrazzano',
    facility_name: 'Verrazzano-Narrows Bridge',
    facility_short: 'Verrazzano',
    facility_type: 'bridge',
    current_volume: 4250,
    predicted_volume_1h: 4800,
    predicted_volume_2h: 5200,
    predicted_volume_4h: 4100,
    capacity: 6000,
    risk_level: 'moderate',
    risk_percentage: 78,
    coordinates: [40.6066, -74.0447],
    toll_cost: 6.88,
    avg_wait_minutes: 12,
    best_time: '10:00 PM',
    peak_hours: '7-9 AM, 4-7 PM',
    lanes: 13,
    length_miles: 2.57,
  },
  {
    facility_id: 'throgs_neck',
    facility_name: 'Throgs Neck Bridge',
    facility_short: 'Throgs Neck',
    facility_type: 'bridge',
    current_volume: 2100,
    predicted_volume_1h: 2500,
    predicted_volume_2h: 2800,
    predicted_volume_4h: 1900,
    capacity: 5500,
    risk_level: 'low',
    risk_percentage: 38,
    coordinates: [40.8053, -73.7935],
    toll_cost: 6.88,
    avg_wait_minutes: 5,
    best_time: '11:00 PM',
    peak_hours: '7-9 AM, 5-7 PM',
    lanes: 6,
    length_miles: 1.77,
  },
  {
    facility_id: 'bronx_whitestone',
    facility_name: 'Bronx-Whitestone Bridge',
    facility_short: 'Whitestone',
    facility_type: 'bridge',
    current_volume: 3200,
    predicted_volume_1h: 3600,
    predicted_volume_2h: 3900,
    predicted_volume_4h: 2800,
    capacity: 5000,
    risk_level: 'moderate',
    risk_percentage: 64,
    coordinates: [40.8050, -73.8285],
    toll_cost: 6.88,
    avg_wait_minutes: 8,
    best_time: '9:30 PM',
    peak_hours: '7-9 AM, 4-7 PM',
    lanes: 6,
    length_miles: 0.47,
  },
  {
    facility_id: 'rfk_triborough',
    facility_name: 'Robert F. Kennedy Bridge',
    facility_short: 'RFK (Triborough)',
    facility_type: 'bridge',
    current_volume: 4800,
    predicted_volume_1h: 5200,
    predicted_volume_2h: 5600,
    predicted_volume_4h: 4200,
    capacity: 6500,
    risk_level: 'high',
    risk_percentage: 85,
    coordinates: [40.7805, -73.9230],
    toll_cost: 6.88,
    avg_wait_minutes: 18,
    best_time: '11:00 PM',
    peak_hours: '6-10 AM, 3-8 PM',
    lanes: 14,
    length_miles: 3.0,
  },
  {
    facility_id: 'hugh_carey',
    facility_name: 'Hugh L. Carey Tunnel',
    facility_short: 'Hugh Carey',
    facility_type: 'tunnel',
    current_volume: 3800,
    predicted_volume_1h: 4100,
    predicted_volume_2h: 4400,
    predicted_volume_4h: 3500,
    capacity: 4800,
    risk_level: 'high',
    risk_percentage: 88,
    coordinates: [40.6892, -74.0145],
    toll_cost: 6.88,
    avg_wait_minutes: 22,
    best_time: '10:30 PM',
    peak_hours: '7-10 AM, 4-7 PM',
    lanes: 4,
    length_miles: 1.73,
  },
  {
    facility_id: 'queens_midtown',
    facility_name: 'Queens-Midtown Tunnel',
    facility_short: 'Queens Midtown',
    facility_type: 'tunnel',
    current_volume: 2900,
    predicted_volume_1h: 3300,
    predicted_volume_2h: 3700,
    predicted_volume_4h: 2600,
    capacity: 4200,
    risk_level: 'moderate',
    risk_percentage: 69,
    coordinates: [40.7440, -73.9570],
    toll_cost: 6.88,
    avg_wait_minutes: 10,
    best_time: '9:00 PM',
    peak_hours: '7-9 AM, 4-7 PM',
    lanes: 4,
    length_miles: 1.26,
  },
  {
    facility_id: 'henry_hudson',
    facility_name: 'Henry Hudson Bridge',
    facility_short: 'Henry Hudson',
    facility_type: 'bridge',
    current_volume: 1200,
    predicted_volume_1h: 1400,
    predicted_volume_2h: 1600,
    predicted_volume_4h: 1100,
    capacity: 3800,
    risk_level: 'low',
    risk_percentage: 32,
    coordinates: [40.8782, -73.9217],
    toll_cost: 3.56,
    avg_wait_minutes: 3,
    best_time: 'Anytime',
    peak_hours: '7-9 AM, 5-7 PM',
    lanes: 7,
    length_miles: 0.32,
  },
  {
    facility_id: 'marine_parkway',
    facility_name: 'Marine Parkway Bridge',
    facility_short: 'Marine Pkwy',
    facility_type: 'bridge',
    current_volume: 800,
    predicted_volume_1h: 900,
    predicted_volume_2h: 1000,
    predicted_volume_4h: 700,
    capacity: 3000,
    risk_level: 'low',
    risk_percentage: 27,
    coordinates: [40.5720, -73.8944],
    toll_cost: 2.75,
    avg_wait_minutes: 2,
    best_time: 'Anytime',
    peak_hours: '8-10 AM, 5-7 PM',
    lanes: 4,
    length_miles: 0.81,
  },
  {
    facility_id: 'cross_bay',
    facility_name: 'Cross Bay Bridge',
    facility_short: 'Cross Bay',
    facility_type: 'bridge',
    current_volume: 950,
    predicted_volume_1h: 1100,
    predicted_volume_2h: 1250,
    predicted_volume_4h: 850,
    capacity: 3200,
    risk_level: 'low',
    risk_percentage: 30,
    coordinates: [40.6024, -73.8210],
    toll_cost: 2.75,
    avg_wait_minutes: 2,
    best_time: 'Anytime',
    peak_hours: '8-10 AM, 5-7 PM',
    lanes: 4,
    length_miles: 0.62,
  },
];

/** Simulate dynamic traffic fluctuations */
export function getSimulatedPredictions(): FacilityPrediction[] {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();

  return MTA_FACILITIES.map((facility) => {
    // Time-based traffic multiplier (peaks at rush hours)
    const morningPeak = Math.exp(-0.5 * Math.pow((hour - 8) / 1.5, 2));
    const eveningPeak = Math.exp(-0.5 * Math.pow((hour - 17.5) / 2, 2));
    const timeFactor = 0.3 + 0.7 * Math.max(morningPeak, eveningPeak);

    // Random jitter per facility (seeded by minute + facility id)
    const seed = (minute * 7 + facility.facility_id.length * 13) % 100;
    const jitter = 0.9 + (seed / 100) * 0.2;

    const currentVol = Math.round(facility.capacity * timeFactor * jitter * 0.7);
    const vol1h = Math.round(currentVol * (1 + 0.1 * Math.sin(minute / 5)));
    const vol2h = Math.round(currentVol * (1 + 0.15 * Math.cos(minute / 3)));
    const vol4h = Math.round(currentVol * (1 - 0.1 * Math.sin(minute / 7)));

    const riskPct = Math.min(99, Math.max(5, Math.round((currentVol / facility.capacity) * 100)));
    const riskLevel: FacilityPrediction['risk_level'] =
      riskPct < 50 ? 'low' : riskPct < 80 ? 'moderate' : 'high';

    const waitMins = riskPct < 50 ? Math.round(riskPct * 0.1) : riskPct < 80 ? Math.round(riskPct * 0.2) : Math.round(riskPct * 0.3);

    return {
      ...facility,
      current_volume: currentVol,
      predicted_volume_1h: vol1h,
      predicted_volume_2h: vol2h,
      predicted_volume_4h: vol4h,
      risk_level: riskLevel,
      risk_percentage: riskPct,
      avg_wait_minutes: waitMins,
    };
  });
}

/** Risk level color */
export function getRiskColor(level: FacilityPrediction['risk_level']): string {
  switch (level) {
    case 'low': return '#00E676';
    case 'moderate': return '#FFD600';
    case 'high': return '#FF5252';
  }
}

/** Risk level gradient for gauges */
export function getRiskGradient(level: FacilityPrediction['risk_level']): string {
  switch (level) {
    case 'low': return 'linear-gradient(135deg, #00E676, #00C853)';
    case 'moderate': return 'linear-gradient(135deg, #FFD600, #FF9100)';
    case 'high': return 'linear-gradient(135deg, #FF5252, #D50000)';
  }
}
