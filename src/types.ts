export interface SatellitePreset {
  id: string;
  name: string;
  line1: string;
  line2: string;
  description: string;
  category: string;
}

export interface ObserverLocation {
  lat: number;
  lon: number;
  alt: number; // in meters
  name: string;
}

export interface SatelliteState {
  time: Date;
  lat: number; // degrees -90 to 90
  lon: number; // degrees -180 to 180
  alt: number; // km
  speed: number; // km/s
  positionEci: { x: number; y: number; z: number }; // km
  velocityEci: { x: number; y: number; z: number }; // km/s
  azimuth: number; // degrees 0 to 360
  elevation: number; // degrees -90 to 90
  range: number; // km
  visible: boolean; // is visible to observer (elevation > 0)
  sunlit: boolean; // is satellite illuminated by the sun
}

export interface TleInfo {
  name: string;
  noradId: string;
  classification: 'U' | 'C' | 'S'; // Unclassified, Classified, Secret
  intlDesignator: string;
  epoch: Date;
  inclination: number; // degrees
  raan: number; // Right Ascension of Ascending Node (degrees)
  eccentricity: number;
  argPerigee: number; // Argument of Perigee (degrees)
  meanAnomaly: number; // degrees
  meanMotion: number; // revs/day
  revAtEpoch: number;
}

export interface SatellitePass {
  id: string;
  riseTime: Date;
  peakTime: Date;
  setTime: Date;
  maxElevation: number; // degrees
  durationSeconds: number;
  startAzimuth: number; // degrees
  endAzimuth: number; // degrees
}

