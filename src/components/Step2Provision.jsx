import React, { useState } from 'react';
import { Key, Shield, Check, Copy, Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

export default function Step2Provision({ config, setConfig, onNext }) {
  const [accountName, setAccountName] = useState('Pure-Cloud-Tenant-Primary');
  const [userName, setUserName] = useState('storagesync-migration-admin');
  const [keyName, setKeyName] = useState('Pure-Grid-AutoKey-' + Date.now().toString().slice(-4));
  const [provisioning, setProvisioning] = useState(false);
  const [provisionedData, setProvisionedData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleProvisionKeys = async () => {
    setProvisioning(true);
    try {
      const res = await fetch('/api/provision-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountName, userName, keyName })
      });
      const data = await res.json();
      if (data.success) {
        setProvisionedData(data);
        setConfig({
          ...config,
          destAccessKey: data.credentials.accessKeyId,
          destSecretKey: data.credentials.secretAccessKey
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProvisioning(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="glass-panel p-6 sm:p-8">
        
        {/* Step Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">Step 02 of 06</span>
            <h2 className="text-2xl font-bold text-slate-100">Destination Key & User Provisioning</h2>
            <p className="text-slate-400 text-sm mt-1">
              Automate the creation of dedicated S3 Access Key & Secret Key pairs on the target Pure Storage S3 tenant.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Pure Storage REST API Provisioning Enabled</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8">
          
          {/* Key Generator Form (7 cols) */}
          <div className="lg:col-span-7 glass-card p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-lg">Generate Pure S3 Credentials</h3>
                <p className="text-xs text-slate-400">Creates new IAM User & Access Keys directly on Pure FlashBlade</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pure Destination Tenant Account
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full glass-input font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Migration IAM User Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full glass-input font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Key Alias / Identifier
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full glass-input font-mono text-sm"
                />
              </div>
            </div>

            {/* Permission Checklist */}
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Auto-Configured IAM Permissions Package:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                <span className="text-emerald-400">✔ s3:CreateBucket</span>
                <span className="text-emerald-400">✔ s3:PutObject</span>
                <span className="text-emerald-400">✔ s3:PutObjectTagging</span>
                <span className="text-emerald-400">✔ s3:PutObjectRetention</span>
                <span className="text-emerald-400">✔ s3:BypassGovernance</span>
                <span className="text-emerald-400">✔ s3:PutBucketVersioning</span>
              </div>
            </div>

            <button
              onClick={handleProvisionKeys}
              disabled={provisioning}
              className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {provisioning ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                  <span>Provisioning Keys on Pure Storage...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Provision New Pure S3 Keys Now</span>
                </>
              )}
            </button>
          </div>

          {/* Key Output & Credentials Card (5 cols) */}
          <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between border-l-4 border-l-emerald-500">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                  <span>Active Target Credentials</span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {provisionedData ? 'PROVISIONED' : 'READY'}
                </span>
              </div>

              {provisionedData ? (
                <div className="space-y-4">
                  <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
                    {provisionedData.message}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Pure S3 Access Key ID
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={provisionedData.credentials.accessKeyId}
                        className="w-full glass-input font-mono text-xs text-emerald-300 bg-slate-900"
                      />
                      <button
                        onClick={() => copyToClipboard(provisionedData.credentials.accessKeyId)}
                        className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Pure S3 Secret Key
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value={provisionedData.credentials.secretAccessKey}
                        className="w-full glass-input font-mono text-xs text-emerald-300 bg-slate-900"
                      />
                      <button
                        onClick={() => copyToClipboard(provisionedData.credentials.secretAccessKey)}
                        className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 font-mono pt-2">
                    <div>User: <span className="text-slate-200">{provisionedData.userName}</span></div>
                    <div>Created: <span className="text-slate-200">{new Date(provisionedData.credentials.createdDate).toLocaleString()}</span></div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-3">
                  <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm">
                    No new key generated yet. You can click <strong className="text-slate-200">Provision New Pure S3 Keys</strong> on the left, or use the pre-configured target key from Step 1.
                  </p>
                  <div className="text-xs font-mono bg-slate-900 p-3 rounded text-slate-300">
                    Current Access Key: {config.destAccessKey || 'PURE_ACCESS_KEY_001'}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 mt-6">
              <button
                onClick={onNext}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Tenant Discovery & Audit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
