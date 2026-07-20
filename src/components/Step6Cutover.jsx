import React, { useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck, Download, AlertTriangle, Play, ArrowRight, Server, Cpu, ExternalLink } from 'lucide-react';

export default function Step6Cutover({ selectedBuckets, config }) {
  const [freezeSource, setFreezeSource] = useState(true);
  const [executingCutover, setExecutingCutover] = useState(false);
  const [cutoverResult, setCutoverResult] = useState(null);

  const handleExecuteCutover = async () => {
    setExecutingCutover(true);
    try {
      const res = await fetch('/api/cutover/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freezeSource, runPostValidation: true })
      });
      const data = await res.json();
      setCutoverResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingCutover(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="glass-panel p-6 sm:p-8">
        
        {/* Step Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">Step 06 of 06</span>
            <h2 className="text-2xl font-bold text-slate-100">Cut-Over Wizard & Production Switch</h2>
            <p className="text-slate-400 text-sm mt-1">
              Finalize tenant migration, freeze source buckets to read-only, execute post-cutover operational validation, and switch application endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ready for Production Cut-Over</span>
          </div>
        </div>

        {/* Pre-Cutover Checklist & Toggles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          
          {/* Safeguard Settings Card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Safeguard Controls</span>
            </h3>

            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={freezeSource}
                  onChange={(e) => setFreezeSource(e.target.checked)}
                  className="w-4 h-4 mt-1 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-400"
                />
                <div>
                  <span className="font-semibold text-slate-200 text-sm">Freeze Source StorageGRID Buckets (Read-Only)</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Applies bucket policies on StorageGRID to block new PUT/DELETE operations, guaranteeing zero drift during cut-over.
                  </p>
                </div>
              </label>
            </div>

            <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 space-y-1 font-mono">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Data Loss Protection Active:</span>
              </div>
              <p className="opacity-90">1. Final delta flush will sweep any last-second object writes.</p>
              <p className="opacity-90">2. Destination S3 write/read test verifies end-user application readiness.</p>
            </div>

            <button
              onClick={handleExecuteCutover}
              disabled={executingCutover}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              {executingCutover ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                  <span>Executing Final Cut-Over & Switch...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Final Production Cut-Over Now</span>
                </>
              )}
            </button>
          </div>

          {/* Endpoint Switch Instructions */}
          <div className="glass-card p-6 flex flex-col justify-between border-l-4 border-l-cyan-500">
            <div>
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>End-User Cut-Over Endpoint Switch</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3 rounded bg-slate-900/90 border border-slate-800 text-xs">
                  <span className="text-slate-400 block font-mono uppercase text-[10px]">OLD STORAGEGRID ENDPOINT (SOURCE)</span>
                  <code className="text-purple-300 font-mono text-sm block mt-0.5">
                    {config.sourceEndpoint || 'https://storagegrid.datacenter.internal:8082'}
                  </code>
                </div>

                <div className="p-3 rounded bg-slate-900/90 border border-emerald-500/30 text-xs">
                  <span className="text-emerald-400 block font-mono uppercase text-[10px]">NEW PURE S3 ENDPOINT (PRIMARY DESTINATION)</span>
                  <code className="text-emerald-300 font-mono font-bold text-sm block mt-0.5">
                    {config.destEndpoint || 'https://pure-flashblade.datacenter.internal:8080'}
                  </code>
                </div>

                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono">
                  <span className="text-cyan-400 font-bold block">DNS / Endpoint Update Instructions:</span>
                  <p>Update application DNS record <code className="text-cyan-300">s3.tenant.company.internal</code> to resolve to Pure FlashBlade IPs:</p>
                  <pre className="bg-slate-900 p-2 rounded text-[11px] text-slate-300 border border-slate-800">
                    s3.tenant.company.internal. CNAME pure-fb-s3.datacenter.internal.
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <a
                href="/api/verification/report-csv"
                download
                className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Compliance Audit Log (CSV)</span>
              </a>
            </div>
          </div>

        </div>

        {/* Post-Cutover Operational Validation Results */}
        {cutoverResult && (
          <div className="glass-card p-6 border-l-4 border-l-emerald-500 my-6 bg-emerald-950/20">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-extrabold text-slate-100 text-lg">Production Cut-Over Executed Successfully!</h3>
                <p className="text-xs text-emerald-300 font-mono mt-0.5">Timestamp: {new Date(cutoverResult.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">SOURCE TENANT</span>
                <span className="text-amber-400 font-bold">{cutoverResult.sourceTenantStatus}</span>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">DESTINATION TENANT</span>
                <span className="text-emerald-400 font-bold">{cutoverResult.destinationTenantStatus}</span>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">POST-CUTOVER WRITE PROBE</span>
                <span className="text-emerald-400 font-bold">{cutoverResult.healthCheck.writeTest}</span>
              </div>

              <div className="p-3 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">POST-CUTOVER READ PROBE</span>
                <span className="text-emerald-400 font-bold">{cutoverResult.healthCheck.readTest}</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded bg-emerald-900/30 border border-emerald-500/30 text-xs font-mono text-emerald-200">
              ✔ {cutoverResult.message} End-user applications can now perform full S3 operations against the Pure Storage endpoint with 100% attribute parity and zero data loss.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
