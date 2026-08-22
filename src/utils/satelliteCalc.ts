import * as satellite from 'satellite.js';
import { SatellitePreset, ObserverLocation, SatelliteState, TleInfo, SatellitePass } from '../types';

// Simplified World Map Coordinates for elegant canvas vector drawing
export const WORLD_CONTINENTS: [number, number][][] = [
  // North & South America combined/simplified outline
  [
    [-168, 65], [-120, 70], [-80, 75], [-60, 60], [-50, 45], [-35, -5],
    [-40, -20], [-70, -55], [-75, -45], [-80, -20], [-80, 9], [-99, 16],
    [-115, 30], [-125, 48], [-168, 65]
  ],
  // Greenland
  [
    [-70, 75], [-60, 83], [-10, 80], [-40, 60], [-70, 75]
  ],
  // Africa
  [
    [-17, 32], [30, 31], [33, 27], [50, 12], [40, -20], [20, -34],
    [10, -10], [-10, 5], [-17, 15], [-17, 32]
  ],
  // Madagascar
  [
    [45, -12], [50, -15], [47, -25], [43, -25], [45, -12]
  ],
  // Eurasia (Europe + Asia)
  [
    [30, 31], [35, 40], [25, 40], [-10, 36], [-10, 50], [10, 60],
    [20, 70], [40, 75], [100, 78], [170, 70], [180, 65], [180, 35],
    [130, 35], [120, 20], [110, 10], [95, 10], [75, 10], [60, 25],
    [45, 15], [30, 31]
  ],
  // India (Subcontinent detail)
  [
    [70, 23], [78, 8], [88, 22], [88, 26], [70, 23]
  ],
  // Australia
  [
    [113, -25], [113, -35], [140, -37], [150, -33], [143, -15],
    [130, -12], [113, -25]
  ],
  // UK & Ireland
  [
    [-5, 50], [-5, 58], [2, 55], [-5, 50]
  ],
  // Japan
  [
    [130, 30], [140, 40], [145, 40], [135, 30], [130, 30]
  ],
  // New Zealand
  [
    [166, -45], [178, -37], [174, -41], [166, -45]
  ],
  // Antarctica
  [
    [-180, -75], [180, -75], [180, -85], [-180, -85], [-180, -75]
  ]
];

// High-quality realistic preset TLE data
export const SATELLITE_PRESETS: SatellitePreset[] = [
  {
    id: 'astrosat',
    name: 'AstroSat (ISRO Space Obs)',
    line1: '1 40930U 15052A   24083.47513889  .00000214  00000-0  10000-4 0  9991',
    line2: '2 40930   6.0024  85.4128 0012485 240.1285 120.0412 14.8541284534125',
    description: "India's first dedicated multi-wavelength space observatory operated by ISRO. Observes the universe in optical, ultraviolet, and low/high energy X-ray bands simultaneously.",
    category: 'ISRO Scientific'
  },
  {
    id: 'cartosat3',
    name: 'Cartosat-3 (ISRO Imaging)',
    line1: '1 44804U 19081A   24083.54166667  .00000155  00000-0  15421-4 0  9994',
    line2: '2 44804  97.4512 284.1549 0001524 110.1285 250.0125 14.81525618 2156',
    description: "ISRO's third-generation agile advanced earth observation satellite with incredibly high-resolution imaging capabilities. Serves urban planning, resource management, and cartography.",
    category: 'ISRO Earth Obs'
  },
  {
    id: 'eos04',
    name: 'EOS-04 (ISRO Radar Weather)',
    line1: '1 51656U 22013A   24083.51862955  .00000108  00000-0  21425-4 0  9993',
    line2: '2 51656  97.4125 120.2145 0001245  85.4128 274.9125 14.8214254111245',
    description: 'An ISRO Radar Imaging Satellite (RISAT) designed to provide high-quality, all-weather images for agricultural monitoring, forestry, hydrology, and flood mapping.',
    category: 'ISRO Earth Obs'
  },
  {
    id: 'insat3dr',
    name: 'INSAT-3DR (ISRO Geostationary)',
    line1: '1 39236U 13044A   24083.43851505  .00000003  00000-0  00000-0 0  9991',
    line2: '2 39236   0.0215  74.0456 0001154  89.4182 254.1284  1.00273854 2684',
    description: 'Advanced geostationary meteorological satellite of India carrying a multi-spectral Imager and an Atmospheric Sounder to track weather over the Indian subcontinent.',
    category: 'ISRO Meteorological'
  },
  {
    id: 'iss',
    name: 'ISS (Zarya)',
    line1: '1 25544U 98067A   24083.56149176  .00015540  00000-0  27918-3 0  9990',
    line2: '2 25544  51.6417 141.0185 0005705  59.0435  87.2064 15.4947935444520',
    description: 'The International Space Station, a habitable artificial satellite in low Earth orbit. Extremely bright, easy to spot with the naked eye.',
    category: 'Space Stations'
  },
  {
    id: 'hubble',
    name: 'Hubble Space Telescope',
    line1: '1 20580U 90037A   24083.50428583  .00001428  00000-0  90847-4 0  9997',
    line2: '2 20580  28.4691 149.3364 0002882 144.1751 215.9388 15.0028795785002',
    description: 'The legendary space observatory launched in 1990. Orbiting higher than the ISS, Hubble provides clear views of distant galaxies.',
    category: 'Scientific'
  },
  {
    id: 'gps',
    name: 'GPS BIIRM-4 (Navigation)',
    line1: '1 29601U 06052A   24083.21850125  .00000036  00000-0  00000-0 0  9993',
    line2: '2 29601  55.5182 225.1285 0051834  34.1285 326.1549  2.0056184212762',
    description: 'Global Positioning System (GPS) satellite in a Medium Earth Orbit (MEO) at ~20,200 km, providing precise navigation signals globally.',
    category: 'Navigation'
  }
];

