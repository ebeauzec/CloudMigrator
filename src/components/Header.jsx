import React from 'react';
import { Database, ShieldCheck, Zap, HardDrive, Server, Activity } from 'lucide-react';

export default function Header({ currentStep, activeMode, onToggleMode }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-purple-500/20 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
            <Database className="w-6 h-6 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                Pure-Grid StorageSync
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-md">
                v1.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              NetApp StorageGRID to Pure S3 Automated Direct Migration Engine
            </p>
          </div>
        </div>

        {/* Datacenter Direct Traffic Indicator & Status */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Direct LAN Path Banner */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-xs text-slate-300 shadow-inner">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-300">Data Path:</span>
            <span className="text-slate-200 font-mono">Datacenter LAN Direct</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/30 font-semibold">
              0 B Client Proxy
            </span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-200">Datacenter Fabric Ready</span>
          </div>
        </div>

      </div>
    </header>
  );
}
