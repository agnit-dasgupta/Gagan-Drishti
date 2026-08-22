import React from 'react';

interface GaganDrishtiLogoProps {
  variant?: 'full' | 'mark' | 'horizontal' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  glow?: boolean;
}

export default function GaganDrishtiLogo({
  variant = 'full',
  size = 'md',
  className = '',
  glow = true
}: GaganDrishtiLogoProps) {
  // Dimensions based on size preset
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: variant === 'mark' ? 28 : 120, height: 28, iconSize: 28 };
      case 'md':
        return { width: variant === 'mark' ? 38 : 160, height: 38, iconSize: 38 };
      case 'lg':
        return { width: variant === 'mark' ? 56 : 220, height: 56, iconSize: 56 };
      case 'xl':
        return { width: variant === 'mark' ? 96 : 340, height: 96, iconSize: 96 };
      default:
        return { width: variant === 'mark' ? 38 : 160, height: 38, iconSize: 38 };
    }
  };

  const { iconSize } = getDimensions();

  // Pure SVG Emblem Mark matching the exact Gagan Drishti Logo Artwork
  const renderLogoMark = (svgSize: number) => (
    <svg
      viewBox="0 0 240 180"
      width={svgSize}
      height={svgSize * 0.75}
      className={`overflow-visible select-none ${glow ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]' : ''}`}
    >
      <defs>
        {/* Eye Outline Linear Gradients */}
        <linearGradient id="gdEyeUpperGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="25%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#67e8f9" />
          <stop offset="75%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        <linearGradient id="gdEyeLowerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0369a1" />
          <stop offset="30%" stopColor="#0ea5e9" />
          <stop offset="70%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Orbit Arc Gradient */}
        <linearGradient id="gdOrbitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="1" />
        </linearGradient>

        {/* Satellite Downlink Light Cone Beam */}
        <linearGradient id="gdSatelliteBeamGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#0284c7" stopOpacity="0.45" />
          <stop offset="75%" stopColor="#0369a1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
        </linearGradient>

        {/* Earth Iris Globe Gradient */}
        <radialGradient id="gdEarthGlobeGrad" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="30%" stopColor="#38bdf8" />
          <stop offset="65%" stopColor="#0284c7" />
          <stop offset="85%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>

        {/* Solar Panels Gradient */}
        <linearGradient id="gdSolarPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>

        {/* Glow Filters */}
        <filter id="gdGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="gdCoreGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Orbit Ellipse Background sweeping from left around the back */}
      <path
        d="M 68 152 C 22 145 10 102 38 68 C 65 35 125 18 178 30"
        fill="none"
        stroke="url(#gdOrbitGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Downward Telemetry / Observation Beam from Satellite into Earth Globe */}
      <polygon
        points="172,32 108,106 132,106"
        fill="url(#gdSatelliteBeamGrad)"
        opacity="0.8"
      />

      {/* Stylized Outer Eye Contour (Lower Arch) */}
      <path
        d="M 28 98 C 62 144 178 144 212 98 C 178 132 62 132 28 98 Z"
        fill="url(#gdEyeLowerGrad)"
      />
      <path
        d="M 28 98 C 62 144 178 144 212 98"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Stylized Outer Eye Contour (Upper Arch) */}
      <path
        d="M 28 98 C 62 52 178 52 212 98 C 178 64 62 64 28 98 Z"
        fill="url(#gdEyeUpperGrad)"
      />
      <path
        d="M 28 98 C 62 52 178 52 212 98"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Orbit Loop (Foreground arc coming over the front-left eye corner) */}
      <path
        d="M 28 98 C 22 118 36 142 74 154 C 110 165 160 156 195 130"
        fill="none"
        stroke="url(#gdOrbitGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Center Iris: Glowing Earth Globe */}
      <g id="gd-earth-pupil" transform="translate(120, 98)">
        {/* Outer Earth Halo Atmosphere */}
        <circle cx="0" cy="0" r="32" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
        <circle cx="0" cy="0" r="29" fill="url(#gdEarthGlobeGrad)" filter="url(#gdGlowFilter)" />

        {/* Earth Continents (Stylized Asia, India, Ocean contours in high contrast) */}
        {/* India Subcontinent Silhouette */}
        <path
          d="M -3 -12 L 2 -10 L 6 -5 L 4 2 L 1 8 L -2 4 L -5 0 L -6 -6 Z"
          fill="#e0f2fe"
          opacity="0.85"
        />
        {/* Asia / Eurasian Mainland Mass */}
        <path
          d="M -14 -16 C -8 -22 8 -24 16 -16 C 22 -10 24 2 17 8 C 12 12 7 8 5 -2 C 2 -8 -5 -10 -12 -11 Z"
          fill="#bae6fd"
          opacity="0.75"
        />
        {/* Southeast Asia Islands */}
        <circle cx="12" cy="6" r="1.5" fill="#e0f2fe" opacity="0.8" />
        <circle cx="15" cy="11" r="1.8" fill="#e0f2fe" opacity="0.8" />
        <circle cx="8" cy="14" r="1.4" fill="#e0f2fe" opacity="0.8" />

        {/* Geospatial Coordinate Grid Lines (Longitudes and Latitudes) */}
        {/* Central Prime Axis Crosshairs */}
        <line x1="-28" y1="0" x2="28" y2="0" stroke="#7dd3fc" strokeWidth="0.6" opacity="0.5" strokeDasharray="2, 2" />
        <line x1="0" y1="-28" x2="0" y2="28" stroke="#7dd3fc" strokeWidth="0.6" opacity="0.5" strokeDasharray="2, 2" />
        {/* Latitude Arcs */}
        <ellipse cx="0" cy="-10" rx="26" ry="7" fill="none" stroke="#bae6fd" strokeWidth="0.5" opacity="0.4" />
        <ellipse cx="0" cy="10" rx="26" ry="7" fill="none" stroke="#bae6fd" strokeWidth="0.5" opacity="0.4" />
        {/* Longitude Ellipses */}
        <ellipse cx="0" cy="0" rx="14" ry="28" fill="none" stroke="#bae6fd" strokeWidth="0.5" opacity="0.45" />

        {/* Center Target Focal Point */}
        <circle cx="0" cy="0" r="1.8" fill="#ffffff" filter="url(#gdCoreGlow)" />
      </g>

      {/* Satellite at Top-Right (Positioned at 172, 26 angled at ~-35 deg) */}
      <g id="gd-satellite" transform="translate(172, 26) rotate(-35)">
        {/* Satellite Main Chassis */}
        <rect
          x="-7"
          y="-11"
          width="14"
          height="22"
          rx="4"
          fill="#ffffff"
          stroke="#0284c7"
          strokeWidth="1.2"
        />
        {/* Satellite Dish / Optical Sensor Lens Dome */}
        <path
          d="M -7 9 C -7 14 7 14 7 9 Z"
          fill="#0284c7"
          stroke="#38bdf8"
          strokeWidth="1"
        />
        <circle cx="0" cy="10" r="3" fill="#38bdf8" />

        {/* Left Solar Array Wing */}
        <g transform="translate(-8, -2)">
          <line x1="0" y1="0" x2="-6" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <rect
            x="-26"
            y="-7"
            width="20"
            height="14"
            rx="1"
            fill="url(#gdSolarPanelGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          {/* Photovoltaic Cell Grid */}
          <line x1="-19.3" y1="-7" x2="-19.3" y2="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
          <line x1="-12.6" y1="-7" x2="-12.6" y2="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
          <line x1="-26" y1="0" x2="-6" y2="0" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
        </g>

        {/* Right Solar Array Wing */}
        <g transform="translate(8, -2)">
          <line x1="0" y1="0" x2="6" y2="0" stroke="#ffffff" strokeWidth="1.5" />
          <rect
            x="6"
            y="-7"
            width="20"
            height="14"
            rx="1"
            fill="url(#gdSolarPanelGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          {/* Photovoltaic Cell Grid */}
          <line x1="12.6" y1="-7" x2="12.6" y2="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
          <line x1="19.3" y1="-7" x2="19.3" y2="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
          <line x1="6" y1="0" x2="26" y2="0" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
        </g>
      </g>
    </svg>
  );

  // If mark-only variant requested
  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderLogoMark(iconSize)}
      </div>
    );
  }

  // Full Brand Logo with the Official Stylized Typography "G^gan Drishti"
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Icon Emblem */}
      <div className="flex-shrink-0 flex items-center justify-center">
        {renderLogoMark(iconSize)}
      </div>

      {/* Typography with Aerospace Delta Chevron in Gagan */}
      <div className="flex flex-col justify-center select-none">
        <div className="flex items-center font-sans tracking-tight text-white font-bold leading-none">
          {/* G */}
          <span className="text-xl sm:text-2xl font-extrabold tracking-normal">G</span>

          {/* Aerospace Delta Arrow Chevron representing the 'A' */}
          <span className="relative inline-flex items-center justify-center mx-[1px] w-4 h-5 sm:w-4.5 sm:h-5.5">
            <svg viewBox="0 0 24 28" className="w-full h-full drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]">
              <defs>
                <linearGradient id="deltaChevronGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
              <polygon
                points="12,2 22,25 12,19 2,25"
                fill="url(#deltaChevronGrad)"
              />
            </svg>
          </span>

          {/* gan */}
          <span className="text-xl sm:text-2xl font-bold tracking-normal">gan</span>

          {/* Drishti */}
          <span className="text-xl sm:text-2xl font-bold tracking-normal ml-2 text-white">
            Drishti
          </span>
        </div>

        {variant !== 'compact' && (
          <span className="text-[9px] sm:text-[10px] text-cyan-400/90 font-mono tracking-widest uppercase font-semibold mt-0.5">
            SPACE-TO-CLOUD DATA DaaS
          </span>
        )}
      </div>
    </div>
  );
}