// Parser of standard Two-Line Element sets
export function parseTle(name: string, line1: string, line2: string): TleInfo {
  const noradId = line1.substring(2, 7).trim();
  const classification = (line1.substring(7, 8) as 'U' | 'C' | 'S') || 'U';
  const intlDesignator = line1.substring(9, 17).trim();
  
  // Epoch translation (YYDDD.DDDDDDDD)
  const epochYrStr = line1.substring(18, 20).trim();
  const epochDaysStr = line1.substring(20, 32).trim();
  const yr = parseInt(epochYrStr);
  const fullYear = yr < 57 ? 2000 + yr : 1900 + yr;
  const days = parseFloat(epochDaysStr);
  
  const epochDate = new Date(Date.UTC(fullYear, 0, 1));
  // Set day (1-indexed, so we subtract 1 and set UTC date, then add fractional day ms)
  epochDate.setUTCDate(1 + Math.floor(days - 1));
  const fractionalDay = days - Math.floor(days);
  const msInDay = fractionalDay * 24 * 60 * 60 * 1000;
  epochDate.setTime(epochDate.getTime() + msInDay);

  const inclination = parseFloat(line2.substring(8, 16).trim());
  const raan = parseFloat(line2.substring(17, 25).trim());
  
  // Eccentricity (with implied leading decimal point)
  const eccRaw = line2.substring(26, 33).trim();
  const eccentricity = parseFloat('0.' + eccRaw);
  
  const argPerigee = parseFloat(line2.substring(34, 42).trim());
  const meanAnomaly = parseFloat(line2.substring(43, 51).trim());
  const meanMotion = parseFloat(line2.substring(52, 63).trim());
  const revAtEpoch = parseInt(line2.substring(63, 68).trim()) || 0;

  return {
    name,
    noradId,
    classification,
    intlDesignator,
    epoch: epochDate,
    inclination,
    raan,
    eccentricity,
    argPerigee,
    meanAnomaly,
    meanMotion,
    revAtEpoch
  };
}

// Compute the Position of the Sun in ECI coordinates (km)
// Uses standard geocentric solar approximation formulas
export function getSunPosition(date: Date): { x: number; y: number; z: number } {
  const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0)).getTime();
  const daysSinceJ2000 = (date.getTime() - J2000) / (24 * 60 * 60 * 1000);
  
  // Mean anomaly of the Sun
  const g = (357.529 + 0.98560028 * daysSinceJ2000) * Math.PI / 180;
  // Mean longitude of the Sun
  const q = (280.459 + 0.98564736 * daysSinceJ2000) * Math.PI / 180;
  // Geocentric apparent ecliptic longitude
  const L = q + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;
  
  // Obliquity of the Ecliptic
  const e = (23.439 - 0.00000036 * daysSinceJ2000) * Math.PI / 180;
  
  // Distance of Sun from Earth (km) (~1 AU)
  const R = (1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g)) * 149597870.7;
  
  return {
    x: R * Math.cos(L),
    y: R * Math.sin(L) * Math.cos(e),
    z: R * Math.sin(L) * Math.sin(e)
  };
}

