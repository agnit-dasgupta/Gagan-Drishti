import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SatelliteState } from '../types';

interface SkyPlotProps {
  satelliteState: SatelliteState | null;
  groundTrack: { lat: number; lon: number; isFuture: boolean }[];
  observerLat: number;
  observerLon: number;
  observerAlt: number; // in meters
  line1: string;
  line2: string;
}

import * as satellite from 'satellite.js';

export default function SkyPlot({
  satelliteState,
  observerLat,
  observerLon,
  observerAlt,
  line1,
  line2
}: SkyPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(300);

  // Resize listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // Keep it square
      const squareSize = Math.min(width, height) || 300;
      setSize(Math.max(200, Math.floor(squareSize)));
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute pass coordinates on the sky plot (Azimuth/Elevation for the last 45 and next 45 min)
  // Ground reference time to nearest 30 seconds to avoid unnecessary recalculations
  const timeMinuteBucket = satelliteState?.time
    ? Math.floor(satelliteState.time.getTime() / 30000) * 30000
    : 0;

  const skyPassPoints = useMemo(() => {
    if (!line1 || !line2) return [];

    try {
      const satrec = satellite.twoline2satrec(line1, line2);
      const validLat = typeof observerLat === 'number' && !isNaN(observerLat) ? observerLat : 13.03;
      const validLon = typeof observerLon === 'number' && !isNaN(observerLon) ? observerLon : 77.51;
      const validAlt = typeof observerAlt === 'number' && !isNaN(observerAlt) ? observerAlt : 920;

      const observerGd = {
        latitude: satellite.degreesToRadians(validLat),
        longitude: satellite.degreesToRadians(validLon),
        height: validAlt / 1000 // to km
      };

      const points: { az: number; el: number }[] = [];
      const refTime = timeMinuteBucket ? new Date(timeMinuteBucket) : new Date();
      
      // Step through past 45 and future 45 minutes in 30-second intervals
      for (let offset = -45 * 60; offset <= 45 * 60; offset += 30) {
        const d = new Date(refTime.getTime() + offset * 1000);
        const pv = satellite.propagate(satrec, d);
        if (pv.position && typeof pv.position !== 'boolean') {
          const gmst = satellite.gstime(d);
          const posEcf = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gmst);
          const look = satellite.ecfToLookAngles(observerGd, posEcf);
          
          const az = satellite.radiansToDegrees(look.azimuth);
          const el = satellite.radiansToDegrees(look.elevation);
          
          // Only store if it's above the horizon (elevation > 0)
          if (el >= 0) {
            points.push({ az, el });
          }
        }
      }
      return points;
    } catch (err) {
      console.error('Error computing sky pass points', err);
      return [];
    }
  }, [line1, line2, observerLat, observerLon, observerAlt, timeMinuteBucket]);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = size / 2;
    const padding = 24;
    const maxRadius = center - padding;

    // Clear background
    ctx.fillStyle = '#05060a'; // matching map dark background
    ctx.fillRect(0, 0, size, size);

    // Draw Polar grids
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;

    // Concentric rings (Horizon 0°, 30° elevation, 60° elevation, Zenith 90° is center)
    const elevations = [0, 30, 60];
    elevations.forEach((el) => {
      // Radius decreases as elevation increases (0° el = max radius, 90° el = 0 radius)
      const r = maxRadius * (1 - el / 90);
      
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();

      // Elevation labels
      if (el !== 90) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; // cyan label
        ctx.font = '8px monospace';
        ctx.fillText(`${el}°`, center + r + 2, center - 2);
      }
    });

    // Radial spokes (Azimuth indicators every 45 degrees)
    const spokes = [0, 45, 90, 135, 180, 225, 270, 315];
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    spokes.forEach((az) => {
      const rad = ((az - 90) * Math.PI) / 180; // offset by 90 to put 0 (North) at the top
      const xStart = center + Math.cos(rad) * maxRadius * 0.1;
      const yStart = center + Math.sin(rad) * maxRadius * 0.1;
      const xEnd = center + Math.cos(rad) * maxRadius;
      const yEnd = center + Math.sin(rad) * maxRadius;

      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();
    });

    // Label Cardinals (N, S, E, W)
    ctx.fillStyle = '#06b6d4'; // neon cyan
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText('N', center, padding - 10);
    ctx.fillText('S', center, size - padding + 10);
    ctx.fillText('E', size - padding + 10, center);
    ctx.fillText('W', padding - 10, center);

    // Coordinate conversion: Azimuth/Elevation to Canvas X/Y
    const polarToCanvas = (az: number, el: number) => {
      const elClamped = Math.max(0, Math.min(90, el));
      const r = maxRadius * (1 - elClamped / 90);
      const theta = ((az - 90) * Math.PI) / 180; // 0 deg azimuth is North (top)
      return {
        x: center + r * Math.cos(theta),
        y: center + r * Math.sin(theta)
      };
    };

    // Draw visible transit trail (Pass path across sky)
    if (skyPassPoints.length > 1) {
      ctx.beginPath();
      skyPassPoints.forEach((pt, idx) => {
        const { x, y } = polarToCanvas(pt.az, pt.el);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = '#f59e0b'; // amber color for passes
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw dashed ends of the pass trail
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      skyPassPoints.forEach((pt, idx) => {
        if (idx === 0 || idx === skyPassPoints.length - 1) {
          const { x, y } = polarToCanvas(pt.az, pt.el);
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw satellite position if visible (elevation > 0)
    if (satelliteState && satelliteState.elevation >= 0) {
      const { x, y } = polarToCanvas(satelliteState.azimuth, satelliteState.elevation);

      // Draw radar sweep ring
      const ringSize = 8 + (Date.now() % 1000) / 100;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)'; // cyan
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, ringSize, 0, Math.PI * 2);
      ctx.stroke();

      // Solid target indicator
      ctx.fillStyle = '#06b6d4'; // bright cyan
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Label with details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        ` SAT (${satelliteState.elevation.toFixed(1)}°, ${satelliteState.azimuth.toFixed(0)}°)`,
        x + 8,
        y - 2
      );
    } else {
      // Draw "OUT OF RANGE" message in center
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // red-500 tint
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, maxRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444'; // red-500
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SAT BELOW', center, center - 6);
      ctx.fillText('HORIZON', center, center + 6);
    }

    // Outer Radar bezel ring
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'; // cyan border
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center, center, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Radar grid divisions on outer bezel
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1;
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const tickLen = deg % 30 === 0 ? 6 : 3;
      const xStart = center + Math.cos(rad) * maxRadius;
      const yStart = center + Math.sin(rad) * maxRadius;
      const xEnd = center + Math.cos(rad) * (maxRadius - tickLen);
      const yEnd = center + Math.sin(rad) * (maxRadius - tickLen);
      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();
    }
  }, [size, satelliteState, skyPassPoints]);

  return (
    <div className="flex flex-col bg-[#0a0c16] border border-cyan-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)] h-full">
      <div className="px-5 py-4 bg-[#0a0c16] border-b border-cyan-900/30 flex justify-between items-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Sky Dome Radar (Azimuth & Elevation)
        </span>
      </div>

      <div ref={containerRef} className="w-full flex-1 flex items-center justify-center p-4 bg-[#05060a]/40 min-h-[300px]">
        <canvas
          id="sky-radar-scope"
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-full overflow-hidden border border-cyan-900/30 shadow-inner"
        />
      </div>

      <div className="px-5 py-3 bg-[#0a0c16]/50 border-t border-cyan-900/30 text-[10px] font-mono text-cyan-600 flex justify-between items-center">
        <span>Azimuth: {satelliteState?.azimuth ? `${satelliteState.azimuth.toFixed(1)}°` : '--'}</span>
        <span>Elevation: {satelliteState?.elevation ? `${satelliteState.elevation.toFixed(1)}°` : '--'}</span>
        <span className={satelliteState && satelliteState.elevation >= 0 ? 'text-cyan-400 font-bold' : 'text-rose-400 font-bold'}>
          {satelliteState && satelliteState.elevation >= 0 ? '● VISIBLE' : '○ INVISIBLE'}
        </span>
      </div>
    </div>
  );
}
