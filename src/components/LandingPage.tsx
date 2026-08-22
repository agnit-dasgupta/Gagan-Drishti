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
  ChevronRight,
  Shield,
  Activity,
  ArrowUpRight,
  Clock,
  Eye,
  Crosshair,
  Volume2,
  Terminal,
  Cloud,
  Database,
  Server,
  Network,
  HardDrive,
  Workflow,
  ShieldCheck,
  BarChart3,
  Code2,
  Building2,
  Sprout,
  Truck,
  Anchor,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  onLaunchDashboard: (preset?: SatellitePreset) => void;
}

export default function LandingPage({ onLaunchDashboard }: LandingPageProps) {
  const [selectedPreset, setSelectedPreset] = useState<SatellitePreset>(SATELLITE_PRESETS[0]);
  const [activeApiTab, setActiveApiTab] = useState<'agri' | 'logistics' | 'orbit' | 'telemetry'>('agri');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Quick Doppler calculator demo interactive state
  const [dopplerFrequency, setDopplerFrequency] = useState<number>(137.5); // MHz
  const [dopplerVelocity, setDopplerVelocity] = useState<number>(-4.8); // km/s (approaching)

  const calculatedShiftHz = Math.round(
    ((1.0 - dopplerVelocity / 299792.458) - 1.0) * dopplerFrequency * 1000000
  );

  const apiExamples = {
    agri: {
      title: 'Precision Agriculture & Yield Forecasting',
      endpoint: 'POST /v1/analytics/crop-yield-forecast',
      description: 'Enterprise query requesting satellite multispectral indices and vegetative moisture without downloading 40 GB of raw optical bands.',
      request: `curl -X POST https://api.gagandrishti.space/v1/analytics/crop-yield \\
  -H "Authorization: Bearer gd_live_89f0a2c41" \\
  -H "Content-Type: application/json" \\
  -d '{
    "coordinates": {"lat": 21.1458, "lon": 79.0882},
    "spatial_resolution_m": 10,
    "indices": ["NDVI", "NDRE", "EVI"],
    "temporal_window_days": 14
  }'`,
      response: `{
  "status": "success",
  "data_center_region": "ap-south-1 (Mumbai Orbital Link)",
  "raw_downlink_ingested_at": "2026-08-22T04:12:08Z",
  "processing_latency_ms": 184,
  "data_gravity_savings": "99.98% (Transferred 1.2 KB vs 38.4 GB Raw)",
  "forecast": {
    "crop_stress_index": 0.14,
    "soil_moisture_estimate_pct": 28.6,
    "predicted_yield_delta_pct": "+6.4%",
    "anomalies_detected": 0
  }
}`
    },
    logistics: {
      title: 'Maritime & Global Logistics Intelligence',
      endpoint: 'GET /v1/maritime/port-congestion-stream',
      description: 'Logistics data lake synchronizing vessel AIS signals with SAR radar passes over the Indian Ocean.',
      request: `curl -X GET "https://api.gagandrishti.space/v1/maritime/swath-tracking?aoi=IN-MUN-PORT&sensor=SAR" \\
  -H "Authorization: Bearer gd_live_89f0a2c41"`,
      response: `{
  "port_id": "IN-MUN-PORT (Mundra, Gujarat)",
  "sat_source": "EOS-04 (RISAT-1A SAR)",
  "pass_timestamp_utc": "2026-08-22T09:44:12Z",
  "vessel_count_at_berth": 42,
  "anchorage_dwell_time_avg_hours": 18.2,
  "radar_cloud_penetration": "100%",
  "egress_data_optimized": "3.4 KB streamed directly to Enterprise Data Lake"
}`
    },
    orbit: {
      title: 'Orbital SGP4 State & Pass Geometry',
      endpoint: 'GET /v1/orbit/sgp4/state',
      description: 'Sub-millisecond trajectory state vectors and ground pass prediction for spaceflight operators.',
      request: `curl -X GET "https://api.gagandrishti.space/v1/orbit/sgp4/state?norad_id=51656&observer=ISTRAC" \\
  -H "Authorization: Bearer gd_live_89f0a2c41"`,
      response: `{
  "norad_id": 51656,
  "satellite_name": "EOS-04 (RISAT-1A)",
  "epoch_propagation_utc": "2026-08-22T18:30:00Z",
  "coordinates": {
    "lat": 14.281,
    "lon": 79.914,
    "altitude_km": 535.84,
    "velocity_km_s": 7.592
  },
  "look_angles": {
    "azimuth_deg": 142.3,
    "elevation_deg": 68.4,
    "range_km": 574.1,
    "doppler_shift_hz": -4210
  }
}`
    },
    telemetry: {
      title: 'Space-to-Cloud Downlink Ingestion',
      endpoint: 'POST /v1/ingest/ground-station-downlink',
      description: 'Zero-latency ingestion webhook connected directly to AWS Ground Station & Azure Orbital data center endpoints.',
      request: `curl -X POST https://api.gagandrishti.space/v1/ingest/ground-station \\
  -H "X-Cloud-Antenna: AWS-GS-Mumbai-1" \\
  -d '{
    "mission_id": "CHANDRAYAAN-3-PROP",
    "carrier_freq_ghz": 8.45,
    "stream_codec": "VITA-49.2",
    "direct_s3_bucket": "s3://gagandrishti-downlink-ap-south-1"
  }'`,
      response: `{
  "ingest_status": "LOCKED",
  "ingest_latency_ms": 12,
  "frame_sync_errors": 0,
  "vit49_packets_processed": 142000,
  "converted_formats": ["Cloud-Optimized GeoTIFF", "Zarr Spatial Array", "STAC JSON"],
  "daas_distribution_status": "READY_FOR_B2B_SUBSCRIBERS"
}`
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider font-mono uppercase text-white">
                GAGAN<span className="text-cyan-400">DRISHTI</span>
              </h1>
              <span className="text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                GDaaS
              </span>
            </div>
            <p className="text-[10px] text-cyan-600 uppercase tracking-widest font-mono font-bold">
              SPACE-TO-CLOUD INFRASTRUCTURE & GEOSPATIAL DATA-AS-A-SERVICE
            </p>
          </div>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-3 md:gap-6">
          <nav className="hidden lg:flex items-center gap-5 text-xs font-mono text-cyan-400/80">
            <a href="#space-to-cloud" className="hover:text-cyan-200 transition-colors">SPACE-TO-CLOUD</a>
            <a href="#data-gravity" className="hover:text-cyan-200 transition-colors">DATA GRAVITY</a>
            <a href="#enterprise-api" className="hover:text-cyan-200 transition-colors">ENTERPRISE DaaS</a>
            <a href="#tech-stack" className="hover:text-cyan-200 transition-colors">CLOUD STACK</a>
            <a href="#globe3d" className="hover:text-cyan-200 transition-colors">3D SIMULATION</a>
            <a href="#physics" className="hover:text-cyan-200 transition-colors">SGP4 ASTRODYNAMICS</a>
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
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 space-y-20 relative z-10">

        {/* HERO SECTION: Strategic Value Proposition */}
        <section className="space-y-8 pt-4">
          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>NEXT-GEN HYPERSCALE GEOSPATIAL DATA-AS-A-SERVICE (GDaaS)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-mono text-white tracking-tight leading-tight">
              The Space-to-Cloud <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Translation Layer</span> for Aerospace Data
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans max-w-3xl">
              Major cloud providers build the antennas. <strong className="text-white font-semibold">GaganDrishti sits inside their big data centers</strong>—ingesting raw satellite downlinks the millisecond they arrive, executing petabyte-scale compute at the data source, and delivering instant, clean intelligence APIs directly into enterprise data lakes.
            </p>

            {/* Strategic Value Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onLaunchDashboard(selectedPreset)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-sm px-6 py-3.5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 fill-black" />
                ENTER MISSION COMMAND CONSOLE
              </button>

              <a
                href="#enterprise-api"
                className="flex items-center gap-2 bg-[#080d1e] hover:bg-[#0c142e] border border-cyan-800/60 text-cyan-300 font-mono text-sm px-6 py-3.5 rounded-xl transition-all shadow"
              >
                <Code2 className="w-4 h-4" />
                EXPLORE GDaaS API SUITE
              </a>
            </div>
          </div>

          {/* 4 Core Pillars Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="bg-[#080d1e] border border-cyan-950 hover:border-cyan-800/80 p-5 rounded-2xl transition-all space-y-3 relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                1. Space-to-Cloud Hook
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Co-located at AWS Ground Station & Azure Orbital endpoints. Ingests raw downlink streams directly without building costly physical antenna dishes.
              </p>
            </div>

            <div className="bg-[#080d1e] border border-cyan-950 hover:border-cyan-800/80 p-5 rounded-2xl transition-all space-y-3 relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                2. Zero Data Gravity
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Brings compute directly to petabyte datasets inside the data center. Clients query massive spatial indexes and receive lightweight insights in milliseconds.
              </p>
            </div>

            <div className="bg-[#080d1e] border border-cyan-950 hover:border-cyan-800/80 p-5 rounded-2xl transition-all space-y-3 relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                3. Enterprise B2B Layer
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                The translation layer for corporate data lakes in agriculture, mining, maritime & defense. Automated morning API pings fuel internal BI systems.
              </p>
            </div>

            <div className="bg-[#080d1e] border border-cyan-950 hover:border-cyan-800/80 p-5 rounded-2xl transition-all space-y-3 relative overflow-hidden group">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="font-mono text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                4. Cloud-Native Stack
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Distributed object storage (S3/Blob), Cloud-Optimized GeoTIFFs (COGs), Kubernetes SGP4 clusters, and low-latency gRPC/REST delivery.
              </p>
            </div>
          </div>
        </section>

        {/* PILLAR 1: SPACE-TO-CLOUD INFRASTRUCTURE HOOK */}
        <section id="space-to-cloud" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-b from-[#080d1e] to-[#050816] p-8 md:p-10 rounded-3xl border border-cyan-900/40 shadow-2xl">
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>PILLAR 01 // DIRECT INFRASTRUCTURE CO-LOCATION</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white leading-snug">
              Hooking into "Space-to-Cloud" Ground Stations
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Hyperscale cloud giants (AWS Ground Station & Microsoft Azure Orbital) have physically deployed satellite antenna arrays adjacent to their primary data center campuses.
            </p>

            <div className="bg-cyan-950/30 border border-cyan-800/50 p-4 rounded-xl space-y-2">
              <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase">
                GaganDrishti's Strategic Position:
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                <strong className="text-white">We do not need to build physical antennas.</strong> GaganDrishti sits directly inside these hyperscale data centers, ingesting raw downlink streams the exact millisecond they hit the cloud fabric, processing them instantly, and offering them as a clean, standardized <span className="text-cyan-400 font-semibold font-mono">DaaS (Data-as-a-Service) API</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <div className="bg-[#05060d] p-3 rounded-lg border border-cyan-950">
                <div className="text-cyan-500 font-bold">Zero Physical Capex</div>
                <div className="text-slate-400 text-[11px] mt-1 font-sans">Leverages existing multi-billion dollar antenna networks worldwide.</div>
              </div>
              <div className="bg-[#05060d] p-3 rounded-lg border border-cyan-950">
                <div className="text-emerald-400 font-bold">&lt; 15 ms Ingestion</div>
                <div className="text-slate-400 text-[11px] mt-1 font-sans">Direct fiber interconnect from dish demodulator to GaganDrishti pipeline.</div>
              </div>
            </div>
          </div>

          {/* Visual Architecture Diagram */}
          <div className="lg:col-span-6 bg-[#05060d] border border-cyan-900/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Direct Cloud Interconnect Flow</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">ACTIVE LINK</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* Step 1 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080d1e] border border-cyan-950">
                <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                  🛰️
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-[11px]">LEO / GEO Satellite Downlink</div>
                  <div className="text-slate-500 text-[10px]">X-Band / Ka-Band high-bandwidth transmission</div>
                </div>
              </div>

              <div className="flex justify-center text-cyan-600">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080d1e] border border-cyan-950">
                <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 shrink-0 font-bold">
                  📡
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-[11px]">AWS Ground Station / Azure Orbital</div>
                  <div className="text-slate-500 text-[10px]">Physical antenna dishes co-located at data center edge</div>
                </div>
              </div>

              <div className="flex justify-center text-cyan-600">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>

              {/* Step 3 (GaganDrishti) */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-emerald-950/60 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-black shrink-0 font-bold">
                  ⚡
                </div>
                <div className="flex-1">
                  <div className="text-cyan-300 font-bold text-xs">GaganDrishti Ingest Engine & SGP4 Normalizer</div>
                  <div className="text-slate-300 text-[10px]">Demodulates VITA-49, indexes spatial tiles, computes ephemerides</div>
                </div>
              </div>

              <div className="flex justify-center text-cyan-600">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>

              {/* Step 4 */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#080d1e] border border-cyan-950">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
                  🏢
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-[11px]">Enterprise Clients (Agri, Mining, Logistics, Defense)</div>
                  <div className="text-emerald-400 text-[10px]">Receives instant REST / GraphQL / gRPC intelligence feeds</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 2: SOLVING DATA GRAVITY */}
        <section id="data-gravity" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 bg-[#080d1e] border border-cyan-900/40 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold font-mono text-white uppercase">
                  Data Gravity Paradigm Shift
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">PETABYTE SCALE OPTIMIZATION</span>
            </div>

            {/* Comparison Grid */}
            <div className="space-y-4">
              {/* The Old Broken Way */}
              <div className="bg-[#05060d] p-4 rounded-xl border border-rose-950/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-rose-400 font-bold">
                  <span>❌ THE OLD WAY (Moving Data to User)</span>
                  <span className="text-[10px] bg-rose-950/60 px-2 py-0.5 rounded">HIGH LATENCY & EGRESS</span>
                </div>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Clients download massive 50 GB GeoTIFFs and continuous 100 GB SAR radar passes to local machines. Network bottlenecks, staggering AWS egress bills, and heavy workstation compute required.
                </p>
              </div>

              {/* The GaganDrishti Way */}
              <div className="bg-gradient-to-b from-cyan-950/40 to-emerald-950/30 p-4 rounded-xl border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-emerald-300 font-bold">
                  <span>✅ GAGANDRISHTI GDaaS (Bringing Compute to Data)</span>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">ZERO EGRESS WASTAGE</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Massive aerospace datasets stay anchored inside our data center object stores. Clients execute targeted analytical queries and machine learning models directly on our cluster, receiving lightweight JSON/Parquet insights in &lt; 200 ms.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono pt-2 border-t border-cyan-950">
              <div className="p-2 bg-[#05060d] rounded-lg">
                <div className="text-xs text-emerald-400 font-bold">99.9%</div>
                <div className="text-[9px] text-slate-500">Bandwidth Saved</div>
              </div>
              <div className="p-2 bg-[#05060d] rounded-lg">
                <div className="text-xs text-cyan-300 font-bold">100x</div>
                <div className="text-[9px] text-slate-500">Faster Time-to-Insight</div>
              </div>
              <div className="p-2 bg-[#05060d] rounded-lg">
                <div className="text-xs text-white font-bold">$0</div>
                <div className="text-[9px] text-slate-500">Client Egress Fees</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>PILLAR 02 // MASSIVE DATA SCALE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white leading-snug">
              Solving the "Data Gravity" Problem
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Aerospace data—high-resolution optical imagery, Synthetic Aperture Radar (SAR), continuous drone telemetry, and 3D spatial models—is measured in petabytes. It is physically too large and economically irrational for clients to download.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-start gap-3 bg-[#080d1e] p-3.5 rounded-xl border border-cyan-950">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="font-sans text-xs text-slate-300">
                  <strong className="text-white font-mono text-xs block">Data-Center Native Hosting:</strong>
                  GaganDrishti hosts petabyte-scale orbital archives right at the core of the cloud backbone.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#080d1e] p-3.5 rounded-xl border border-cyan-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="font-sans text-xs text-slate-300">
                  <strong className="text-white font-mono text-xs block">Compute-Over-Data Execution:</strong>
                  Clients invoke spatial algorithms, spatial joins, and ML filters server-side, eliminating local hardware requirements.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 3: ENTERPRISE B2B INTEGRATION & INTERACTIVE API SUITE */}
        <section id="enterprise-api" className="space-y-6 bg-[#080d1e] border border-cyan-900/40 p-8 md:p-10 rounded-3xl shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-cyan-900/40 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>PILLAR 03 // THE TRANSLATION LAYER FOR ENTERPRISE DATA LAKES</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
                Enterprise B2B Data-as-a-Service (GDaaS) API
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-2xl">
                Enterprises in agriculture, logistics, mining, and defense need aerospace insights without the burden of building custom orbital astrodynamics pipelines.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="flex items-center gap-2 font-mono text-xs text-amber-300 bg-amber-950/50 px-3 py-1.5 rounded-lg border border-amber-800/60">
                <span className="text-[10px]">✨</span>
                <span>ARCHITECTURAL VISION // CONCEPTUAL</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800">
                <Workflow className="w-4 h-4 text-cyan-300" />
                <span>AUTOMATED ENTERPRISE SYNC</span>
              </div>
            </div>
          </div>

          {/* Vision / Dream Disclaimer Banner */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-xs font-mono text-amber-200/90 leading-relaxed">
            <span className="text-base shrink-0 mt-0.5">💭</span>
            <div>
              <strong className="text-amber-300 font-semibold block uppercase text-[11px] tracking-wider mb-0.5">
                Note / Vision Disclaimer:
              </strong>
              <span>
                The API payloads and endpoints illustrated below are not live production code—they represent my conceptual dream and architectural blueprint for how GaganDrishti will bridge space-to-cloud data center pipelines for global enterprise data lakes.
              </span>
            </div>
          </div>

          {/* Industry Vertical Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#05060d] p-4 rounded-xl border border-cyan-950 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                <Sprout className="w-4 h-4" />
                <span>Precision Agriculture</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Automated morning API pings query vegetative health, soil moisture indices, and crop yield forecasting for millions of hectares.
              </p>
            </div>

            <div className="bg-[#05060d] p-4 rounded-xl border border-cyan-950 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <Anchor className="w-4 h-4" />
                <span>Maritime & Ports</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Real-time SAR radar cross-referencing with AIS telemetry for port congestion management and dark-vessel tracking.
              </p>
            </div>

            <div className="bg-[#05060d] p-4 rounded-xl border border-cyan-950 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                <Truck className="w-4 h-4" />
                <span>Global Logistics & Supply</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Tracking critical chokepoints, canal transit delays, and infrastructure monitoring fed directly into SAP/Oracle ERPs.
              </p>
            </div>

            <div className="bg-[#05060d] p-4 rounded-xl border border-cyan-950 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Aerospace & Defense</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Space situational awareness (SSA), conjunction assessment warnings, and rapid target pass calculation over borders.
              </p>
            </div>
          </div>

          {/* Interactive Live API Playground */}
          <div className="mt-8 bg-[#05060d] border border-cyan-900/60 rounded-2xl overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex flex-wrap border-b border-cyan-900/40 bg-[#080d1e] px-4 pt-3 gap-2">
              <button
                onClick={() => setActiveApiTab('agri')}
                className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 ${
                  activeApiTab === 'agri'
                    ? 'bg-[#05060d] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                Crop Yield Analytics
              </button>

              <button
                onClick={() => setActiveApiTab('logistics')}
                className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 ${
                  activeApiTab === 'logistics'
                    ? 'bg-[#05060d] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                <Anchor className="w-3.5 h-3.5" />
                Maritime Port Ingestion
              </button>

              <button
                onClick={() => setActiveApiTab('orbit')}
                className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 ${
                  activeApiTab === 'orbit'
                    ? 'bg-[#05060d] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                SGP4 State Vector
              </button>

              <button
                onClick={() => setActiveApiTab('telemetry')}
                className={`px-4 py-2 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 ${
                  activeApiTab === 'telemetry'
                    ? 'bg-[#05060d] text-cyan-300 border-t-2 border-cyan-400 border-x border-cyan-900/60'
                    : 'text-slate-400 hover:text-cyan-200'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                Space-to-Cloud Hook
              </button>
            </div>

            {/* Tab Details */}
            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {apiExamples[activeApiTab].endpoint.split(' ')[0]}
                    </span>
                    <span className="font-mono text-xs text-white">
                      {apiExamples[activeApiTab].endpoint.split(' ')[1]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-sans mt-1">
                    {apiExamples[activeApiTab].description}
                  </p>
                </div>

                <button
                  onClick={() => handleCopyCode(apiExamples[activeApiTab].request)}
                  className="flex items-center gap-1.5 font-mono text-xs text-cyan-400 hover:text-cyan-200 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800 transition-all shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'COPIED TO CLIPBOARD' : 'COPY cURL'}</span>
                </button>
              </div>

              {/* Code Grid: Request vs Instant Response */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
                {/* Request */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Enterprise Request Payload
                  </div>
                  <pre className="bg-[#080d1e] p-4 rounded-xl border border-cyan-950 text-cyan-200 overflow-x-auto text-[11px] leading-relaxed">
                    <code>{apiExamples[activeApiTab].request}</code>
                  </pre>
                </div>

                {/* Response */}
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center justify-between">
                    <span>Clean GDaaS Insights Response (200 OK)</span>
                    <span className="text-[9px] text-slate-500 font-normal">LATENCY: ~180ms</span>
                  </div>
                  <pre className="bg-[#080d1e] p-4 rounded-xl border border-cyan-950 text-emerald-300 overflow-x-auto text-[11px] leading-relaxed">
                    <code>{apiExamples[activeApiTab].response}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLAR 4: THE CLOUD-NATIVE GDaaS TECH STACK */}
        <section id="tech-stack" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-cyan-900/40 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider">
                <Network className="w-4 h-4 text-purple-400" />
                <span>PILLAR 04 // CLOUD-NATIVE ARCHITECTURE BLUEPRINT</span>
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">
                Engineered for Hyperscale Data Centers
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Transforming from a dashboard tool to mission-critical business infrastructure
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Storage Layer */}
            <div className="bg-[#080d1e] border border-cyan-950 p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800 flex items-center justify-center text-purple-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-mono text-white">
                  Distributed Storage Tier
                </h3>
                <p className="text-xs font-mono text-purple-400">
                  S3 / Azure Blob / COG / Zarr / STAC
                </p>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Optimized specifically for Cloud-Optimized GeoTIFFs (COGs), multi-dimensional Zarr arrays, and SpatioTemporal Asset Catalog (STAC) structures allowing direct byte-range queries without full file scans.
              </p>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-cyan-950">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  HTTP Range-Request Chunking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Petabyte-Scale Spatial Indexing
                </li>
              </ul>
            </div>

            {/* Processing Layer */}
            <div className="bg-[#080d1e] border border-cyan-950 p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-mono text-white">
                  High-Performance Compute
                </h3>
                <p className="text-xs font-mono text-cyan-400">
                  Kubernetes / SGP4 / GPU Workers
                </p>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Auto-scaling Kubernetes clusters execute analytical SGP4 orbital propagation, Bowring coordinate geodetic transformations, and computer-vision segmentation pipelines concurrently.
              </p>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-cyan-950">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Sub-millisecond SGP4 Matrix Math
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Serverless Event-Driven Workers
                </li>
              </ul>
            </div>

            {/* Delivery Layer */}
            <div className="bg-[#080d1e] border border-cyan-950 p-6 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold font-mono text-white">
                  Low-Latency Delivery Tier
                </h3>
                <p className="text-xs font-mono text-emerald-400">
                  REST / GraphQL / gRPC / Webhooks
                </p>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Streams high-value insights seamlessly to customer data lakes and operational command rooms via ultra-low-latency REST, GraphQL, and binary gRPC telemetry channels.
              </p>
              <ul className="text-xs font-mono text-slate-300 space-y-1.5 pt-2 border-t border-cyan-950">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Sub-Second Global Streaming
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Role-Based Tokenized Auth
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3D INTERACTIVE GLOBE & LIVE SATELLITE ENGINE DEMO */}
        <section id="globe3d" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-cyan-900/40 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                <GlobeIcon className="w-4 h-4 text-cyan-400" />
                <span>REAL-TIME 3D ORBITAL SIMULATION BENCHMARK</span>
              </div>
              <h2 className="text-2xl font-bold font-mono text-white">
                Live 3D Astrodynamics Engine & Ground Passes
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Interactive WebGL proof of GaganDrishti's real-time SGP4 coordinate cascade
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#080d1e] p-6 sm:p-8 rounded-3xl border border-cyan-900/40">
            {/* Left Column: Mission Narrative */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>ACTIVE SATELLITE: {selectedPreset.name}</span>
              </div>

              <h3 className="text-2xl font-bold font-mono text-white">
                High-Precision Trajectory & Attitude Telemetry
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Visualizing orbital ground swaths, polar sky tracking domes, and sensor pointing attitudes over the Indian subcontinent and international spaceports in real-time.
              </p>

              {/* Live Telemetry Metric Badges */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="bg-[#05060d] p-3 rounded-xl border border-cyan-950">
                  <div className="text-[10px] uppercase font-mono text-cyan-600 font-bold">Accuracy</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">±1.2 km</div>
                  <div className="text-[9px] text-slate-500 font-mono">SGP4 WGS-84</div>
                </div>
                <div className="bg-[#05060d] p-3 rounded-xl border border-cyan-950">
                  <div className="text-[10px] uppercase font-mono text-cyan-600 font-bold">Latency</div>
                  <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">&lt; 0.4 ms</div>
                  <div className="text-[9px] text-slate-500 font-mono">Client Calc</div>
                </div>
                <div className="bg-[#05060d] p-3 rounded-xl border border-cyan-950">
                  <div className="text-[10px] uppercase font-mono text-cyan-600 font-bold">Stations</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">ISRO / Global</div>
                  <div className="text-[9px] text-slate-500 font-mono">ISTRAC, SDSC</div>
                </div>
              </div>

              <button
                onClick={() => onLaunchDashboard(selectedPreset)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-bold font-mono text-xs px-6 py-3 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all uppercase tracking-wider"
              >
                <Zap className="w-4 h-4 fill-black" />
                OPEN {selectedPreset.name} IN FULL MISSION COMMAND
              </button>
            </div>

            {/* Right Column: Interactive 3D Earth Globe with Real Orbit and Satellite */}
            <div className="lg:col-span-7">
              <InteractiveGlobe3D
                currentPreset={selectedPreset}
                satName={selectedPreset.name}
                onLaunchDashboard={() => onLaunchDashboard(selectedPreset)}
              />
            </div>
          </div>
        </section>

        {/* SATELLITE FLEET SELECTOR & TRACKING PRESETS */}
        <section id="satellites" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-cyan-900/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-500 uppercase">
                <Crosshair className="w-3.5 h-3.5" />
                <span>PRE-INDEXED SATELLITE CONSTELLATIONS</span>
              </div>
              <h2 className="text-2xl font-bold font-mono text-white mt-1">
                ISRO Fleet & Space Station Targets
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Select any mission to test orbital propagation & pass predictions
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
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Radio className="w-3.5 h-3.5" />
              <span>SWADESHI ORBITAL PLATFORM</span>
            </div>
            <h3 className="text-2xl font-bold font-mono text-white">
              Experience the Live GaganDrishti GDaaS Platform
            </h3>
            <p className="text-xs md:text-sm text-slate-300 font-sans max-w-xl">
              Execute real-time SGP4 orbital propagation, simulate ground passes over ISRO spaceports, analyze polar sky domes, and evaluate sub-second telemetry feeds.
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

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