// Check if satellite is in Earth's shadow (Eclipse)
// Models the Earth as a sphere of radius 6371km and Sun's rays as parallel
export function isSatelliteSunlit(
  satPosEci: { x: number; y: number; z: number },
  sunPosEci: { x: number; y: number; z: number }
): boolean {
  const satPosMag = Math.sqrt(satPosEci.x ** 2 + satPosEci.y ** 2 + satPosEci.z ** 2);
  const sunPosMag = Math.sqrt(sunPosEci.x ** 2 + sunPosEci.y ** 2 + sunPosEci.z ** 2);
  
  if (satPosMag === 0 || sunPosMag === 0) return true;
  
  const uSunX = sunPosEci.x / sunPosMag;
  const uSunY = sunPosEci.y / sunPosMag;
  const uSunZ = sunPosEci.z / sunPosMag;
  
  // Projection of satellite position along Earth-Sun vector
  const dotProd = satPosEci.x * uSunX + satPosEci.y * uSunY + satPosEci.z * uSunZ;
  
  // If satellite is on the Sun-facing side of Earth, it's definitely sunlit
  if (dotProd >= 0) return true;
  
  // If on the dark side, compute the perpendicular distance to the Sun-Earth line
  const distPerp = Math.sqrt(satPosMag ** 2 - dotProd ** 2);
  const EARTH_RADIUS = 6371.0; // km
  
  // If perpendicular distance is less than Earth's radius, it is in shadow
  return distPerp >= EARTH_RADIUS;
}

export const DEFAULT_OBSERVER: ObserverLocation = {
  lat: 13.03,
  lon: 77.51,
  alt: 920,
  name: 'ISTRAC Bengaluru'
};

// Compute the complete state of a satellite from its TLE
export function calculateSatelliteState(
  line1: string,
  line2: string,
  date: Date,
  observer?: ObserverLocation | null
): SatelliteState | null {
  try {
    const satrec = satellite.twoline2satrec(line1, line2);
    const positionAndVelocity = satellite.propagate(satrec, date);
    
    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;
    
    if (typeof positionEci === 'boolean' || typeof velocityEci === 'boolean' || !positionEci || !velocityEci) {
      return null;
    }
    
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci as satellite.EciVec3<number>, gmst);
    
    const lon = satellite.degreesLong(positionGd.longitude);
    const lat = satellite.degreesLat(positionGd.latitude);
    const alt = positionGd.height; // in km
    
    const speed = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );
    
    // Observer Look Angles (Azimuth, Elevation, Range) with safe fallback
    const validObserver = (observer && typeof observer.lat === 'number' && typeof observer.lon === 'number')
      ? observer
      : DEFAULT_OBSERVER;

    const observerGd = {
      latitude: satellite.degreesToRadians(validObserver.lat),
      longitude: satellite.degreesToRadians(validObserver.lon),
      height: (typeof validObserver.alt === 'number' ? validObserver.alt : 0) / 1000 // Convert meters to km
    };
    
    const positionEcf = satellite.eciToEcf(positionEci as satellite.EciVec3<number>, gmst);
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);
    
    const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
    const elevation = satellite.radiansToDegrees(lookAngles.elevation);
    const range = lookAngles.rangeSat; // in km
    
    // Sunlit check
    const sunPos = getSunPosition(date);
    const sunlit = isSatelliteSunlit(positionEci, sunPos);
    
    return {
      time: date,
      lat,
      lon,
      alt,
      speed,
      positionEci: { x: positionEci.x, y: positionEci.y, z: positionEci.z },
      velocityEci: { x: velocityEci.x, y: velocityEci.y, z: velocityEci.z },
      azimuth,
      elevation,
      range,
      visible: elevation > 0,
      sunlit
    };
  } catch (err) {
    console.error('Error calculating satellite state', err);
    return null;
  }
}

