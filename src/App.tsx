import React, { useState, useEffect, useMemo } from 'react';
import TleInput from './components/TleInput';
import WorldMap from './components/WorldMap';
import SkyPlot from './components/SkyPlot';
import OrientationVisualizer from './components/OrientationVisualizer';
import { PassPredictor } from './components/PassPredictor';
import InteractiveGlobe3D from './components/InteractiveGlobe3D';
import LandingPage from './components/LandingPage';
import GaganDrishtiLogo from './components/GaganDrishtiLogo';
import { ObserverLocation, SatelliteState, TleInfo, SatellitePreset } from './types';
import {
  calculateSatelliteState,
  generateGroundTrack,
  parseTle,
  calculateSensorFootprint,
  SATELLITE_PRESETS
} from './utils/satelliteCalc';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Compass,
  Radio,
  MapPin,
  Cpu,
  Sun,
  Moon,
  TrendingDown,
  TrendingUp,
  FastForward,
  Save,
  Globe,
  Map as MapIcon,
  FileText,
  Zap,
  ArrowLeft
} from 'lucide-react';

const GROUND_STATION_PRESETS: ObserverLocation[] = [
  { name: 'ISTRAC ISRO, Bengaluru', lat: 13.03, lon: 77.51, alt: 920 },
  { name: 'SDSC-SHAR Spaceport, Sriharikota', lat: 13.72, lon: 80.23, alt: 10 },
  { name: 'Space Applications Centre, Ahmedabad', lat: 23.03, lon: 72.51, alt: 55 },
  { name: 'Bharati Antarctic Research Station, India', lat: -69.41, lon: 76.19, alt: 35 },
  { name: 'VSSC Terminal, Thiruvananthapuram', lat: 8.53, lon: 76.87, alt: 5 }
];

