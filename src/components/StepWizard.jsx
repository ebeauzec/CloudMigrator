import React from 'react';
import { Key, Server, Search, ArrowRightLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function StepWizard({ currentStep, setStep }) {
  const steps = [
    { id: 1, label: '01. Endpoints', icon: Server, description: 'Source & Destination Setup' },
    { id: 2, label: '02. Key Provision', icon: Key, description: 'Pure S3 Credentials Generator' },
    { id: 3, label: '03. Tenant Audit', icon: Search, description: 'StorageGRID Bucket Inventory' },
    { id: 4, label: '04. Direct Migration', icon: ArrowRightLeft, description: 'Datacenter Direct S3 Copy' },
    { id: 5, label: '05. Verification', icon: ShieldCheck, description: 'Attribute Parity & Delta Sync' },
    { id: 6, label: '06. Cut-Over', icon: CheckCircle2, description: 'Freeze Source & Production Switch' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => setStep(step.id)}
              className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-300 ${
                isActive
                  ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : isCompleted
                  ? 'bg-slate-900/40 border-slate-700/60 hover:border-slate-600 text-slate-300'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-mono font-semibold tracking-wider ${
                  isActive ? 'text-emerald-400' : isCompleted ? 'text-cyan-400' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
                <Icon className={`w-4 h-4 ${
                  isActive ? 'text-emerald-400' : isCompleted ? 'text-cyan-400' : 'text-slate-600'
                }`} />
              </div>
              
              <div className={`text-xs font-semibold truncate ${
                isActive ? 'text-slate-100' : isCompleted ? 'text-slate-200' : 'text-slate-400'
              }`}>
                {step.description}
              </div>

              {/* Progress Line Bar */}
              <div className="mt-2.5 w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isCompleted ? 'bg-cyan-400 w-full' : isActive ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 w-1/2' : 'w-0'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
