import React, { useState, useEffect } from 'react';
import { SATELLITE_PRESETS, parseTle } from '../utils/satelliteCalc';
import { SatellitePreset, TleInfo } from '../types';

interface TleInputProps {
  onTleChange: (line1: string, line2: string, name: string) => void;
  activeTleInfo: TleInfo | null;
  line1: string;
  line2: string;
}

export default function TleInput({ onTleChange, activeTleInfo, line1, line2 }: TleInputProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('astrosat');
  const [customName, setCustomName] = useState<string>('Swayam Swadeshi Satellite');
  const [customLine1, setCustomLine1] = useState<string>('');
  const [customLine2, setCustomLine2] = useState<string>('');
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Set initial preset ONLY if the parent does not have TLE values already loaded
  useEffect(() => {
    if (!line1 || !line2) {
      const astrosatPreset = SATELLITE_PRESETS.find(p => p.id === 'astrosat');
      if (astrosatPreset) {
        onTleChange(astrosatPreset.line1, astrosatPreset.line2, astrosatPreset.name);
      }
    }
  }, []);

  // Sync state with parent's line1 and line2 when they change (e.g. on load or preset selection)
  useEffect(() => {
    if (line1 && line2) {
      const matchedPreset = SATELLITE_PRESETS.find(
        p => p.line1 === line1 && p.line2 === line2
      );
      if (matchedPreset) {
        setSelectedPresetId(matchedPreset.id);
        setIsManualMode(false);
      } else {
        // It is custom/manual TLE
        if (activeTleInfo) {
          setCustomName(activeTleInfo.name);
        }
        setCustomLine1(line1);
        setCustomLine2(line2);
        setIsManualMode(true);
      }
    }
  }, [line1, line2, activeTleInfo?.name]);

  // Handle Preset Selection Change
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    setIsManualMode(false);
    setValidationError(null);
    const preset = SATELLITE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onTleChange(preset.line1, preset.line2, preset.name);
    }
  };

  // Validate custom TLE input
  const handleApplyCustomTle = () => {
    const l1 = customLine1.trim();
    const l2 = customLine2.trim();

    if (!l1 || !l2) {
      setValidationError('Both lines are required.');
      return;
    }

    if (l1.length < 60 || l2.length < 60) {
      setValidationError('TLE lines are typically 69 characters. Check length.');
      return;
    }

    if (!l1.startsWith('1')) {
      setValidationError('Line 1 must start with character "1".');
      return;
    }

    if (!l2.startsWith('2')) {
      setValidationError('Line 2 must start with character "2".');
      return;
    }

    // Attempt parsing to verify correctness
    try {
      const parsed = parseTle(customName, l1, l2);
      setValidationError(null);
      onTleChange(l1, l2, customName);
    } catch (err) {
      setValidationError('Invalid TLE format. Please check parameters and checksums.');
    }
  };

  // Preset categories
  const categories = Array.from(new Set(SATELLITE_PRESETS.map(p => p.category)));

  return (
    <div className="flex flex-col bg-[#0a0c16] border border-cyan-900/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)] h-full">
      <div className="px-5 py-4 bg-[#0a0c16] border-b border-cyan-900/30 flex justify-between items-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Two-Line Element (TLE) Configuration
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-cyan-900/30">
            <button
              onClick={() => setIsManualMode(false)}
              className={`flex-1 py-1.5 text-xs font-mono font-semibold transition-colors border-b-2 ${
                !isManualMode
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-cyan-600 hover:text-cyan-400'
              }`}
            >
              🚀 Preloaded Presets
            </button>
            <button
              onClick={() => setIsManualMode(true)}
              className={`flex-1 py-1.5 text-xs font-mono font-semibold transition-colors border-b-2 ${
                isManualMode
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
                  : 'border-transparent text-cyan-600 hover:text-cyan-400'
              }`}
            >
              ✍️ Manual Entry
            </button>
          </div>

          {/* Preset Selection Mode */}
          {!isManualMode ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-cyan-600 font-mono block mb-1 tracking-wider">
                  Select a Satellite
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full bg-[#05060a] border border-cyan-800/50 rounded px-3 py-1.5 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                >
                  {categories.map((cat) => (
                    <optgroup key={cat} label={cat} className="bg-[#05060a] text-cyan-600">
                      {SATELLITE_PRESETS.filter(p => p.category === cat).map((p) => (
                        <option key={p.id} value={p.id} className="text-cyan-200">
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Preset description */}
              {selectedPresetId && (
                <div className="bg-cyan-950/20 border border-cyan-900/20 p-3 rounded text-xs leading-relaxed text-cyan-400 font-sans">
                  {SATELLITE_PRESETS.find(p => p.id === selectedPresetId)?.description}
                </div>
              )}
            </div>
          ) : (
            /* Manual TLE Entry Mode */
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-cyan-600 font-mono block mb-1 tracking-wider">
                    Satellite Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="E.g., ISS (Zarya)"
                    className="w-full bg-[#05060a] border border-cyan-800/50 rounded px-2.5 py-1 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-cyan-600 font-mono block mb-1 tracking-wider">
                    TLE Line 1
                  </label>
                  <input
                    type="text"
                    value={customLine1}
                    onChange={(e) => setCustomLine1(e.target.value)}
                    placeholder="1 25544U 98067A   24083.56149176..."
                    className="w-full bg-[#05060a] border border-cyan-800/50 rounded px-2.5 py-1 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-cyan-600 font-mono block mb-1 tracking-wider">
                    TLE Line 2
                  </label>
                  <input
                    type="text"
                    value={customLine2}
                    onChange={(e) => setCustomLine2(e.target.value)}
                    placeholder="2 25544  51.6417 141.0185 0005705..."
                    className="w-full bg-[#05060a] border border-cyan-800/50 rounded px-2.5 py-1 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {validationError && (
                <div className="text-[11px] font-mono text-rose-400 bg-rose-500/5 border border-rose-500/20 p-2 rounded">
                  ⚠️ {validationError}
                </div>
              )}

              <button
                onClick={handleApplyCustomTle}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold font-sans text-xs py-2 px-4 rounded transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-wider"
              >
                Apply Custom TLE
              </button>
            </div>
          )}
        </div>

        {/* Keplerian Orbital Elements Breakdown */}
        {activeTleInfo && (
          <div className="mt-4 border-t border-cyan-900/30 pt-3">
            <label className="text-[10px] uppercase font-bold text-cyan-600 font-mono block mb-2 tracking-wider">
              Keplerian Orbital Elements
            </label>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between border-b border-cyan-900/10 pb-1">
                <span className="text-cyan-600">Inclination:</span>
                <span className="text-cyan-200 font-semibold">{activeTleInfo.inclination.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900/10 pb-1">
                <span className="text-cyan-600">Eccentricity:</span>
                <span className="text-cyan-200 font-semibold">{activeTleInfo.eccentricity.toFixed(7)}</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900/10 pb-1">
                <span className="text-cyan-600">Mean Motion:</span>
                <span className="text-cyan-200 font-semibold">{activeTleInfo.meanMotion.toFixed(4)} rev/d</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900/10 pb-1">
                <span className="text-cyan-600">RAAN (Ω):</span>
                <span className="text-cyan-200 font-semibold">{activeTleInfo.raan.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900/10 pb-1">
                <span className="text-cyan-600">Arg of Perigee:</span>
                <span className="text-cyan-200 font-semibold">{activeTleInfo.argPerigee.toFixed(4)}°</span>
              </div>
              <div className="flex justify-between border-b border-cyan-900/10 pb-1">
                <span className="text-cyan-600">NORAD ID:</span>
                <span className="text-cyan-200 font-semibold">{activeTleInfo.noradId}</span>
              </div>
              <div className="col-span-2 flex justify-between pt-1">
                <span className="text-cyan-600">Epoch (UTC):</span>
                <span className="text-cyan-200 font-semibold truncate text-[10px]">
                  {activeTleInfo.epoch.toISOString().replace('T', ' ').substring(0, 19)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
