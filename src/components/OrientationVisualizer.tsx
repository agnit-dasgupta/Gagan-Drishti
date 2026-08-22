import React, { useRef, useEffect, useState } from 'react';
import { SatelliteState } from '../types';
import { calculateSensorFootprint } from '../utils/satelliteCalc';

interface OrientationVisualizerProps {
  satelliteState: SatelliteState | null;
  pitch: number;
  setPitch: (p: number) => void;
  roll: number;
  setRoll: (r: number) => void;
  yaw: number;
  setYaw: (y: number) => void;
  sensorFov: number;
  setSensorFov: (f: number) => void;
  sensorFootprint: { centerLat: number; centerLon: number; radiusKm: number } | null;
}

export default function OrientationVisualizer({
  satelliteState,
  pitch,
  setPitch,
  roll,
  setRoll,
  yaw,
  setYaw,
  sensorFov,
  setSensorFov,
  sensorFootprint
}: OrientationVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 320, height: 200 });

  // Handle canvas sizing with ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;
    const updateSize = () => {
      const rect = parent.getBoundingClientRect();
      if (rect && rect.width > 50) {
        const currentWidth = Math.floor(rect.width);
        setDimensions((prev) => {
          if (prev.width === currentWidth) return prev;
          return {
            width: currentWidth,
            height: 180
          };
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(parent);

    return () => observer.disconnect();
  }, []);

  // Draw 3D-like wireframe satellite on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    ctx.clearRect(0, 0, width, height);

    // Dark sleek gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#05060a');
    bgGrad.addColorStop(1, '#0a0c16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Center of coordinates
    const cx = width / 2;
    const cy = height / 2;

    // Convert Roll, Pitch, Yaw offsets to radians for rotation
    const rRad = (roll * Math.PI) / 180;
    const pRad = (pitch * Math.PI) / 180;
    const yRad = (yaw * Math.PI) / 180;

    // Define 3D points of satellite body (cuboid + solar panels)
    // Coords: [x, y, z] relative to satellite center
    const bodyVertices: [number, number, number][] = [
      [-15, -10, -10], [15, -10, -10], [15, 10, -10], [-15, 10, -10], // front face
      [-15, -10, 10],  [15, -10, 10],  [15, 10, 10],  [-15, 10, 10]   // back face
    ];

    // Left Solar Panel
    const leftPanel: [number, number, number][] = [
      [-15, -1, -5], [-55, -1, -5], [-55, 1, -5], [-15, 1, -5], // panel 1 front
      [-15, -1, 5],  [-55, -1, 5],  [-55, 1, 5],  [-15, 1, 5]    // panel 1 back
    ];

    // Right Solar Panel
    const rightPanel: [number, number, number][] = [
      [15, -1, -5], [55, -1, -5], [55, 1, -5], [15, 1, -5], // panel 2 front
      [15, -1, 5],  [55, -1, 5],  [55, 1, 5],  [15, 1, 5]    // panel 2 back
    ];

    // Antenna dish at the bottom (NADIR pointing, along +Y)
    const antennaStem: [number, number, number][] = [
      [0, 10, 0], [0, 25, 0]
    ];
    const antennaDish: [number, number, number][] = [
      [-8, 25, -3], [8, 25, -3], [8, 25, 3], [-8, 25, 3]
    ];

    // Rotation helper (Yaw, Pitch, Roll sequence)
    const rotate3D = (pt: [number, number, number]): [number, number, number] => {
      let [x, y, z] = pt;

      // 1. Yaw rotation (about Z axis)
      let x1 = x * Math.cos(yRad) - y * Math.sin(yRad);
      let y1 = x * Math.sin(yRad) + y * Math.cos(yRad);
      let z1 = z;

      // 2. Pitch rotation (about X axis)
      let x2 = x1;
      let y2 = y1 * Math.cos(pRad) - z1 * Math.sin(pRad);
      let z2 = y1 * Math.sin(pRad) + z1 * Math.cos(pRad);

      // 3. Roll rotation (about Y axis)
      let x3 = x2 * Math.cos(rRad) + z2 * Math.sin(rRad);
      let y3 = y2;
      let z3 = -x2 * Math.sin(rRad) + z2 * Math.cos(rRad);

      return [x3, y3, z3];
    };

    // Project 3D coordinate to 2D screen coordinate (isometric/perspective)
    const project = (pt3d: [number, number, number]) => {
      const rotated = rotate3D(pt3d);
      const [rx, ry, rz] = rotated;
      // Simple orthographic projection with depth cues
      const scale = 1.3;
      return {
        x: cx + rx * scale,
        y: cy + ry * scale,
        z: rz
      };
    };

    // Helper to draw a wireframe 3D box
    const drawBox = (vertices: [number, number, number][], strokeColor: string, fillColor: string) => {
      const projected = vertices.map(project);

      // Faces mapping indices
      const faces = [
        [0, 1, 2, 3], // Front
        [4, 5, 6, 7], // Back
        [0, 1, 5, 4], // Top
        [2, 3, 7, 6], // Bottom
        [0, 3, 7, 4], // Left
        [1, 2, 6, 5]  // Right
      ];

      // Sort faces by average Z depth (back-to-front rendering)
      const faceDepths = faces.map((faceIndices, idx) => {
        const sumZ = faceIndices.reduce((sum, vertexIdx) => sum + projected[vertexIdx].z, 0);
        return { indices: faceIndices, avgZ: sumZ / 4, idx };
      });
      faceDepths.sort((a, b) => b.avgZ - a.avgZ); // back faces first

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;

      faceDepths.forEach((face) => {
        ctx.beginPath();
        face.indices.forEach((vIdx, iIdx) => {
          const pt = projected[vIdx];
          if (iIdx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.stroke();
      });
    };

    // Draw grid floor (Earth surface representation far below)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    for (let i = -100; i <= 100; i += 20) {
      ctx.beginPath();
      ctx.moveTo(cx + i, cy + 40);
      ctx.lineTo(cx + i * 0.5, cy + 90);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 100, cy + 40 + (i + 100) * 0.25);
      ctx.lineTo(cx + 100, cy + 40 + (i + 100) * 0.25);
      ctx.stroke();
    }

    // Draw Sun Vector (direction of incoming solar rays)
    if (satelliteState?.sunlit) {
      ctx.strokeStyle = '#f59e0b'; // amber sunbeam
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy - 60);
      ctx.lineTo(cx - 30, cy - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '8px monospace';
      ctx.fillText('☀️ SUNLIGHT', cx - 110, cy - 64);
    }

    // Draw NADIR Direction Vector (ideal down, along +Y)
    ctx.strokeStyle = '#06b6d4'; // Cyan NADIR indicator
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 20);
    ctx.lineTo(cx, cy + 65);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 60);
    ctx.lineTo(cx, cy + 66);
    ctx.lineTo(cx + 4, cy + 60);
    ctx.stroke();
    ctx.fillStyle = '#06b6d4';
    ctx.font = '8px monospace';
    ctx.fillText('NADIR (EARTH)', cx - 35, cy + 76);

    // Render Satellite components
    // 1. Solar Panels (filled with a beautiful blue solar-cell pattern)
    drawBox(leftPanel, '#083344', 'rgba(20, 184, 166, 0.25)');
    drawBox(rightPanel, '#083344', 'rgba(20, 184, 166, 0.25)');

    // 2. Central spacecraft bus (metallic silver body)
    drawBox(bodyVertices, '#0e7490', 'rgba(6, 182, 212, 0.15)');

    // 3. Antenna dish assembly
    const pStem = antennaStem.map(project);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pStem[0].x, pStem[0].y);
    ctx.lineTo(pStem[1].x, pStem[1].y);
    ctx.stroke();

    const pDish = antennaDish.map(project);
    ctx.beginPath();
    pDish.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();

    // Draw yaw attitude compass tick indicators
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, 75, 0, Math.PI * 2);
    ctx.stroke();

    // Overlay Pitch/Roll orientation crosshair at top left
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(45, 45, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(45, 15);
    ctx.lineTo(45, 75);
    ctx.moveTo(15, 45);
    ctx.lineTo(75, 45);
    ctx.stroke();

    // Tiny target dot showing simulated pitch and roll offset in the crosshair
    const tx = 45 + (roll / 30) * 25;
    const ty = 45 + (pitch / 30) * 25;
    ctx.fillStyle = '#f43f5e'; // rose red
    ctx.beginPath();
    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#06b6d4';
    ctx.font = '8px monospace';
    ctx.fillText('GYRO', 33, 11);
  }, [dimensions, pitch, roll, yaw, satelliteState]);

  return (
    <div className="flex flex-col bg-[#0a0c16] border border-cyan-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)]">
      <div className="px-5 py-4 bg-[#0a0c16] border-b border-cyan-900/30 flex justify-between items-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Attitude Control & Telemetry
        </span>
      </div>

      <div className="p-4 bg-[#05060a]/40 flex flex-col md:flex-row gap-6">
        {/* 3D Wireframe Scope */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#05060a] rounded-lg p-3 border border-cyan-900/20 shadow-inner">
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="rounded overflow-hidden max-w-full"
          />
          <div className="mt-2 w-full grid grid-cols-3 text-center text-[10px] font-mono text-cyan-500 border-t border-cyan-900/20 pt-2">
            <div>ROLL: <span className="text-cyan-400 font-semibold">{roll}°</span></div>
            <div>PITCH: <span className="text-teal-400 font-semibold">{pitch}°</span></div>
            <div>YAW: <span className="text-amber-400 font-semibold">{yaw}°</span></div>
          </div>
        </div>

        {/* Sliders and Sensor Outputs */}
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-cyan-100">
                <span>🛰️ Roll Deviation (Tilt Left/Right)</span>
                <span className="text-cyan-400 font-semibold">{roll}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={roll}
                onChange={(e) => setRoll(parseInt(e.target.value))}
                className="w-full h-1.5 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-cyan-100">
                <span>🛰️ Pitch Deviation (Pitch Up/Down)</span>
                <span className="text-teal-400 font-semibold">{pitch}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={pitch}
                onChange={(e) => setPitch(parseInt(e.target.value))}
                className="w-full h-1.5 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-cyan-100">
                <span>🛰️ Yaw Rotation (Spin)</span>
                <span className="text-amber-400 font-semibold">{yaw}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={yaw}
                onChange={(e) => setYaw(parseInt(e.target.value))}
                className="w-full h-1.5 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1 text-cyan-100">
                <span>📷 Camera FOV Half-Angle</span>
                <span className="text-rose-400 font-semibold">{sensorFov}°</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={sensorFov}
                onChange={(e) => setSensorFov(parseInt(e.target.value))}
                className="w-full h-1.5 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Computed Sensor Intersect Point */}
          <div className="bg-cyan-950/20 border border-cyan-900/20 rounded-lg p-4 space-y-2.5">
            <div className="text-[10px] uppercase font-bold text-cyan-500 font-mono">
              Simulated Optical Sensor Swath
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-[#05060a] p-2.5 rounded border border-cyan-900/30">
                <span className="text-[10px] text-cyan-600 block uppercase font-bold">FOOTPRINT CENTER</span>
                {sensorFootprint ? (
                  <span className="text-cyan-100">
                    {Math.abs(sensorFootprint.centerLat).toFixed(2)}°{sensorFootprint.centerLat >= 0 ? 'N' : 'S'}<br />
                    {Math.abs(sensorFootprint.centerLon).toFixed(2)}°{sensorFootprint.centerLon >= 0 ? 'E' : 'W'}
                  </span>
                ) : '--'}
              </div>
              <div className="bg-[#05060a] p-2.5 rounded border border-cyan-900/30">
                <span className="text-[10px] text-cyan-600 block uppercase font-bold">SWATH RADIUS</span>
                {sensorFootprint ? (
                  <span className="text-cyan-100">
                    {Math.round(sensorFootprint.radiusKm)} km
                  </span>
                ) : '--'}
              </div>
            </div>

            <div className="text-[10px] font-mono text-cyan-700 italic mt-1 leading-normal">
              Note: Adjusting pitch/roll displaces the camera optical vector relative to the sub-satellite nadir point.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
