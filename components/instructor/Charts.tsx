'use client';

import React from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  showValues?: boolean;
  unit?: string;
}

export function BarChart({ data, height = 160, showValues = true, unit = '' }: BarChartProps) {
  if (!data || data.length === 0) return <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data</div>;

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between gap-2 h-full pb-6 relative">
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="w-full border-t border-gray-100" />
          ))}
        </div>

        {data.map((d, i) => {
          const barPct = (d.value / max) * 100;
          const barColor = d.color || '#6366f1';
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end z-10">
              {showValues && (
                <span className="text-[10px] font-semibold text-gray-500">
                  {d.value > 0 ? `${unit}${d.value}` : ''}
                </span>
              )}
              <div className="w-full relative" style={{ height: `calc(100% - 24px)` }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-700"
                  style={{
                    height: `${barPct}%`,
                    backgroundColor: barColor,
                    minHeight: d.value > 0 ? '4px' : '0px',
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 truncate max-w-full px-1">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  label?: string;
}

export function DonutChart({ segments, size = 120, label }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dasharray = circumference * pct;
    const dashoffset = -offset;
    offset += dasharray;
    return { ...seg, dasharray, dashoffset: circumference - offset + dasharray };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth="12"
              strokeDasharray={`${arc.dasharray} ${circumference - arc.dasharray}`}
              strokeDashoffset={arc.dashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          ))}
        </svg>
        {label && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-900">{label}</span>
            <span className="text-[10px] text-gray-400">total</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-gray-500">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  subLabel?: string;
  color?: string;
}

export function ProgressBar({ value, max, label, subLabel, color = '#6366f1' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {subLabel && <span className="text-xs text-gray-400">{subLabel}</span>}
          <span className="text-xs font-semibold text-gray-600">{value}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