// Generate the ground track orbit points for plotting
// e.g., propagates points into the past and future to show the path on the 2D map
export function generateGroundTrack(
  line1: string,
  line2: string,
  baseDate: Date,
  numMinutesBack: number = 45,
  numMinutesForward: number = 90,
  stepSeconds: number = 60
): { lat: number; lon: number; time: Date; isFuture: boolean }[] {
  const points: { lat: number; lon: number; time: Date; isFuture: boolean }[] = [];
  
  try {
    const satrec = satellite.twoline2satrec(line1, line2);
    
    // Past path
    for (let s = -numMinutesBack * 60; s < 0; s += stepSeconds) {
      const date = new Date(baseDate.getTime() + s * 1000);
      const pv = satellite.propagate(satrec, date);
      if (pv.position && typeof pv.position !== 'boolean') {
        const gmst = satellite.gstime(date);
        const gd = satellite.eciToGeodetic(pv.position as satellite.EciVec3<number>, gmst);
        points.push({
          lat: satellite.degreesLat(gd.latitude),
          lon: satellite.degreesLong(gd.longitude),
          time: date,
          isFuture: false
        });
      }
    }
    
    // Future path
    for (let s = 0; s <= numMinutesForward * 60; s += stepSeconds) {
      const date = new Date(baseDate.getTime() + s * 1000);
      const pv = satellite.propagate(satrec, date);
      if (pv.position && typeof pv.position !== 'boolean') {
        const gmst = satellite.gstime(date);
        const gd = satellite.eciToGeodetic(pv.position as satellite.EciVec3<number>, gmst);
        points.push({
          lat: satellite.degreesLat(gd.latitude),
          lon: satellite.degreesLong(gd.longitude),
          time: date,
          isFuture: true
        });
      }
    }
  } catch (err) {
    console.error('Error generating ground track', err);
  }
  
  return points;
}

// Calculate the footprint radius of the satellite on Earth's surface (km)
// Representing the horizon of coverage from the satellite's viewpoint
export function calculateFootprintRadius(altitudeKm: number): number {
  const EARTH_RADIUS = 6371.0; // km
  // Central angle theta of satellite visibility cone
  const cosTheta = EARTH_RADIUS / (EARTH_RADIUS + altitudeKm);
  const theta = Math.acos(cosTheta); // radians
  // Arc length (distance on sphere surface)
  return EARTH_RADIUS * theta; // km
}

// Estimate the displaced camera footprint center and radius based on simulated pitch & roll offsets
export function calculateSensorFootprint(
  satLat: number,
  satLon: number,
  satAlt: number,
  pitchDeg: number, // positive = forward
  rollDeg: number,  // positive = right (East for descending/ascending, etc.)
  sensorFovHalfDeg: number = 10
): { centerLat: number; centerLon: number; radiusKm: number } {
  // Convert offset angles to estimated ground distances
  // Displacement on surface (linear approximations for normal altitudes)
  const pitchRad = (pitchDeg * Math.PI) / 180;
  const rollRad = (rollDeg * Math.PI) / 180;
  
  // Approximate linear shift on surface (H * tan(offset))
  const dy = satAlt * Math.tan(pitchRad); // North-South shift (approx)
  const dx = satAlt * Math.tan(rollRad);  // East-West shift (approx)
  
  // Convert km shift to degrees latitude & longitude
  // 1 degree lat ≈ 111 km
  const deltaLat = dy / 111.0;
  // 1 degree lon ≈ 111 km * cos(lat)
  const latRad = (satLat * Math.PI) / 180;
  const deltaLon = dx / (111.0 * Math.cos(latRad) || 1);
  
  const centerLat = Math.min(90, Math.max(-90, satLat + deltaLat));
  let centerLon = satLon + deltaLon;
  if (centerLon > 180) centerLon -= 360;
  if (centerLon < -180) centerLon += 360;
  
  // Footprint swath radius
  const fovRad = (sensorFovHalfDeg * Math.PI) / 180;
  // Simple slant range radius of footprint
  const radiusKm = satAlt * Math.tan(fovRad);
  
  return {
    centerLat,
    centerLon,
    radiusKm
  };
}

