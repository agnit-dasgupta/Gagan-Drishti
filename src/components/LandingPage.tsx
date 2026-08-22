import React, { useState } from 'react';
import InteractiveGlobe3D from './InteractiveGlobe3D';
import { SatellitePreset, ObserverLocation } from '../types';
import { SATELLITE_PRESETS } from '../utils/satelliteCalc';
import {
  Radio,
  Zap,
  RotateCcw,
  Compass,
  Layers,
  MapPin,
  Cpu,
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
  ArrowUpRight,
  Clock,
  Eye,
  Crosshair,
  Volume2,
  Terminal,
  Download
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: (preset?: SatellitePreset) => void;
}

export default function LandingPage({ onLaunchDashboard }: LandingPageProps) {
  const [selectedPreset, setSelectedPreset] = useState<SatellitePreset>(SATELLITE_PRESETS[0]);

  // Quick Doppler calculator demo interactive state
  const [dopplerFrequency, setDopplerFrequency] = useState<number>(137.5); // MHz
  const [dopplerVelocity, setDopplerVelocity] = useState<number>(-4.8); // km/s (approaching)

  const calculatedShiftHz = Math.round(
    ((1.0 - dopplerVelocity / 299792.458) - 1.0) * dopplerFrequency * 1000000
  );

  const groundStations: ObserverLocation[] = [
    { name: 'ISTRAC ISRO, Bengaluru', lat: 13.03, lon: 77.51, alt: 920 },
    { name: 'SDSC-SHAR Spaceport, Sriharikota', lat: 13.72, lon: 80.23, alt: 10 },
    { name: 'Space Applications Centre, Ahmedabad', lat: 23.03, lon: 72.51, alt: 55 },
    { name: 'Bharati Antarctic Station (India)', lat: -69.41, lon: 76.19, alt: 35 }
  ];

  return (
    <div className="min-h-screen bg-[#05060d] text-cyan-50 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative overflow-hidden">
      {/* Dynamic Cosmic Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:32px_32px]"></div>

      {/* Top Navbar */}
      <header className="border-b border-cyan-900/40 bg-[#080c1b]/85 backdrop-blur-lg px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.6)]">
            <Radio className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider font-mono uppercase text-white">
              GAGAN<span className="text-cyan-400">DRISHTI</span>
            </h1>
            <p className="text-[10px] text-cyan-600 uppercase tracking-widest font-mono font-bold">
              SWADESHI REAL-TIME ORBITAL ASTRODYNAMICS & TELEMETRY ENGINE
            </p>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-3 md:gap-6">
          <nav className="hidden lg:flex items-center gap-6 text-xs font-mono text-cyan-400/80">
            <a href="#globe3d" className="hover:text-cyan-200 transition-colors">3D GLOBE</a>
            <a href="#satellites" className="hover:text-cyan-200 transition-colors">ISRO FLEET</a>
            <a href="#physics" className="hover:text-cyan-200 transition-colors">SGP4 PHYSICS</a>
          </nav>

          <button
            onClick={() => onLaunchDashboard(selectedPreset)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-xs px-4 py-2 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>LAUNCH MISSION COMMAND</span>
          </button>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 space-y-16 relative z-10">

        {/* HERO SECTION: Title + 3D Earth Globe Orbital Visualizer */}
        <section id="globe3d" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mission Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE SGP4 PROPAGATOR V2.4 // ISRO READY</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono text-white tracking-tight leading-tight">
              Real-Time Orbital Intelligence & Space Situational Awareness
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-sans">
              High-fidelity trajectory propagation, relative look-angle derivation, ground station passes, and 3-axis attitude visualization over the Indian subcontinent and globe using SGP4 perturbation physics.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onLaunchDashboard(selectedPreset)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-sm px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 fill-black" />
                ENTER MISSION CONTROL
              </button>
            </div>

            {/* Live Telemetry Metric Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-cyan-900/40">
              <div className="bg-[#080d1e] p-3 rounded-xl border border-cyan-950">
                <div className="text-[10px] uppercase font-mono text-cyan-600 font-bold">Accuracy</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">±1.2 km</div>
                <div className="text-[10px] text-slate-500 font-mono">SGP4 WGS-84</div>
              </div>
              <div className="bg-[#080d1e] p-3 rounded-xl border border-cyan-950">
                <div className="text-[10px] uppercase font-mono text-cyan-600 font-bold">Latency</div>
                <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">&lt; 0.4 ms</div>
                <div className="text-[10px] text-slate-500 font-mono">Client Propagation</div>
              </div>
              <div className="bg-[#080d1e] p-3 rounded-xl border border-cyan-950">
                <div className="text-[10px] uppercase font-mono text-cyan-600 font-bold">Stations</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">5 ISRO</div>
                <div className="text-[10px] text-slate-500 font-mono">ISTRAC, Bharati</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Earth Globe with Real Orbit and Satellite */}
          <div className="lg:col-span-7">
            <InteractiveGlobe3D
              currentPreset={selectedPreset}
              satName={selectedPreset.name}
              onLaunchDashboard={() => onLaunchDashboard(selectedPreset)}
            />
          </div>
        </section>

        {/* SATELLITE FLEET SELECTOR & TRACKING PRESETS */}
        <section id="satellites" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-cyan-900/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-500 uppercase">
                <Crosshair className="w-3.5 h-3.5" />
                <span>ACTIVE SATELLITE CONSTELLATIONS</span>
              </div>
              <h2 className="text-2xl font-bold font-mono text-white mt-1">
                ISRO Flagships & International Targets
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Select a satellite to simulate in 3D orbit & calculate ground pass windows
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SATELLITE_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-cyan-950/60 to-[#0a1024] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : 'bg-[#080d1e] border-cyan-950 hover:border-cyan-800 hover:bg-[#0b1229]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900">
                        {preset.category}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans line-clamp-3 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-cyan-950 flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-600 group-hover:text-cyan-400 transition-colors">
                      {isSelected ? 'TRACKING IN 3D' : 'SELECT TARGET'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLaunchDashboard(preset);
                      }}
                      className="p-1.5 rounded bg-cyan-950 hover:bg-cyan-500 hover:text-black text-cyan-400 transition-all"
                      title="Launch directly in Mission Command"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ASTRODYNAMICS & SGP4 MATHEMATICAL PHYSICS FOUNDATION */}
        <section id="physics" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-500 uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>ORBITAL PERTURBATIONS & COORDINATE SYSTEMS</span>
            </div>
            <h2 className="text-2xl font-bold font-mono text-white">
              SGP4 Analytical Model & Coordinate Cascades
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans">
              GaganDrishti computes real-time secular and periodic orbital variations derived from non-spherical Earth oblateness, atmospheric drag braking, and solar-lunar gravitational tides.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#080d1e] p-4 rounded-xl border border-cyan-950 space-y-1.5">
                <div className="text-emerald-400 font-bold flex items-center justify-between">
                  <span>1. Earth Gravitational Oblateness (J2 Harmonics)</span>
                  <span className="text-[10px] text-cyan-600">J2 = 1.08263e-3</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Causes continuous nodal regression (Ω̇) and apsidal rotation (ω̇) essential for Sun-Synchronous Orbit (SSO) ground repeatability over India.
                </p>
              </div>

              <div className="bg-[#080d1e] p-4 rounded-xl border border-cyan-950 space-y-1.5">
                <div className="text-cyan-300 font-bold flex items-center justify-between">
                  <span>2. Coordinate Frame Cascade (TEME → ECEF → ENU)</span>
                  <span className="text-[10px] text-cyan-600">Bowring Geodesy</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Transforms inertial True Equator Mean Equinox (TEME) positions into Greenwich Mean Sidereal Time (GMST) rotated ECEF vectors and local horizontal East-North-Up (ENU) look angles.
                </p>
              </div>

              <div className="bg-[#080d1e] p-4 rounded-xl border border-cyan-950 space-y-1.5">
                <div className="text-amber-400 font-bold flex items-center justify-between">
                  <span>3. Atmospheric Drag & Ballistic Coefficient (B*)</span>
                  <span className="text-[10px] text-cyan-600">Exponential Density</span>
                </div>
                <p className="text-slate-400 font-sans text-xs">
                  Models thermospheric drag deceleration on LEO spacecraft, predicting orbital decay and altitude loss accurately.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Doppler Shift Calculator Sandbox */}
          <div className="lg:col-span-6 bg-[#080d1e] border border-cyan-900/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase">
                  Interactive Doppler Frequency Shift Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                LIVE DEMO
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              As satellites travel at ~7.5 km/s relative to ground stations, their radio transmissions undergo Doppler frequency shifts. Test frequency tuning:
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between text-cyan-400 mb-1">
                  <span>CARRIER FREQUENCY</span>
                  <span className="font-bold">{dopplerFrequency} MHz</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="450"
                  step="0.5"
                  value={dopplerFrequency}
                  onChange={(e) => setDopplerFrequency(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-emerald-400 mb-1">
                  <span>RADIAL VELOCITY (RANGE RATE)</span>
                  <span className="font-bold">{dopplerVelocity} km/s ({dopplerVelocity < 0 ? 'Approaching' : 'Receding'})</span>
                </div>
                <input
                  type="range"
                  min="-7.5"
                  max="7.5"
                  step="0.1"
                  value={dopplerVelocity}
                  onChange={(e) => setDopplerVelocity(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="bg-[#050816] p-4 rounded-xl border border-cyan-950 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">DOPPLER FREQUENCY OFFSET (Δf):</span>
                  <span className={`text-base font-bold ${calculatedShiftHz >= 0 ? 'text-cyan-300' : 'text-amber-400'}`}>
                    {calculatedShiftHz > 0 ? `+${calculatedShiftHz}` : calculatedShiftHz} Hz
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">CORRECTED RX TUNER FREQUENCY:</span>
                  <span className="text-emerald-400 font-bold">
                    {(dopplerFrequency + calculatedShiftHz / 1000000).toFixed(6)} MHz
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onLaunchDashboard(selectedPreset)}
                className="w-full py-2.5 rounded-xl bg-cyan-950/60 border border-cyan-700/60 hover:bg-cyan-900/60 text-cyan-300 font-mono text-xs font-bold transition-all text-center flex items-center justify-center gap-2"
              >
                <span>OPEN REAL-TIME DOPPLER IN MISSION COMMAND</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* MISSION LAUNCH BANNER */}
        <section className="bg-gradient-to-r from-cyan-950/60 via-[#0a122c] to-emerald-950/60 border border-cyan-500/40 rounded-2xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-bold font-mono text-white">
              Ready for Live Ground Pass Prediction & Tracking?
            </h3>
            <p className="text-xs md:text-sm text-slate-300 font-sans max-w-xl">
              Execute SGP4 propagation on custom TLEs, track satellite footprints, visualize polar sky domes, and calculate pass AOS/LOS over Indian spaceports.
            </p>
          </div>

          <button
            onClick={() => onLaunchDashboard(selectedPreset)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-sm px-8 py-4 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider shrink-0"
          >
            <Zap className="w-5 h-5 fill-black" />
            <span>LAUNCH MISSION CONTROL</span>
          </button>
        </section>
      </main>

      {/* Humble footer */}
      <footer className="border-t border-cyan-900/30 bg-[#0a0c16] px-6 py-6 mt-12 text-center text-xs text-cyan-600 font-mono space-y-2">
        <div>
          GAGANDRISHTI SWADESHI SPACE COMMAND WORKSPACE // ISRO GROUND TRACK // UTC {new Date().toISOString().substring(0, 10)}
        </div>
        <div className="text-[11px] text-cyan-400">
          Made with ❤️ by Agnit Dasgupta
        </div>
      </footer>
    </div>
  );
}