export default function App() {
  // Navigation View State: 'landing' (Default Modern Landing Page) | 'command' (Full Mission Control)
  const [currentView, setCurrentView] = useState<'landing' | 'command'>('landing');

  // Ground Track View Mode in Command Center: '2d' (Mercator Canvas) | '3d' (Interactive Three.js Globe)
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');

  // TLE States (with localStorage restoration)
  const [line1, setLine1] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('orbital_path_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.line1) return parsed.line1;
      }
    } catch (e) {
      console.error('Failed to restore line1', e);
    }
    return SATELLITE_PRESETS[0].line1;
  });

  const [line2, setLine2] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('orbital_path_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.line2) return parsed.line2;
      }
    } catch (e) {
      console.error('Failed to restore line2', e);
    }
    return SATELLITE_PRESETS[0].line2;
  });

  const [satName, setSatName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('orbital_path_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.satName) return parsed.satName;
      }
    } catch (e) {
      console.error('Failed to restore satName', e);
    }
    return SATELLITE_PRESETS[0].name;
  });

  // Selected Observer Location (starts at ISTRAC Bengaluru or loads from localStorage)
  const [observer, setObserver] = useState<ObserverLocation>(() => {
    try {
      const saved = localStorage.getItem('orbital_path_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.observer &&
          typeof parsed.observer.lat === 'number' &&
          typeof parsed.observer.lon === 'number'
        ) {
          return {
            lat: parsed.observer.lat,
            lon: parsed.observer.lon,
            alt: typeof parsed.observer.alt === 'number' ? parsed.observer.alt : 920,
            name: parsed.observer.name || 'Custom Station'
          };
        }
      }
    } catch (e) {
      console.error('Failed to restore observer location', e);
    }
    return GROUND_STATION_PRESETS[0];
  });

  const [isSavedJustNow, setIsSavedJustNow] = useState<boolean>(false);

  const handleSaveConfig = () => {
    try {
      const config = {
        line1,
        line2,
        satName,
        observer
      };
      localStorage.setItem('orbital_path_config', JSON.stringify(config));
      setIsSavedJustNow(true);
      setTimeout(() => {
        setIsSavedJustNow(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to save session configuration', err);
    }
  };

  // Simulation parameters
  const [time, setTime] = useState<Date>(new Date());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 10x, 60x, 300x, 1800x, 3600x

  // Spacecraft Simulated Orientation offsets
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [yaw, setYaw] = useState<number>(0);
  const [sensorFov, setSensorFov] = useState<number>(12); // camera field of view half angle

  // Parse current active TLE
  const activeTleInfo = useMemo(() => {
    if (!line1 || !line2) return null;
    try {
      return parseTle(satName, line1, line2);
    } catch {
      return null;
    }
  }, [line1, line2, satName]);

  // Handle TLE selection changes from TleInput component
  const handleTleChange = (l1: string, l2: string, name: string) => {
    setLine1(l1);
    setLine2(l2);
    setSatName(name);
  };

  // Keep date updating when playing
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTime((prevTime) => {
        // Increment time based on simulation speed (speed x 100ms update rate)
        const msDelta = 100 * simSpeed;
        return new Date(prevTime.getTime() + msDelta);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, simSpeed]);

  // Synchronous calculation of dynamic satellite states
  const satelliteState = useMemo<SatelliteState | null>(() => {
    if (!line1 || !line2) return null;
    return calculateSatelliteState(line1, line2, time, observer);
  }, [line1, line2, time, observer]);

  // Approximate relative radial velocity (range rate) using finite differences
  // to calculate Doppler Shift
  const dopplerData = useMemo(() => {
    if (!line1 || !line2 || !satelliteState) return null;
    
    // Get state 1 second in the future to compute range delta
    const futureTime = new Date(time.getTime() + 1000);
    const futureState = calculateSatelliteState(line1, line2, futureTime, observer);
    
    if (!futureState) return null;

    const rangeRate = futureState.range - satelliteState.range; // km/s (since delta t = 1s)
    const SPEED_OF_LIGHT = 299792.458; // km/s
    const dopplerFactor = 1.0 - (rangeRate / SPEED_OF_LIGHT);

    // Standard VHF weather satellite transmission freq is usually 137 MHz
    const testFreq = 137.0; // MHz
    const shiftHz = (dopplerFactor - 1.0) * testFreq * 1000000; // Hz

    return {
      rangeRate, // positive = receding, negative = approaching
      dopplerFactor,
      shiftHz
    };
  }, [line1, line2, time, observer, satelliteState]);

  // Compute Ground Track Line Coordinates
  const groundTrack = useMemo(() => {
    if (!line1 || !line2) return [];
    return generateGroundTrack(line1, line2, time, 45, 90, 60);
  }, [line1, line2, time]);

  // Compute displaced Sensor Footprint
  const sensorFootprint = useMemo(() => {
    if (!satelliteState) return null;
    return calculateSensorFootprint(
      satelliteState.lat,
      satelliteState.lon,
      satelliteState.alt,
      pitch,
      roll,
      sensorFov
    );
  }, [satelliteState, pitch, roll, sensorFov]);

  // Handle switching preset from Landing Page or Explorer
  const handleLaunchFromLanding = (preset?: SatellitePreset) => {
    if (preset) {
      setLine1(preset.line1);
      setLine2(preset.line2);
      setSatName(preset.name);
    }
    setCurrentView('command');
  };

  // If user is viewing the modern 3D Landing Page
  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchDashboard={handleLaunchFromLanding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] text-cyan-50 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#083344_1px,transparent_1px)] [background-size:20px_20px]"></div>
      
      {/* Dynamic Header Room with Navigation Tabs */}
      <header className="border-b border-cyan-900/40 bg-[#0a0c16]/80 backdrop-blur-md px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentView('landing')}
            className="hover:scale-105 transition-transform cursor-pointer"
            title="Return to GaganDrishti Overview"
          >
            <GaganDrishtiLogo variant="mark" size="md" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight uppercase font-mono">
                GAGAN<span className="text-cyan-400">DRISHTI</span>
              </h1>
              <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                MISSION COMMAND
              </span>
            </div>
            <p className="text-[9px] text-cyan-600 uppercase tracking-widest font-mono font-bold">
              SWADESHI REAL-TIME ORBITAL TRACKER & GROUND PASS ANALYSIS
            </p>
          </div>
        </div>

        {/* Navigation Link to Landing Page */}
        <div className="flex items-center">
          <button
            onClick={() => setCurrentView('landing')}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-950/60 to-[#080d1e] hover:from-cyan-900/80 hover:to-[#0c142e] border border-cyan-700/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer active:scale-95"
            title="Navigate back to GaganDrishti Landing Page & Architectural Showcase"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold tracking-wider uppercase">BACK TO LANDING PAGE</span>
          </button>
        </div>

        {/* Global Live Clock Room */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] text-cyan-600 uppercase tracking-widest font-bold font-mono">System Status</div>
            <div className="text-xs font-mono text-cyan-400">ALL SYSTEMS NOMINAL</div>
          </div>
          <div className="h-8 w-[1px] bg-cyan-900/50 hidden md:block"></div>
          <div className="text-right">
            <div className="text-[10px] text-cyan-600 uppercase tracking-widest font-bold font-mono">Epoch UTC</div>
            <div className="text-xs font-mono text-cyan-200">
              {time.toISOString().replace('T', ' ').substring(0, 19)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Control Board Container */}
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Simulation Controls & Station Selector */}
        <section className="bg-[#0a0c16] border border-cyan-900/30 rounded-xl p-5 flex flex-col lg:flex-row justify-between gap-4 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          {/* Time playback */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`flex items-center gap-1.5 px-4 py-2 font-bold font-sans text-xs uppercase tracking-widest rounded shadow transition-all ${
                isPaused
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'RESUME SIM' : 'PAUSE TRACKING'}
            </button>

            <button
              onClick={() => {
                setTime(new Date());
                setIsPaused(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-cyan-950/30 border border-cyan-800/50 text-cyan-300 hover:bg-cyan-900/30 text-xs font-mono shadow transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              SYNC CURRENT
            </button>

            <button
              onClick={handleSaveConfig}
              title="Save current TLE satellite and station coordinates to browser localStorage"
              className={`flex items-center gap-1.5 px-4 py-2 rounded text-xs font-mono shadow transition-all duration-300 uppercase tracking-wider ${
                isSavedJustNow
                  ? 'bg-emerald-500 text-black border border-emerald-400 font-bold shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse'
                  : 'bg-emerald-950/20 border border-emerald-800/50 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isSavedJustNow ? 'SAVED OK' : 'SAVE SESSION'}
            </button>

            {/* Sim Speeds */}
            <div className="flex items-center bg-[#05060a] p-1.5 rounded-md border border-cyan-900/30 ml-2">
              <span className="text-[10px] uppercase font-bold text-cyan-600 font-mono px-2">WARP:</span>
              {[1, 10, 60, 300, 1800, 3600].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setSimSpeed(speed)}
                  className={`px-2 py-0.5 text-xs font-mono rounded ${
                    simSpeed === speed
                      ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30'
                      : 'text-cyan-600 hover:text-cyan-300'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Observer Location presets selector */}
          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
            <div className="flex items-center gap-1 text-xs font-mono text-cyan-500">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>STATION:</span>
            </div>
            <select
              value={observer.name}
              onChange={(e) => {
                const selected = GROUND_STATION_PRESETS.find((p) => p.name === e.target.value);
                if (selected) setObserver(selected);
              }}
              className="bg-[#05060a] border border-cyan-800/50 text-xs font-mono text-cyan-100 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
            >
              <option value={observer.name} disabled className="text-cyan-600 font-semibold bg-[#05060a]">
                {observer.name.startsWith('Custom') ? '📍 CUSTOM STATION COORDINATES' : '⚡ BHARATIYA GROUND STATION'}
              </option>
              {GROUND_STATION_PRESETS.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#05060a]">
                  {p.name}
                </option>
              ))}
            </select>

            {/* Custom Coordinates Inputs */}
            <div className="flex items-center gap-1.5 bg-[#05060a] border border-cyan-800/50 px-2.5 py-1 rounded">
              <input
                type="number"
                step="0.01"
                min="-90"
                max="90"
                value={observer.lat}
                onChange={(e) =>
                  setObserver({
                    name: `Custom Location (${parseFloat(e.target.value)}°N, ${observer.lon}°E)`,
                    lat: parseFloat(e.target.value) || 0,
                    lon: observer.lon,
                    alt: observer.alt
                  })
                }
                className="w-14 bg-transparent text-cyan-100 text-xs font-mono text-center focus:outline-none focus:text-cyan-400"
                placeholder="Lat"
              />
              <span className="text-cyan-800 font-mono text-xs">/</span>
              <input
                type="number"
                step="0.01"
                min="-180"
                max="180"
                value={observer.lon}
                onChange={(e) =>
                  setObserver({
                    name: `Custom Location (${observer.lat}°N, ${parseFloat(e.target.value)}°E)`,
                    lat: observer.lat,
                    lon: parseFloat(e.target.value) || 0,
                    alt: observer.alt
                  })
                }
                className="w-14 bg-transparent text-cyan-100 text-xs font-mono text-center focus:outline-none focus:text-cyan-400"
                placeholder="Lon"
              />
              <span className="text-[10px] text-cyan-600 font-mono">°</span>
            </div>
          </div>
        </section>

        {/* Live Map / 3D Globe & Polar Radar Plot Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ground Track Viewport with 2D/3D Mode Switcher (takes 2/3 of space) */}
          <div className="lg:col-span-2 h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between bg-[#080d1e] px-4 py-2 rounded-xl border border-cyan-900/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                  {mapMode === '2d' ? '2D Equirectangular Ground Track' : '3D High-Fidelity WebGL Orbital Globe'}
                </span>
              </div>

              {/* 2D / 3D Mode Toggle Button */}
              <div className="flex items-center bg-[#04060f] p-1 rounded-lg border border-cyan-950">
                <button
                  onClick={() => setMapMode('2d')}
                  className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    mapMode === '2d'
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-cyan-400 hover:bg-cyan-950/60'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  2D MAP
                </button>
                <button
                  onClick={() => setMapMode('3d')}
                  className={`px-3 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    mapMode === '3d'
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'text-cyan-400 hover:bg-cyan-950/60'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  3D GLOBE
                </button>
              </div>
            </div>

            {mapMode === '2d' ? (
              <WorldMap
                satelliteState={satelliteState}
                groundTrack={groundTrack}
                observer={observer}
                setObserver={setObserver}
                sensorFootprint={sensorFootprint}
              />
            ) : (
              <InteractiveGlobe3D
                activeTle1={line1}
                activeTle2={line2}
                satName={satName}
                observer={observer}
                simulationTime={time}
                compact={false}
              />
            )}
          </div>

          {/* Sky Radar Scope takes 1/3 */}
          <div className="h-full">
            <SkyPlot
              satelliteState={satelliteState}
              groundTrack={groundTrack}
              observerLat={observer.lat}
              observerLon={observer.lon}
              observerAlt={observer.alt}
              line1={line1}
              line2={line2}
            />
          </div>
        </section>

        {/* Spacecraft Attitude / Orientation controls & Dynamic Telemetry Readout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Telemetry Panel */}
          <div className="bg-[#0a0c16] border border-cyan-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)] flex flex-col h-full justify-between">
            <div className="px-5 py-4 bg-[#0a0c16] border-b border-cyan-900/30 flex justify-between items-center">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-500 animate-spin-slow" />
                Live Telemetry Feed
              </span>
            </div>

            <div className="p-4 space-y-3.5 flex-1 bg-[#05060a]/40">
              
              {/* Speed & Altitude */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyan-950/20 border border-cyan-900/20 rounded p-3 text-center">
                  <span className="text-[10px] text-cyan-600 block font-mono uppercase font-bold">ALTITUDE</span>
                  <span className="text-xl font-mono text-cyan-100 font-bold tracking-tight">
                    {satelliteState ? `${satelliteState.alt.toFixed(1)}` : '--'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono ml-1">km</span>
                </div>
                <div className="bg-cyan-950/20 border border-cyan-900/20 rounded p-3 text-center">
                  <span className="text-[10px] text-cyan-600 block font-mono uppercase font-bold">ORBITAL SPEED</span>
                  <span className="text-xl font-mono text-cyan-100 font-bold tracking-tight">
                    {satelliteState ? `${satelliteState.speed.toFixed(3)}` : '--'}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono ml-1">km/s</span>
                </div>
              </div>

              {/* Station relative coordinates */}
              <div className="bg-cyan-950/20 border border-cyan-900/20 rounded p-3 space-y-2">
                <span className="text-[10px] text-cyan-600 block font-mono uppercase font-bold">GROUND STATION REFERENCE</span>
                
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="bg-[#05060a] p-1.5 rounded border border-cyan-950">
                    <span className="text-[8px] text-cyan-600 block font-mono font-semibold">AZIMUTH</span>
                    <span className="font-mono text-xs text-cyan-300">
                      {satelliteState ? `${satelliteState.azimuth.toFixed(1)}°` : '--'}
                    </span>
                  </div>
                  <div className="bg-[#05060a] p-1.5 rounded border border-cyan-950">
                    <span className="text-[8px] text-cyan-600 block font-mono font-semibold">ELEVATION</span>
                    <span className={`font-mono text-xs ${satelliteState && satelliteState.elevation >= 0 ? 'text-teal-400 font-bold' : 'text-cyan-600'}`}>
                      {satelliteState ? `${satelliteState.elevation.toFixed(1)}°` : '--'}
                    </span>
                  </div>
                  <div className="bg-[#05060a] p-1.5 rounded border border-cyan-950">
                    <span className="text-[8px] text-cyan-600 block font-mono font-semibold">RANGE</span>
                    <span className="font-mono text-xs text-cyan-300">
                      {satelliteState ? `${Math.round(satelliteState.range)}` : '--'}
                      <span className="text-[8px] text-cyan-500 ml-0.5">km</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Doppler & RF Shift values */}
              <div className="bg-cyan-950/20 border border-cyan-900/20 rounded p-3 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-cyan-600 block uppercase font-bold">RF DOPPLER SHIFT</span>
                  {dopplerData ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {dopplerData.rangeRate < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5 text-teal-400" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                      )}
                      <span className={dopplerData.rangeRate < 0 ? 'text-teal-400' : 'text-rose-500'}>
                        {dopplerData.shiftHz >= 0 ? '+' : ''}
                        {(dopplerData.shiftHz / 1000).toFixed(2)} kHz
                      </span>
                    </div>
                  ) : '--'}
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-cyan-600 block font-bold">DOPPLER FACTOR</span>
                  <span className="text-cyan-300 text-xs font-mono">
                    {dopplerData ? dopplerData.dopplerFactor.toFixed(8) : '--'}
                  </span>
                </div>
              </div>

              {/* Sunlit / Shadow Eclipse status */}
              <div className="bg-cyan-950/20 border border-cyan-900/20 rounded p-3 flex justify-between items-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-cyan-600 block uppercase font-bold">SUNLIT / ECLIPSE</span>
                  <span className="text-cyan-300 font-semibold flex items-center gap-1 mt-0.5">
                    {satelliteState ? (
                      satelliteState.sunlit ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span className="text-amber-400 font-bold">SUNLIT (DAYLIGHT)</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-cyan-400 font-bold">ECLIPSE (EARTH SHADOW)</span>
                        </>
                      )
                    ) : '--'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-cyan-600 block font-bold">OBSERVER STATUS</span>
                  <span className={`text-[11px] font-bold ${satelliteState?.visible ? 'text-teal-400' : 'text-cyan-700'}`}>
                    {satelliteState?.visible ? '📡 COMS ACQUIRED' : '❌ LOSS OF SIGNAL'}
                  </span>
                </div>
              </div>

            </div>

            <div className="px-5 py-3 bg-[#0a0c16]/50 border-t border-cyan-900/30 text-[10px] font-mono text-cyan-600 flex justify-between items-center">
              <span>NORAD ID: {activeTleInfo?.noradId || '--'}</span>
              <span>Intl Desig: {activeTleInfo?.intlDesignator || '--'}</span>
            </div>
          </div>

          {/* Orientation & Gyroscope visualizer takes remaining 2/3 */}
          <div className="lg:col-span-2">
            <OrientationVisualizer
              satelliteState={satelliteState}
              pitch={pitch}
              setPitch={setPitch}
              roll={roll}
              setRoll={setRoll}
              yaw={yaw}
              setYaw={setYaw}
              sensorFov={sensorFov}
              setSensorFov={setSensorFov}
              sensorFootprint={sensorFootprint}
            />
          </div>

        </section>

        {/* Pass Predictions Section */}
        <section className="w-full">
          <PassPredictor
            line1={line1}
            line2={line2}
            satelliteName={activeTleInfo?.name || 'Satellite'}
            observer={observer}
            currentTime={time}
            onSetTime={(date) => {
              setTime(date);
              setIsPaused(true); // Pause simulation to inspect specific pass state!
            }}
          />
        </section>

        {/* Config Inputs (TLE Presets & Orbital Mechanics Breakdown) */}
        <section className="w-full">
          <TleInput
            onTleChange={handleTleChange}
            activeTleInfo={activeTleInfo}
            line1={line1}
            line2={line2}
          />
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
