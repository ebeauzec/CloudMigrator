import React, { useState } from 'react';
import { Server, ShieldCheck, CheckCircle2, AlertCircle, Cpu, Wifi, ArrowRight } from 'lucide-react';

export default function Step1Connect({ config, setConfig, onNext }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Network error connecting to migration engine backend'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="glass-panel p-6 sm:p-8">
        
        {/* Step Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">Step 01 of 06</span>
            <h2 className="text-2xl font-bold text-slate-100">Endpoints & Credentials Setup</h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure connection parameters for source NetApp StorageGRID and destination Pure Storage S3 cluster.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Datacenter High-Speed LAN Connection Active</span>
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          
          {/* Source StorageGRID Card */}
          <div className="glass-card p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Server className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">NetApp StorageGRID (Source)</h3>
                  <p className="text-xs text-slate-400">Source Tenant S3 & Management Endpoint</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                SOURCE
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  StorageGRID S3 Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.sourceEndpoint}
                  onChange={(e) => setConfig({ ...config, sourceEndpoint: e.target.value })}
                  placeholder="https://storagegrid.datacenter.internal:8082"
                  className="w-full glass-input font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tenant S3 Access Key ID
                  </label>
                  <input
                    type="text"
                    value={config.sourceAccessKey}
                    onChange={(e) => setConfig({ ...config, sourceAccessKey: e.target.value })}
                    placeholder="SGAK_PROD_994810"
                    className="w-full glass-input font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tenant S3 Secret Key
                  </label>
                  <input
                    type="password"
                    value={config.sourceSecretKey}
                    onChange={(e) => setConfig({ ...config, sourceSecretKey: e.target.value })}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full glass-input font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  StorageGRID Tenant Account ID
                </label>
                <input
                  type="text"
                  value={config.sourceTenantId}
                  onChange={(e) => setConfig({ ...config, sourceTenantId: e.target.value })}
                  placeholder="sg-tenant-94821"
                  className="w-full glass-input font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Destination Pure S3 Card */}
          <div className="glass-card p-6 border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-lg">Pure Storage S3 (Destination)</h3>
                  <p className="text-xs text-slate-400">Destination FlashBlade S3 Endpoint</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                DESTINATION
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Pure FlashBlade S3 Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.destEndpoint}
                  onChange={(e) => setConfig({ ...config, destEndpoint: e.target.value })}
                  placeholder="https://pure-flashblade.datacenter.internal:8080"
                  className="w-full glass-input font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pure S3 Access Key ID (or provision in Step 2)
                  </label>
                  <input
                    type="text"
                    value={config.destAccessKey}
                    onChange={(e) => setConfig({ ...config, destAccessKey: e.target.value })}
                    placeholder="PURE_ACCESS_KEY_001"
                    className="w-full glass-input font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Pure S3 Secret Key
                  </label>
                  <input
                    type="password"
                    value={config.destSecretKey}
                    onChange={(e) => setConfig({ ...config, destSecretKey: e.target.value })}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full glass-input font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Destination Region / Zone
                </label>
                <input
                  type="text"
                  value={config.destRegion || 'us-east-1'}
                  onChange={(e) => setConfig({ ...config, destRegion: e.target.value })}
                  placeholder="us-east-1"
                  className="w-full glass-input font-mono text-sm"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-xl mb-6 border ${
            testResult.success ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <div className="font-semibold">{testResult.success ? 'Connection Check Successful' : 'Connection Check Failed'}</div>
                <div className="text-xs opacity-90 mt-1">{testResult.source?.message}</div>
                <div className="text-xs opacity-90">{testResult.destination?.message}</div>
                {testResult.datacenterLanConnected && (
                  <div className="mt-2 text-xs font-mono bg-emerald-900/40 p-2 rounded border border-emerald-500/30 text-emerald-300">
                    ✔ Direct Datacenter Route Validated: StorageGRID & Pure Storage clusters are on the same high-speed internal fabric. Data will stream directly S3-to-S3 with zero client bandwidth overhead.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-semibold border border-slate-700 transition flex items-center gap-2"
          >
            {testing ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></span>
                <span>Testing Datacenter Routes...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Test Endpoint Connectivity</span>
              </>
            )}
          </button>

          <button
            onClick={onNext}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <span>Proceed to Key Provisioning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
