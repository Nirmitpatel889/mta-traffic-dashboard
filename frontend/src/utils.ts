import type { GpsPoint } from './types';

/** Haversine distance in meters between two points */
export function haversineDistance(a: GpsPoint | { lat: number; lng: number }, b: GpsPoint | { lat: number; lng: number }): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  const straightLineMeters = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return straightLineMeters * 1.4; // 1.4x multiplier for NYC grid driving (Manhattan distance)
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Format meters to km or miles */
export function formatDistance(meters: number, unit: 'km' | 'mi' = 'mi'): string {
  if (unit === 'mi') {
    const miles = meters / 1609.344;
    return miles < 0.01 ? '0.00' : miles.toFixed(2);
  }
  const km = meters / 1000;
  return km < 0.01 ? '0.00' : km.toFixed(2);
}

/** Format m/s to mph */
export function formatSpeed(mps: number | null): string {
  if (mps === null || mps < 0) return '0.0';
  return (mps * 2.237).toFixed(1); // Convert to mph
}

/** Get speed color class */
export function getSpeedClass(mps: number | null): string {
  if (mps === null || mps < 0.5) return 'speed-idle';
  const mph = mps * 2.237;
  if (mph < 10) return 'speed-slow';
  if (mph < 35) return 'speed-medium';
  return 'speed-fast';
}

/** Format seconds to HH:MM:SS */
export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Format heading to compass direction */
export function formatHeading(deg: number | null): string {
  if (deg === null) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(deg / 45) % 8;
  return `${dirs[idx]} ${Math.round(deg)}°`;
}

/** Format accuracy to human-readable */
export function formatAccuracy(meters: number): { label: string; color: string } {
  if (meters <= 5) return { label: `±${meters.toFixed(0)}m`, color: '#00E676' };
  if (meters <= 15) return { label: `±${meters.toFixed(0)}m`, color: '#FFD600' };
  return { label: `±${meters.toFixed(0)}m`, color: '#FF5252' };
}

/** Calculate ETA in minutes given driving distance in meters (assumes ~12 mph avg city driving with congestion) */
export function calculateEta(distanceMeters: number): number {
  const avgSpeedMps = 5.36; // ~12 mph realistic NYC speed
  return Math.round((distanceMeters / avgSpeedMps) / 60);
}

/** Export trail as GPX string */
export function exportGpx(trail: GpsPoint[]): string {
  const now = new Date().toISOString();
  const trkpts = trail
    .map((p) => {
      const time = new Date(p.timestamp).toISOString();
      return `      <trkpt lat="${p.lat}" lon="${p.lng}">
        ${p.altitude !== null ? `<ele>${p.altitude.toFixed(1)}</ele>` : ''}
        <time>${time}</time>
        ${p.speed !== null ? `<speed>${p.speed.toFixed(2)}</speed>` : ''}
      </trkpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="MTA Traffic Intelligence Dashboard"
     xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>MTA Route Track</name>
    <time>${now}</time>
  </metadata>
  <trk>
    <name>Track ${now}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

/** Export facility data as CSV */
export function exportFacilitiesCsv(data: Array<{ name: string; volume: number; capacity: number; risk: number; eta: number }>): string {
  const headers = 'Facility,Current Volume,Capacity,Risk %,ETA (min)';
  const rows = data.map((d) => `"${d.name}",${d.volume},${d.capacity},${d.risk},${d.eta}`);
  return [headers, ...rows].join('\n');
}

/** Trigger a file download */
export function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/** Get relative time label */
export function getTimeLabel(): string {
  const now = new Date();
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
}
