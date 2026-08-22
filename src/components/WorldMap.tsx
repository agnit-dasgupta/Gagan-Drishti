import React, { useRef, useEffect, useState } from 'react';
import { WORLD_CONTINENTS } from '../utils/satelliteCalc';
import { ObserverLocation, SatelliteState } from '../types';

interface WorldMapProps {
  satelliteState: SatelliteState | null;
  groundTrack: { lat: number; lon: number; isFuture: boolean }[];
  observer: ObserverLocation;
  setObserver: (obs: ObserverLocation) => void;
  sensorFootprint: { centerLat: number; centerLon: number; radiusKm: number } | null;
}

export default function WorldMap({
  satelliteState,
  groundTrack,
  observer,
  setObserver,
  sensorFootprint
}: WorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Handle Resize using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      if (width < 100) return;
      const newWidth = Math.floor(width);
      const newHeight = Math.floor(newWidth / 2);

      setDimensions((prev) => {
        if (prev.width === newWidth && prev.height === newHeight) return prev;
        return {
          width: newWidth,
          height: newHeight
        };
      });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Conversion: Longitude to Canvas X
  const lonToX = (lon: number, width: number) => {
    // lon is -180 to 180. Map to 0 to width.
    return ((lon + 180) / 360) * width;
  };

  // Conversion: Latitude to Canvas Y
  const latToY = (lat: number, height: number) => {
    // lat is -90 to 90. Map to height to 0 (top of canvas is lat 90).
    return ((90 - lat) / 180) * height;
  };

  // Conversion: Canvas X to Longitude
  const xToLon = (x: number, width: number) => {
    return (x / width) * 360 - 180;
  };

  // Conversion: Canvas Y to Latitude
  const yToLat = (y: number, height: number) => {
    return 90 - (y / height) * 180;
  };

  // Handle click on map to set Observer Location
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedLon = Math.round(xToLon(x, dimensions.width) * 100) / 100;
    const clickedLat = Math.round(yToLat(y, dimensions.height) * 100) / 100;

    setObserver({
      name: `Custom Location (${clickedLat >= 0 ? clickedLat + '°N' : Math.abs(clickedLat) + '°S'}, ${clickedLon >= 0 ? clickedLon + '°E' : Math.abs(clickedLon) + '°W'})`,
      lat: clickedLat,
      lon: clickedLon,
      alt: observer.alt // keep same altitude
    });
  };

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    // Clear background
    ctx.fillStyle = '#05060a'; // dark deep space black-blue
    ctx.fillRect(0, 0, width, height);

    // Draw Lon/Lat grid lines (Graticules) every 30 degrees
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
    ctx.lineWidth = 1;
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';

    // Longitude lines
    for (let lon = -150; lon <= 150; lon += 30) {
      const x = lonToX(lon, width);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Longitude labels
      ctx.fillText(`${Math.abs(lon)}°${lon >= 0 ? 'E' : 'W'}`, x + 2, height - 6);
    }

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = latToY(lat, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Latitude labels
      ctx.fillText(`${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}`, 4, y - 2);
    }

    // Draw Continents
    ctx.fillStyle = '#0a1024'; // slate indigo land
    ctx.strokeStyle = '#112244'; // deep neon outline
    ctx.lineWidth = 1.2;

    WORLD_CONTINENTS.forEach((polygon) => {
      ctx.beginPath();
      polygon.forEach((pt, idx) => {
        const px = lonToX(pt[0], width);
        const py = latToY(pt[1], height);
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Draw Observer's visibility circle (where elevation > 0)
    // For general Low Earth Orbit, observer footprint is roughly a circle of 1500km to 2500km radius on surface
    // Let's compute the visual circle in pixels. 1 deg on Earth surface is ~111km.
    // At equator, 1 degree longitude is ~111km. Let's approximate the footprint circle:
    if (satelliteState) {
      // Draw Observer Footprint (approx 2000km coverage circle on earth)
      // Visually, the maximum range at which satellite is above horizon (elevation > 0) is:
      // theta = acos(Re / (Re + H))
      const H = satelliteState.alt;
      const Re = 6371.0;
      const theta = Math.acos(Re / (Re + H)); // central angle in radians
      const footprintRadiusDegrees = (theta * 180) / Math.PI;

      const obsX = lonToX(observer.lon, width);
      const obsY = latToY(observer.lat, height);
      
      // Since map projection is equirectangular, circles distort near poles, 
      // but for visualization simplicity, we draw an ellipse or simple circle, keeping it extremely responsive.
      const radiusX = (footprintRadiusDegrees / 360) * width;
      const radiusY = (footprintRadiusDegrees / 180) * height;

      ctx.beginPath();
      // Draw a dotted yellow circle for observer visibility limit
      ctx.ellipse(obsX, obsY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.2)'; // amber
      ctx.fillStyle = 'rgba(234, 179, 8, 0.03)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash
    }

    // Draw Ground Track path
    if (groundTrack.length > 0) {
      // We must split the ground track lines if they cross the anti-meridian (180 to -180)
      // to avoid weird lines going across the whole canvas.
      const segments: { lat: number; lon: number; isFuture: boolean }[][] = [[]];
      let currentSegIdx = 0;

      for (let i = 0; i < groundTrack.length; i++) {
        const pt = groundTrack[i];
        const prevPt = groundTrack[i - 1];

        if (prevPt && Math.abs(pt.lon - prevPt.lon) > 180) {
          // Meridian crossing! Start new segment
          segments.push([]);
          currentSegIdx++;
        }
        segments[currentSegIdx].push(pt);
      }

      // Draw each segment
      segments.forEach((segment) => {
        if (segment.length < 2) return;

        // Future path vs past path
        const isFutureSegment = segment[0].isFuture;

        ctx.beginPath();
        segment.forEach((pt, idx) => {
          const px = lonToX(pt.lon, width);
          const py = latToY(pt.lat, height);
          if (idx === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });

        if (isFutureSegment) {
          ctx.strokeStyle = '#10b981'; // solid emerald for upcoming track
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)'; // faded emerald for past track
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]); // reset
        }
      });
    }

    // Draw Sensor Footprint (Displaced scanning footprint based on simulated Pitch/Roll)
    if (sensorFootprint) {
      const centX = lonToX(sensorFootprint.centerLon, width);
      const centY = latToY(sensorFootprint.centerLat, height);
      
      // Calculate footprint radius in degrees
      // Earth circumfrence is ~40075 km (360 degrees) -> 1 degree ≈ 111.3 km
      const radiusDegrees = sensorFootprint.radiusKm / 111.3;
      const rx = (radiusDegrees / 360) * width;
      const ry = (radiusDegrees / 180) * height;

      ctx.beginPath();
      ctx.ellipse(centX, centY, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#f43f5e'; // vibrant rose/coral for scanning
      ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }

    // Draw Satellite Footprint (Sub-satellite point coverage)
    if (satelliteState) {
      // Calculate footprint radius in degrees
      const footprintRadiusDegrees = (Math.acos(6371.0 / (6371.0 + satelliteState.alt)) * 180) / Math.PI;
      const satX = lonToX(satelliteState.lon, width);
      const satY = latToY(satelliteState.lat, height);

      const srx = (footprintRadiusDegrees / 360) * width;
      const sry = (footprintRadiusDegrees / 180) * height;

      ctx.beginPath();
      ctx.ellipse(satX, satY, srx, sry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.25)'; // sky blue outline
      ctx.fillStyle = 'rgba(14, 165, 233, 0.05)'; // faint blue filling
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      // Sub-satellite point indicator (pulsing point)
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8'; // glowing sky blue
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow
    }

    // Draw Observer target
    const obsLon = observer && typeof observer.lon === 'number' ? observer.lon : 77.51;
    const obsLat = observer && typeof observer.lat === 'number' ? observer.lat : 13.03;
    const obsX = lonToX(obsLon, width);
    const obsY = latToY(obsLat, height);

    ctx.beginPath();
    ctx.arc(obsX, obsY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // glowing amber
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Draw crosshair around observer
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(obsX - 10, obsY);
    ctx.lineTo(obsX + 10, obsY);
    ctx.moveTo(obsX, obsY - 10);
    ctx.lineTo(obsX, obsY + 10);
    ctx.stroke();

    // Draw Satellite pulsing marker on top of track
    if (satelliteState) {
      const satX = lonToX(satelliteState.lon, width);
      const satY = latToY(satelliteState.lat, height);

      // Pulse ring based on milliseconds
      const pulseSize = 10 + (Date.now() % 1000) / 100;

      ctx.strokeStyle = 'rgba(14, 165, 233, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(satX, satY, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Main satellite icon (diamond or cross indicator)
      ctx.fillStyle = '#06b6d4'; // bright cyan
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(satX, satY - 6);
      ctx.lineTo(satX + 6, satY);
      ctx.lineTo(satX, satY + 6);
      ctx.lineTo(satX - 6, satY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Solar panel wings
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(satX - 12, satY);
      ctx.lineTo(satX - 6, satY);
      ctx.moveTo(satX + 6, satY);
      ctx.lineTo(satX + 12, satY);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(
        satelliteState.visible ? '📡 VISIBLE' : '🛰️ ACTIVE',
        satX + 14,
        satY + 3
      );
    }
  }, [dimensions, satelliteState, groundTrack, observer, sensorFootprint]);

  return (
    <div className="w-full flex flex-col bg-[#0a0c16] border border-cyan-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)]">
      <div className="px-5 py-4 bg-[#0a0c16] border-b border-cyan-900/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-ping"></div>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Ground Track & Footprints Map
          </span>
        </div>
        <span className="font-mono text-[10px] text-cyan-600 hidden sm:inline">
          Click map to position observer ground station
        </span>
      </div>

      <div ref={containerRef} className="w-full relative bg-[#05060a]">
        <canvas
          id="global-radar-map"
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleMapClick}
          className="block cursor-crosshair hover:brightness-110 transition-all duration-300"
        />
      </div>

      <div className="px-5 py-3 bg-[#0a0c16]/50 border-t border-cyan-900/30 flex flex-wrap gap-x-6 gap-y-2 justify-between items-center text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-mono text-cyan-600">
            <span className="w-3 h-3 bg-[#0a1024] border border-[#112244] rounded-sm"></span>
            Landmass
          </div>
          <div className="flex items-center gap-1.5 font-mono text-cyan-600">
            <span className="w-3 h-0.5 bg-[#10b981] inline-block"></span>
            Orbit Path
          </div>
          <div className="flex items-center gap-1.5 font-mono text-cyan-600">
            <span className="w-3 h-3 bg-amber-500/10 border border-dashed border-amber-500/30 rounded-full"></span>
            Station Horizon
          </div>
          <div className="flex items-center gap-1.5 font-mono text-cyan-600">
            <span className="w-3 h-3 bg-cyan-500/10 border border-cyan-500/30 rounded-full"></span>
            Radio Footprint
          </div>
          <div className="flex items-center gap-1.5 font-mono text-cyan-600">
            <span className="w-3 h-3 bg-rose-500/20 border border-rose-500/50 rounded-full"></span>
            Sensor Scan
          </div>
        </div>

        <div className="font-mono text-[10px] text-cyan-600">
          Position: {satelliteState ? `${Math.abs(satelliteState.lat).toFixed(2)}°${satelliteState.lat >= 0 ? 'N' : 'S'} / ${Math.abs(satelliteState.lon).toFixed(2)}°${satelliteState.lon >= 0 ? 'E' : 'W'}` : '--'}
        </div>
      </div>
    </div>
  );
}
