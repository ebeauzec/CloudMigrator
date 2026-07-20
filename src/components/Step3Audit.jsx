import React, { useState, useEffect } from 'react';
import { Search, Database, Layers, Lock, ShieldAlert, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react';

export default function Step3Audit({ config, onNext, selectedBuckets, setSelectedBuckets }) {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState(null);

  const runAuditScan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setInventory(data);
      if (data.buckets && selectedBuckets.length === 0) {
        setSelectedBuckets(data.buckets.map(b => b.name));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAuditScan();
  }, []);

  const toggleBucket = (bucketName) => {
    if (selectedBuckets.includes(bucketName)) {
      setSelectedBuckets(selectedBuckets.filter(b => b !== bucketName));
    } else {
      setSelectedBuckets([...selectedBuckets, bucketName]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="glass-panel p-6 sm:p-8">
        
        {/* Step Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">Step 03 of 06</span>
            <h2 className="text-2xl font-bold text-slate-100">StorageGRID Tenant Audit & Pre-Flight Scan</h2>
            <p className="text-slate-400 text-sm mt-1">
              Deep inspection of source tenant buckets, object counts, Object Lock compliance settings, tags, and user metadata.
            </p>
          </div>
          <button
            onClick={runAuditScan}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Scan StorageGRID Tenant</span>
          </button>
        </div>

        {/* Summary Stats Cards */}
        {inventory && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <div className="glass-card p-5 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Buckets</span>
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">{inventory.totalBuckets}</div>
              <div className="text-xs text-purple-300 mt-1 font-medium">Fully Inventoried</div>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-cyan-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Object Count</span>
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
                {inventory.totalObjects.toLocaleString()}
              </div>
              <div className="text-xs text-cyan-300 mt-1 font-medium">Objects Scanned</div>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aggregate Volume</span>
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
                {inventory.totalSizeFormatted}
              </div>
              <div className="text-xs text-emerald-300 mt-1 font-medium">Payload Data Volume</div>
            </div>

            <div className="glass-card p-5 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Object Lock Protected</span>
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono">
                {inventory.buckets.filter(b => b.objectLockEnabled).length} Buckets
              </div>
              <div className="text-xs text-amber-300 mt-1 font-medium">Immutable WORM Policies</div>
            </div>
          </div>
        )}

        {/* Bucket Inventory Table */}
        {inventory && (
          <div className="glass-card overflow-hidden my-6">
            <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-400" />
                <span>Source Bucket Inventory Matrix ({selectedBuckets.length} of {inventory.buckets.length} Selected)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Tenant ID: {inventory.tenantId}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 text-center">Migrate</th>
                    <th className="p-3.5">Bucket Name</th>
                    <th className="p-3.5">Objects</th>
                    <th className="p-3.5">Capacity</th>
                    <th className="p-3.5">Versioning</th>
                    <th className="p-3.5">Object Lock / WORM Policy</th>
                    <th className="p-3.5">Metadata & Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {inventory.buckets.map((b) => {
                    const isSelected = selectedBuckets.includes(b.name);
                    return (
                      <tr key={b.name} className={`hover:bg-slate-900/50 transition ${isSelected ? 'bg-purple-950/20' : ''}`}>
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBucket(b.name)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-400 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                          <Database className="w-4 h-4 text-purple-400" />
                          <span>{b.name}</span>
                        </td>
                        <td className="p-3.5">{b.objectCount.toLocaleString()}</td>
                        <td className="p-3.5 font-bold text-emerald-400">{b.sizeFormatted}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            b.versioning === 'Enabled' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {b.versioning}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {b.objectLockEnabled ? (
                            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>{b.compliancePolicy}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {b.userMetadataCount} Headers • Tags Active
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onNext}
            disabled={selectedBuckets.length === 0}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-purple-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            <span>Launch Direct Datacenter Migration ({selectedBuckets.length} Buckets)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
