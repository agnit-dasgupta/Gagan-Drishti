import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface PlanetOrbit {
  id: string;
  name: string;
  radius: number; // in SVG units
  size: number;
  color: string;
  glow: string;
  speed: number;
  baseAngle: number;
}

export default function SolarSystemBackdrop() {
  const [simTime, setSimTime] = useState<number>(0);

  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setSimTime((t) => t + dt);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Sun anchor is at top-right corner (1000, 0)
  const SUN_X = 1000;
  const SUN_Y = 0;

  const PLANETS: PlanetOrbit[] = [
    { id: 'mercury', name: 'Mercury', radius: 140, size: 4, color: '#94a3b8', glow: '#64748b', speed: 0.45, baseAngle: 120 },
    { id: 'venus', name: 'Venus', radius: 240, size: 6.5, color: '#f59e0b', glow: '#d97706', speed: 0.35, baseAngle: 145 },
    { id: 'earth', name: 'Earth', radius: 360, size: 8, color: '#38bdf8', glow: '#0284c7', speed: 0.25, baseAngle: 130 },
    { id: 'mars', name: 'Mars', radius: 480, size: 5.5, color: '#ef4444', glow: '#dc2626', speed: 0.18, baseAngle: 110 },
    { id: 'jupiter', name: 'Jupiter', radius: 680, size: 16, color: '#fb923c', glow: '#ea580c', speed: 0.1, baseAngle: 155 },
    { id: 'saturn', name: 'Saturn', radius: 860, size: 13, color: '#fde047', glow: '#ca8a04', speed: 0.07, baseAngle: 125 },
    { id: 'uranus', name: 'Uranus', radius: 1040, size: 10, color: '#22d3ee', glow: '#06b6d4', speed: 0.045, baseAngle: 140 },
    { id: 'neptune', name: 'Neptune', radius: 1200, size: 9.5, color: '#60a5fa', glow: '#3b82f6', speed: 0.03, baseAngle: 160 },
  ];

  return (
    <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Ambient solar radial glow fading into the dark hero backdrop */}
      <div className="absolute top-0 right-0 w-[850px] h-[850px] bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.12)_0%,rgba(6,182,212,0.06)_40%,transparent_70%)] pointer-events-none" />

      {/* SVG Canvas covering full hero area */}
      <svg
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMaxYMin meet"
        className="w-full h-full opacity-60 transition-opacity duration-1000"
      >
        <defs>
          {/* Subtle Corona Gradients */}
          <radialGradient id="backdropSunCorona" cx="100%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.9" />
            <stop offset="12%" stopColor="#fde047" stopOpacity="0.75" />
            <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#ea580c" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="backdropSunCore" cx="100%" cy="0%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#fef08a" stopOpacity="0.85" />
            <stop offset="85%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.4" />
          </radialGradient>

          <filter id="vagueGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint Astrodynamics Radial Grid Lines radiating from top-right corner */}
        {[100, 115, 130, 145, 160, 175].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x2 = SUN_X + 1300 * Math.cos(rad);
          const y2 = SUN_Y + 1300 * Math.sin(rad);
          return (
            <line
              key={deg}
              x1={SUN_X}
              y1={SUN_Y}
              x2={x2}
              y2={y2}
              stroke="#06b6d4"
              strokeWidth="0.6"
              strokeDasharray="3, 12"
              strokeOpacity="0.18"
            />
          );
        })}

        {/* Faint Asteroid Belt Band Arc between Mars and Jupiter */}
        <path
          d={`M ${SUN_X + 570 * Math.cos((90 * Math.PI) / 180)} ${SUN_Y + 570 * Math.sin((90 * Math.PI) / 180)}
             A 570 570 0 0 0 ${SUN_X + 570 * Math.cos((180 * Math.PI) / 180)} ${SUN_Y + 570 * Math.sin((180 * Math.PI) / 180)}`}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="14"
          strokeDasharray="1.5, 9"
          strokeOpacity="0.12"
        />

        {/* Concentric Quarter Orbital Arcs for All Planets */}
        {PLANETS.map((planet) => {
          const startX = SUN_X + planet.radius * Math.cos((90 * Math.PI) / 180);
          const startY = SUN_Y + planet.radius * Math.sin((90 * Math.PI) / 180);
          const endX = SUN_X + planet.radius * Math.cos((180 * Math.PI) / 180);
          const endY = SUN_Y + planet.radius * Math.sin((180 * Math.PI) / 180);

          return (
            <g key={planet.id}>
              {/* Quarter Circle Arc */}
              <path
                d={`M ${startX} ${startY} A ${planet.radius} ${planet.radius} 0 0 0 ${endX} ${endY}`}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="4, 8"
                strokeOpacity="0.22"
              />
            </g>
          );
        })}

        {/* Sun Quarter-Arc at the Top-Right Corner */}
        <g id="vague-sun">
          {/* Outer Pulsing Corona */}
          <motion.circle
            cx={SUN_X}
            cy={SUN_Y}
            r="160"
            fill="url(#backdropSunCorona)"
            animate={{ scale: [1, 1.05, 1], opacity: [0.75, 0.95, 0.75] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            style={{ transformOrigin: `${SUN_X}px ${SUN_Y}px` }}
          />
          {/* Inner Sun Quarter Core */}
          <circle
            cx={SUN_X}
            cy={SUN_Y}
            r="65"
            fill="url(#backdropSunCore)"
            filter="url(#vagueGlow)"
          />
          {/* Aditya-L1 Halo Orbit representation */}
          <g transform={`translate(${SUN_X - 180}, 65)`}>
            <circle cx="0" cy="0" r="14" fill="none" stroke="#f59e0b" strokeWidth="0.8" strokeDasharray="3, 3" strokeOpacity="0.4" />
            <circle cx="0" cy="0" r="2" fill="#fbbf24" opacity="0.7" />
            <text x="-8" y="-6" fill="#fde047" fontSize="8" fontFamily="monospace" opacity="0.4">Aditya-L1 Halo</text>
          </g>
        </g>

        {/* Orbiting Planetary Spheres along their respective arcs */}
        {PLANETS.map((planet) => {
          // Slow smooth sweeping angle within the quadrant (95° to 175°)
          const angleSpan = 70; // deg
          const currentAngleDeg = 100 + ((planet.baseAngle + simTime * planet.speed * 8) % angleSpan);
          const rad = (currentAngleDeg * Math.PI) / 180;
          const px = SUN_X + planet.radius * Math.cos(rad);
          const py = SUN_Y + planet.radius * Math.sin(rad);

          return (
            <g key={planet.id} opacity="0.85">
              {/* Planetary Atmospheric Glow Ring */}
              <circle
                cx={px}
                cy={py}
                r={planet.size * 1.6}
                fill="none"
                stroke={planet.glow}
                strokeWidth="0.75"
                strokeOpacity="0.4"
              />

              {/* Saturn's Planetary Rings */}
              {planet.id === 'saturn' && (
                <ellipse
                  cx={px}
                  cy={py}
                  rx={planet.size * 2.3}
                  ry={planet.size * 0.8}
                  fill="none"
                  stroke="#fde047"
                  strokeWidth="2"
                  strokeOpacity="0.5"
                  transform={`rotate(-28 ${px} ${py})`}
                />
              )}

              {/* Planet Sphere */}
              <circle
                cx={px}
                cy={py}
                r={planet.size}
                fill={planet.color}
                filter="url(#vagueGlow)"
                opacity="0.8"
              />

              {/* Earth specific: Moon & Constellation Beacon */}
              {planet.id === 'earth' && (
                <g>
                  {/* Orbiting Moon */}
                  <circle
                    cx={px + 14 * Math.cos(simTime * 2.5)}
                    cy={py + 14 * Math.sin(simTime * 2.5)}
                    r="2"
                    fill="#e2e8f0"
                    opacity="0.75"
                  />
                  {/* Earth Satellite Downlink Beacon */}
                  <circle
                    cx={px + 9 * Math.cos(-simTime * 4)}
                    cy={py + 9 * Math.sin(-simTime * 4)}
                    r="1.5"
                    fill="#34d399"
                  />
                </g>
              )}

              {/* Faint Planet Label */}
              <text
                x={px}
                y={py + planet.size + 13}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="monospace"
                opacity="0.4"
                textAnchor="middle"
              >
                {planet.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
