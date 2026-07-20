import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Play, Pause, RotateCcw, Zap, ShieldCheck, CheckCircle2, ArrowRight, Activity, Server, Database } from 'lucide-react';

export default function Step4Migration({ config, selectedBuckets, onNext }) {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/migration/status');
      const data = await res.json();
      setMigrationStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 500);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      await fetch('/api/migration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedBuckets })
      });
      fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    try {
      await fetch('/api/migration/pause', { method: 'POST' });
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('/api/migration/reset', { method: 'POST' });
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 GB';
    const tb = bytes / (1024 * 1024 * 1024 * 1024);
    if (tb >= 1) return tb.toFixed(2) + ' TB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2) + ' GB';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="glass-panel p-6 sm:p-8">
        
        {/* Step Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">Step 04 of 06</span>
            <h2 className="text-2xl font-bold text-slate-100">Direct Datacenter S3 Migration Control</h2>
            <p className="text-slate-400 text-sm mt-1">
              Data streams directly between StorageGRID and Pure Storage nodes over high-speed datacenter LAN with zero client payload buffering.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {migrationStatus?.status === 'RUNNING' ? (
              <button
                onClick={handlePause}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition"
              >
                <Pause className="w-4 h-4" />
                <span>Pause Session</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{migrationStatus?.status === 'PAUSED' ? 'Resume Migration' : 'Start Automated Direct Migration'}</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
              title="Reset Migration State"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Datacenter Direct Stream Banner */}
        <div className="my-6 p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base">Direct Datacenter S3 Copy Engine</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                  ACTIVE ROUTE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                StorageGRID S3 Endpoint <span className="font-mono text-purple-300">➔ Direct LAN ➔</span> Pure FlashBlade S3 Endpoint
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center px-3 py-1.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CLIENT NETWORK USAGE</span>
              <span className="text-emerald-400 font-bold">0.00 BYTES (ZERO PROXY)</span>
            </div>
            <div className="text-center px-3 py-1.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PARALLEL S3 WORKERS</span>
              <span className="text-cyan-400 font-bold">{migrationStatus?.activeWorkers || 64} STREAMS</span>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          
          {/* Bandwidth Telemetry Card */}
          <div className="glass-card p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Direct Datacenter Throughput</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-100 font-mono">
                {migrationStatus?.currentThroughputGbps || 0}
              </span>
              <span className="text-lg font-bold text-emerald-400">Gbps</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 font-mono flex items-center justify-between">
              <span>({migrationStatus?.currentMBps || 0} MB/s Direct LAN)</span>
              <span className="text-emerald-400">High-Speed Fabric</span>
            </div>
          </div>

          {/* Data Volume Progress Card */}
          <div className="glass-card p-6 border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data Payload Volume</span>
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {formatBytes(migrationStatus?.migratedBytes)} / {formatBytes(migrationStatus?.totalBytes)}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${migrationStatus?.percentBytes || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>{migrationStatus?.percentBytes || 0}% Transferred</span>
              <span>ETA: {migrationStatus?.estimatedTimeRemainingSeconds ? `${migrationStatus.estimatedTimeRemainingSeconds}s` : 'Done'}</span>
            </div>
          </div>

          {/* Object Count Progress Card */}
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Objects & Attributes</span>
              <Server className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-100 font-mono">
              {migrationStatus?.migratedObjects?.toLocaleString() || 0} / {migrationStatus?.totalObjects?.toLocaleString() || 0}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-purple-400 to-cyan-400 h-full transition-all duration-500"
                style={{ width: `${migrationStatus?.percentObjects || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
              <span>{migrationStatus?.percentObjects || 0}% Objects Synced</span>
              <span className="text-purple-300">Tags & Lock Synced</span>
            </div>
          </div>

        </div>

        {/* Per-Bucket Live Breakdown */}
        <div className="glass-card overflow-hidden my-6">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Per-Bucket Live Direct Sync Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Status: {migrationStatus?.status || 'IDLE'}</span>
          </div>

          <div className="divide-y divide-slate-800">
            {migrationStatus?.bucketStatuses && Object.values(migrationStatus.bucketStatuses).map((b) => {
              const bucketPercent = ((b.migratedBytes / b.totalBytes) * 100).toFixed(1);
              return (
                <div key={b.name} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30">
                  <div className="md:w-1/3">
                    <div className="font-bold text-slate-100 text-sm font-mono flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>{b.name}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {b.migratedObjects.toLocaleString()} of {b.totalObjects.toLocaleString()} Objects
                    </div>
                  </div>

                  <div className="md:w-1/3">
                    <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                      <span>{formatBytes(b.migratedBytes)} / {formatBytes(b.totalBytes)}</span>
                      <span className="text-emerald-400 font-bold">{bucketPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full transition-all duration-300"
                        style={{ width: `${bucketPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="md:w-1/4 flex items-center justify-end gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{b.status === 'COMPLETED' ? 'SYNCED' : 'TRANSFERRING'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onNext}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <span>Proceed to Attribute & Delta Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
