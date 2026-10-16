// ──────────────────────────────────────────────────
// components/TankConfigForm.tsx — Parameter Configuration
// ──────────────────────────────────────────────────
'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateCapacityLiters } from '@/lib/calculations';
import type { TankConfig } from '@/types';

interface TankConfigFormProps {
  config: TankConfig | null;
  onSave: (config: TankConfig) => Promise<void>;
  isLoading?: boolean;
}

interface FormErrors {
  lengthCm?: string;
  widthCm?: string;
  depthCm?: string;
  sensorHeightCm?: string;
  warnThresholdPercent?: string;
  dangerThresholdPercent?: string;
  staleTimeoutSeconds?: string;
}

function FieldInput({
  label,
  name,
  value,
  unit,
  error,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  name: keyof TankConfig;
  value: number;
  unit: string;
  error?: string;
  onChange: (name: keyof TankConfig, value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">
          {label}
        </label>
        {hint && <span className="text-[10px] text-slate-400 font-medium">({hint})</span>}
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
          className={cn(
            'w-full bg-white border rounded-lg pl-3 pr-10 py-2 text-xs font-mono font-medium text-slate-900',
            'transition-colors shadow-xs',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
              : 'border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500',
          )}
        />
        <span className="absolute right-3 text-xs text-slate-400 font-medium pointer-events-none">
          {unit}
        </span>
      </div>
      {error && (
        <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium mt-0.5">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}

export default function TankConfigForm({
  config,
  onSave,
  isLoading = false,
}: TankConfigFormProps) {
  const [formValues, setFormValues] = useState<TankConfig>({
    lengthCm: 100,
    widthCm: 60,
    depthCm: 80,
    sensorHeightCm: 90,
    warnThresholdPercent: 60,
    dangerThresholdPercent: 85,
    staleTimeoutSeconds: 30,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (config) setFormValues(config);
  }, [config]);

  const handleChange = (name: keyof TankConfig, value: number) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSaveStatus('idle');
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const v = formValues;

    if (v.lengthCm <= 0) newErrors.lengthCm = 'Length must be > 0';
    if (v.widthCm <= 0) newErrors.widthCm = 'Width must be > 0';
    if (v.depthCm <= 0) newErrors.depthCm = 'Depth must be > 0';
    if (v.sensorHeightCm <= 0) newErrors.sensorHeightCm = 'Sensor height must be > 0';
    if (v.sensorHeightCm < v.depthCm) {
      newErrors.sensorHeightCm = `Sensor height (${v.sensorHeightCm}cm) must be ≥ tank depth (${v.depthCm}cm)`;
    }
    if (v.warnThresholdPercent <= 0 || v.warnThresholdPercent >= 100) {
      newErrors.warnThresholdPercent = 'Warn threshold must be 1–99%';
    }
    if (v.dangerThresholdPercent <= 0 || v.dangerThresholdPercent >= 100) {
      newErrors.dangerThresholdPercent = 'Danger threshold must be 1–99%';
    }
    if (v.warnThresholdPercent >= v.dangerThresholdPercent) {
      newErrors.dangerThresholdPercent = 'Danger threshold must exceed warn threshold';
    }
    if (v.staleTimeoutSeconds <= 0) {
      newErrors.staleTimeoutSeconds = 'Timeout must be > 0s';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveError('');

    try {
      await onSave(formValues);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setSaveError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const capacity = calculateCapacityLiters(
    formValues.lengthCm,
    formValues.widthCm,
    formValues.depthCm,
  );

  const disabled = isSaving || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dimensions */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
          <Sliders size={13} className="text-slate-400" />
          <span>Physical Geometry</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldInput label="Length" name="lengthCm" value={formValues.lengthCm} unit="cm" error={errors.lengthCm} onChange={handleChange} min={1} />
          <FieldInput label="Width" name="widthCm" value={formValues.widthCm} unit="cm" error={errors.widthCm} onChange={handleChange} min={1} />
          <FieldInput label="Depth" name="depthCm" value={formValues.depthCm} unit="cm" error={errors.depthCm} onChange={handleChange} min={1} />
          <FieldInput label="Sensor Clearance" name="sensorHeightCm" value={formValues.sensorHeightCm} unit="cm" hint="≥ depth" error={errors.sensorHeightCm} onChange={handleChange} min={1} />
        </div>
        <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Calculated Volume:</span>
          <span className="font-mono font-bold text-slate-900">{capacity.toFixed(1)} L</span>
        </div>
      </div>

      {/* Thresholds */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
          Alert Threshold Limits
        </span>
        <div className="grid grid-cols-2 gap-3 mb-2.5">
          <FieldInput label="Warn At" name="warnThresholdPercent" value={formValues.warnThresholdPercent} unit="%" error={errors.warnThresholdPercent} onChange={handleChange} min={1} max={99} />
          <FieldInput label="Danger At" name="dangerThresholdPercent" value={formValues.dangerThresholdPercent} unit="%" error={errors.dangerThresholdPercent} onChange={handleChange} min={1} max={100} />
        </div>

        {/* Visual Threshold Bar */}
        <div className="relative h-2 bg-slate-100 rounded-full border border-slate-200 overflow-hidden my-2">
          <div
            className="absolute left-0 top-0 bottom-0 bg-emerald-500"
            style={{ width: `${formValues.warnThresholdPercent}%` }}
          />
          <div
            className="absolute top-0 bottom-0 bg-amber-500"
            style={{
              left: `${formValues.warnThresholdPercent}%`,
              width: `${Math.max(formValues.dangerThresholdPercent - formValues.warnThresholdPercent, 0)}%`,
            }}
          />
          <div
            className="absolute top-0 right-0 bottom-0 bg-rose-500"
            style={{ left: `${formValues.dangerThresholdPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0%</span>
          <span className="text-amber-700 font-semibold">{formValues.warnThresholdPercent}% Warn</span>
          <span className="text-rose-700 font-semibold">{formValues.dangerThresholdPercent}% Danger</span>
          <span>100%</span>
        </div>
      </div>

      {/* Timing */}
      <div className="pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
          Watchdog Protocol
        </span>
        <FieldInput label="Stale Heartbeat Timeout" name="staleTimeoutSeconds" value={formValues.staleTimeoutSeconds} unit="s" error={errors.staleTimeoutSeconds} onChange={handleChange} min={5} />
      </div>

      {/* Save feedback states */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
          <span>Parameters saved & calibrated successfully.</span>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 text-rose-800 text-xs font-medium bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="text-rose-600 shrink-0" />
          <span>{saveError || 'Failed to save configuration.'}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200',
          'text-white disabled:text-slate-400',
          'text-xs font-semibold rounded-lg px-4 py-2.5',
          'transition-all duration-150 shadow-xs cursor-pointer',
        )}
      >
        {disabled ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Updating Parameters…</span>
          </>
        ) : (
          <>
            <Save size={14} />
            <span>Apply Tank Configuration</span>
          </>
        )}
      </button>
    </form>
  );
}