// Predict satellite passes for the next lookaheadHours over a given ground station
export function predictSatellitePasses(
  line1: string,
  line2: string,
  observer?: ObserverLocation | null,
  startDate: Date = new Date(),
  lookaheadHours: number = 24
): SatellitePass[] {
  const passes: SatellitePass[] = [];
  try {
    const validObserver = (observer && typeof observer.lat === 'number' && typeof observer.lon === 'number')
      ? observer
      : DEFAULT_OBSERVER;

    const satrec = satellite.twoline2satrec(line1, line2);
    const observerGd = {
      latitude: satellite.degreesToRadians(validObserver.lat),
      longitude: satellite.degreesToRadians(validObserver.lon),
      height: (typeof validObserver.alt === 'number' ? validObserver.alt : 0) / 1000 // Convert meters to km
    };

    const startMs = startDate.getTime();
    const endMs = startMs + lookaheadHours * 60 * 60 * 1000;
    const stepMs = 60 * 1000; // 1 minute search step
    
    let currentMs = startMs;
    let insidePass = false;
    let passPoints: { time: Date; elevation: number; azimuth: number }[] = [];

    while (currentMs <= endMs) {
      const date = new Date(currentMs);
      const look = getLookAnglesAtTimeHelper(satrec, date, observerGd);

      if (look) {
        const isAboveHorizon = look.elevation > 0;
        if (isAboveHorizon) {
          if (!insidePass) {
            // Just entered a pass! Let's do a sub-scan to find the precise rise time
            insidePass = true;
            passPoints = [];
            
            // Search back in 10s increments for the rise time
            let riseMs = currentMs;
            for (let subMs = currentMs - stepMs; subMs <= currentMs; subMs += 10000) {
              const subDate = new Date(subMs);
              const subLook = getLookAnglesAtTimeHelper(satrec, subDate, observerGd);
              if (subLook && subLook.elevation >= 0) {
                riseMs = subMs;
                break;
              }
            }
            // Add initial point
            const riseDate = new Date(riseMs);
            const riseLook = getLookAnglesAtTimeHelper(satrec, riseDate, observerGd) || look;
            passPoints.push({ time: riseDate, elevation: riseLook.elevation, azimuth: riseLook.azimuth });
          }
          
          // Add current step to pass points
          passPoints.push({ time: date, elevation: look.elevation, azimuth: look.azimuth });
        } else {
          if (insidePass) {
            // Just exited a pass! Let's find precise set time
            insidePass = false;
            
            let setMs = currentMs;
            for (let subMs = currentMs - stepMs; subMs <= currentMs; subMs += 10000) {
              const subDate = new Date(subMs);
              const subLook = getLookAnglesAtTimeHelper(satrec, subDate, observerGd);
              if (subLook && subLook.elevation < 0) {
                setMs = subMs;
                break;
              }
            }
            const setDate = new Date(setMs);
            const setLook = getLookAnglesAtTimeHelper(satrec, setDate, observerGd) || look;
            passPoints.push({ time: setDate, elevation: setLook.elevation, azimuth: setLook.azimuth });

            // Now construct the pass details from our recorded points
            if (passPoints.length >= 2) {
              let maxEl = -999;
              let peakTime = passPoints[0].time;
              passPoints.forEach(pt => {
                if (pt.elevation > maxEl) {
                  maxEl = pt.elevation;
                  peakTime = pt.time;
                }
              });

              const riseTime = passPoints[0].time;
              const setTime = passPoints[passPoints.length - 1].time;
              const durationSeconds = Math.round((setTime.getTime() - riseTime.getTime()) / 1000);

              // We only count passes that have a meaningful duration and max elevation (e.g. > 1 degree)
              if (durationSeconds > 30 && maxEl > 1) {
                passes.push({
                  id: `pass-${riseTime.getTime()}`,
                  riseTime,
                  peakTime,
                  setTime,
                  maxElevation: maxEl,
                  durationSeconds,
                  startAzimuth: passPoints[0].azimuth,
                  endAzimuth: passPoints[passPoints.length - 1].azimuth
                });
              }
            }
            
            passPoints = [];
          }
        }
      }
      currentMs += stepMs;
    }
  } catch (err) {
    console.error('Error in predictSatellitePasses', err);
  }
  return passes;
}

function getLookAnglesAtTimeHelper(
  satrec: satellite.SatRec,
  date: Date,
  observerGd: { latitude: number; longitude: number; height: number }
) {
  const pv = satellite.propagate(satrec, date);
  if (!pv.position || typeof pv.position === 'boolean') return null;
  const gmst = satellite.gstime(date);
  const positionEcf = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gmst);
  const look = satellite.ecfToLookAngles(observerGd, positionEcf);
  return {
    azimuth: satellite.radiansToDegrees(look.azimuth),
    elevation: satellite.radiansToDegrees(look.elevation)
  };
}

