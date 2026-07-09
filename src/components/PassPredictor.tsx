import React, { useState, useMemo } from 'react';
import { ObserverLocation, SatellitePass } from '../types';
import { predictSatellitePasses } from '../utils/satelliteCalc';
import { Calendar, Clock, Compass, TrendingUp, Eye, ArrowRight, Play, Hourglass, Download } from 'lucide-react';

interface PassPredictorProps {
  line1: string;
  line2: string;
  satelliteName: string;
  observer: ObserverLocation;
  currentTime: Date;
  onSetTime: (date: Date) => void;
}

export function PassPredictor({
  line1,
  line2,
  satelliteName,
  observer,
  currentTime,
  onSetTime,
}: PassPredictorProps) {
  const [lookaheadHours, setLookaheadHours] = useState<number>(24);

  // Ground the pass prediction start time to the nearest minute to prevent continuous recalculation jitter as the clock ticks seconds
  const predictionBaselineTime = useMemo(() => {
    return new Date(Math.floor(currentTime.getTime() / 60000) * 60000);
  }, [currentTime]);

  // Predict passes for selected satellite & station
  const passes = useMemo(() => {
    return predictSatellitePasses(line1, line2, observer, predictionBaselineTime, lookaheadHours);
  }, [line1, line2, observer, predictionBaselineTime, lookaheadHours]);

  // Check if a pass is currently active (currentTime is between rise and set of any predicted pass)
  const activePass = useMemo(() => {
    return passes.find(
      (p) => currentTime >= p.riseTime && currentTime <= p.setTime
    );
  }, [passes, currentTime]);

  // Helper to convert azimuth to cardinal direction
  const getCardinal = (az: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((az % 360) / 45)) % 8;
    return directions[index];
  };

  // Helper to format duration
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  // Helper to format time to local locale string
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Export predicted pass data as CSV file
  const handleExportCSV = () => {
    if (passes.length === 0) return;

    const headers = [
      'Satellite Name',
      'Observer Station',
      'Observer Latitude',
      'Observer Longitude',
      'Observer Altitude (m)',
      'Rise Time (UTC)',
      'Rise Time (Local)',
      'Peak Time (UTC)',
      'Peak Time (Local)',
      'Set Time (UTC)',
      'Set Time (Local)',
      'Duration (Seconds)',
      'Max Elevation (Degrees)',
      'Start Azimuth (Degrees)',
      'End Azimuth (Degrees)',
      'Start Cardinal',
      'End Cardinal'
    ];

    const rows = passes.map(pass => [
      `"${satelliteName.replace(/"/g, '""')}"`,
      `"${observer.name.replace(/"/g, '""')}"`,
      observer.lat,
      observer.lon,
      observer.alt,
      `"${pass.riseTime.toISOString()}"`,
      `"${pass.riseTime.toLocaleString()}"`,
      `"${pass.peakTime.toISOString()}"`,
      `"${pass.peakTime.toLocaleString()}"`,
      `"${pass.setTime.toISOString()}"`,
      `"${pass.setTime.toLocaleString()}"`,
      pass.durationSeconds,
      pass.maxElevation.toFixed(2),
      pass.startAzimuth.toFixed(2),
      pass.endAzimuth.toFixed(2),
      `"${getCardinal(pass.startAzimuth)}"`,
      `"${getCardinal(pass.endAzimuth)}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);

      const safeSatName = satelliteName.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      const dateStr = predictionBaselineTime.toISOString().split('T')[0];
      link.setAttribute('download', `${safeSatName}_passes_${dateStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  return (
    <div className="flex flex-col bg-[#0a0c16] border border-cyan-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)] h-full">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0a0c16] border-b border-cyan-900/30 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Pass Predictions & Orbit Timings
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export CSV button */}
          {passes.length > 0 && (
            <button
              onClick={handleExportCSV}
              title="Export predicted satellite pass data to CSV"
              className="px-2.5 py-1 text-[10px] font-mono font-bold rounded border border-cyan-500/30 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-[#05060a] p-1 rounded border border-cyan-900/20">
            <span className="text-[10px] font-mono font-bold text-cyan-600 px-1 uppercase">Window:</span>
            {[12, 24, 48].map((hours) => (
              <button
                key={hours}
                onClick={() => setLookaheadHours(hours)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  lookaheadHours === hours
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30'
                    : 'text-cyan-600 hover:text-cyan-400'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto max-h-[380px]">
        {/* Active Pass Alert */}
        {activePass && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 flex justify-between items-center animate-pulse">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Live Active Pass In Progress
                </span>
              </div>
              <div className="text-xs font-mono text-cyan-200 mt-1">
                Max Elevation: <span className="text-emerald-400 font-bold">{activePass.maxElevation.toFixed(1)}°</span>
              </div>
              <div className="text-[10px] font-mono text-cyan-500 leading-normal mt-0.5">
                Rises {getCardinal(activePass.startAzimuth)} → Sets {getCardinal(activePass.endAzimuth)}
              </div>
            </div>
            <button
              onClick={() => onSetTime(activePass.peakTime)}
              className="px-2.5 py-1 text-[10px] font-mono font-bold rounded bg-emerald-500 text-black hover:bg-emerald-400 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" /> Peak View
            </button>
          </div>
        )}

        {/* Passes Table/List */}
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {passes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Hourglass className="w-8 h-8 text-cyan-800 animate-spin-slow mb-2" />
              <p className="text-xs font-mono text-cyan-600">No upcoming passes detected over this ground station within {lookaheadHours} hours.</p>
              <p className="text-[10px] font-sans text-cyan-700 italic mt-1 max-w-[240px]">
                Try selecting a different ground station closer to the orbit, or increase the time window.
              </p>
            </div>
          ) : (
            passes.map((pass) => {
              const isPeakPast = pass.peakTime < currentTime;
              const isCurrentlyHappening = currentTime >= pass.riseTime && currentTime <= pass.setTime;
              
              return (
                <div
                  key={pass.id}
                  className={`group relative p-3 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCurrentlyHappening
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                      : 'bg-[#05060a]/60 border-cyan-950/40 hover:border-cyan-800/40 hover:bg-cyan-950/5'
                  }`}
                >
                  {/* Left Pass Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-100 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-500" />
                        {formatDate(pass.riseTime)}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-500">
                        {formatTime(pass.riseTime)} - {formatTime(pass.setTime)}
                      </span>
                      {isCurrentlyHappening && (
                        <span className="px-1.5 py-0.2 bg-cyan-500/20 border border-cyan-500/40 rounded text-[8px] font-mono font-bold text-cyan-400 uppercase animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-x-4 text-[11px] font-mono">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span className="text-cyan-500">Peak:</span>
                        <span className="text-cyan-200 font-semibold">{pass.maxElevation.toFixed(1)}°</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <Compass className="w-3 h-3 text-cyan-500" />
                        <span className="text-cyan-500">Path:</span>
                        <span className="text-cyan-300 font-semibold flex items-center gap-0.5">
                          {getCardinal(pass.startAzimuth)}
                          <ArrowRight className="w-2.5 h-2.5 text-cyan-600 inline mx-0.5" />
                          {getCardinal(pass.endAzimuth)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & Duration */}
                  <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-cyan-950/30 pt-2 md:pt-0">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-500">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{formatDuration(pass.durationSeconds)}</span>
                    </div>

                    <button
                      onClick={() => onSetTime(pass.peakTime)}
                      title="Jump simulation to peak pass timing"
                      className="px-2.5 py-1 rounded border text-[10px] font-mono font-bold tracking-wide uppercase transition-all flex items-center gap-1 bg-cyan-950/30 border-cyan-800/50 text-cyan-300 hover:bg-cyan-500 hover:text-black hover:border-cyan-500"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Jump
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footnote */}
        <div className="text-[10px] font-mono text-cyan-700 italic mt-3 leading-normal border-t border-cyan-900/10 pt-2.5">
          Pass calculator scans the orbital flight path over the {observer.name.startsWith('Custom') ? 'selected custom coordinates' : `${observer.name} station`}.
        </div>
      </div>
    </div>
  );
}
