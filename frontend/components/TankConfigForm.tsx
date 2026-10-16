// ──────────────────────────────────────────────────
// components/TankConfigForm.tsx — Config form
// ──────────────────────────────────────────────────
'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-400">
        {label}
        {hint && <span className="text-slate-600 ml-1">({hint})</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
          className={cn(
            'flex-1 bg-bg-dark border rounded-lg px-3 py-2 text-sm text-white',
            'focus:outline-none focus:ring-1 transition-colors',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-bg-border focus:ring-blue-500 focus:border-blue-500',
          )}
        />
        <span className="text-xs text-slate-500 w-8 shrink-0">{unit}</span>
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={10} />
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

  // Sync prop config → form state
  useEffect(() => {
    if (config) setFormValues(config);
  }, [config]);

  const handleChange = (name: keyof TankConfig, value: number) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSaveStatus('idle');
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const v = formValues;

    if (v.lengthCm <= 0) newErrors.lengthCm = 'Panjang harus lebih dari 0';
    if (v.widthCm <= 0) newErrors.widthCm = 'Lebar harus lebih dari 0';
    if (v.depthCm <= 0) newErrors.depthCm = 'Kedalaman harus lebih dari 0';
    if (v.sensorHeightCm <= 0) newErrors.sensorHeightCm = 'Tinggi sensor harus lebih dari 0';
    if (v.sensorHeightCm < v.depthCm) {
      newErrors.sensorHeightCm = `Tinggi sensor (${v.sensorHeightCm}cm) harus ≥ kedalaman tank (${v.depthCm}cm)`;
    }
    if (v.warnThresholdPercent <= 0 || v.warnThresholdPercent >= 100) {
      newErrors.warnThresholdPercent = 'Threshold peringatan harus antara 1–99%';
    }
    if (v.dangerThresholdPercent <= 0 || v.dangerThresholdPercent >= 100) {
      newErrors.dangerThresholdPercent = 'Threshold bahaya harus antara 1–99%';
    }
    if (v.warnThresholdPercent >= v.dangerThresholdPercent) {
      newErrors.dangerThresholdPercent = 'Threshold bahaya harus lebih besar dari threshold peringatan';
    }
    if (v.staleTimeoutSeconds <= 0) {
      newErrors.staleTimeoutSeconds = 'Timeout harus lebih dari 0 detik';
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
      setSaveError(err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi');
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
      {/* Tank Dimensions */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Tank Dimensions
        </h4>
        <div className="space-y-3">
          <FieldInput
            label="Length"
            name="lengthCm"
            value={formValues.lengthCm}
            unit="cm"
            error={errors.lengthCm}
            onChange={handleChange}
            min={1}
          />
          <FieldInput
            label="Width"
            name="widthCm"
            value={formValues.widthCm}
            unit="cm"
            error={errors.widthCm}
            onChange={handleChange}
            min={1}
          />
          <FieldInput
            label="Depth"
            name="depthCm"
            value={formValues.depthCm}
            unit="cm"
            error={errors.depthCm}
            onChange={handleChange}
            min={1}
          />
          <FieldInput
            label="Sensor Height from Bottom"
            name="sensorHeightCm"
            value={formValues.sensorHeightCm}
            unit="cm"
            hint="must ≥ depth"
            error={errors.sensorHeightCm}
            onChange={handleChange}
            min={1}
          />
        </div>

        {/* Capacity Preview */}
        <div className="mt-3 p-2.5 bg-bg-dark rounded-lg border border-bg-border">
          <p className="text-xs text-slate-500">
            Tank capacity:{' '}
            <span className="text-blue-400 font-semibold">{capacity.toFixed(1)} liters</span>
          </p>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Alert Thresholds
        </h4>
        <div className="space-y-3">
          <FieldInput
            label="Warning Level"
            name="warnThresholdPercent"
            value={formValues.warnThresholdPercent}
            unit="%"
            error={errors.warnThresholdPercent}
            onChange={handleChange}
            min={1}
            max={99}
          />
          <FieldInput
            label="Danger Level"
            name="dangerThresholdPercent"
            value={formValues.dangerThresholdPercent}
            unit="%"
            error={errors.dangerThresholdPercent}
            onChange={handleChange}
            min={1}
            max={100}
          />

          {/* Visual threshold bar */}
          <div className="relative h-3 bg-bg-dark rounded-full border border-bg-border overflow-hidden">
            <div
              className="absolute left-0 top-0 bottom-0 bg-green-500/40 rounded-full"
              style={{ width: `${formValues.warnThresholdPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 bg-amber-500/40"
              style={{
                left: `${formValues.warnThresholdPercent}%`,
                width: `${formValues.dangerThresholdPercent - formValues.warnThresholdPercent}%`,
              }}
            />
            <div
              className="absolute top-0 right-0 bottom-0 bg-red-500/40 rounded-r-full"
              style={{
                left: `${formValues.dangerThresholdPercent}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>0%</span>
            <span className="text-amber-500">{formValues.warnThresholdPercent}% warn</span>
            <span className="text-red-500">{formValues.dangerThresholdPercent}% danger</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Timing */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Timing
        </h4>
        <FieldInput
          label="Stale Data Timeout"
          name="staleTimeoutSeconds"
          value={formValues.staleTimeoutSeconds}
          unit="s"
          error={errors.staleTimeoutSeconds}
          onChange={handleChange}
          min={5}
        />
      </div>

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-400 text-xs bg-green-500/10 rounded-lg px-3 py-2">
          <CheckCircle size={14} />
          Konfigurasi berhasil disimpan!
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">
          <AlertCircle size={14} />
          {saveError || 'Gagal menyimpan konfigurasi'}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700',
          'text-white disabled:text-slate-500',
          'text-sm font-semibold rounded-lg px-4 py-2.5',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bg-dark',
        )}
      >
        {disabled ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            Menyimpan…
          </>
        ) : (
          <>
            <Save size={15} />
            Simpan Konfigurasi
          </>
        )}
      </button>
    </form>
  );
}
