import React, { useState } from 'react';
import Header from './components/Header';
import StepWizard from './components/StepWizard';
import Step1Connect from './components/Step1Connect';
import Step2Provision from './components/Step2Provision';
import Step3Audit from './components/Step3Audit';
import Step4Migration from './components/Step4Migration';
import Step5Verification from './components/Step5Verification';
import Step6Cutover from './components/Step6Cutover';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState({
    sourceEndpoint: 'https://storagegrid.datacenter.internal:8082',
    sourceAccessKey: 'SGAK_PROD_994810',
    sourceSecretKey: 'sg_sec_994810_8849',
    sourceTenantId: 'sg-tenant-94821',

    destEndpoint: 'https://pure-flashblade.datacenter.internal:8080',
    destAccessKey: 'PURE_ACCESS_KEY_001',
    destSecretKey: 'pure_sec_001_8892',
    destRegion: 'us-east-1'
  });

  const [selectedBuckets, setSelectedBuckets] = useState([
    'finance-records-2025',
    'medical-imaging-archive',
    'analytics-raw-telemetry',
    'app-backups-immutable',
    'corporate-media-assets'
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      
      {/* Header Banner */}
      <Header currentStep={currentStep} />

      {/* Step Navigation Bar */}
      <StepWizard currentStep={currentStep} setStep={setCurrentStep} />

      {/* Step Content Area */}
      <main className="flex-1 pb-16">
        {currentStep === 1 && (
          <Step1Connect
            config={config}
            setConfig={setConfig}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Provision
            config={config}
            setConfig={setConfig}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3Audit
            config={config}
            selectedBuckets={selectedBuckets}
            setSelectedBuckets={setSelectedBuckets}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Migration
            config={config}
            selectedBuckets={selectedBuckets}
            onNext={() => setCurrentStep(5)}
          />
        )}

        {currentStep === 5 && (
          <Step5Verification
            selectedBuckets={selectedBuckets}
            onNext={() => setCurrentStep(6)}
          />
        )}

        {currentStep === 6 && (
          <Step6Cutover
            selectedBuckets={selectedBuckets}
            config={config}
          />
        )}
      </main>

      {/* Persistent Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-slate-400 font-bold">Pure-Grid StorageSync</span> • NetApp StorageGRID to Pure Storage Migration Tool
          </div>
          <div className="text-emerald-400/90">
            Datacenter LAN Direct S3 Route Verified • Zero Client Payload Buffer
          </div>
        </div>
      </footer>

    </div>
  );
}
