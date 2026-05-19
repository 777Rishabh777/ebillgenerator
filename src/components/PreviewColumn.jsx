import React from 'react';

export default function PreviewColumn({ templateName, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-linear-to-b from-white to-blue-50/60 shadow-lg">
      <div className="border-b border-blue-100 bg-linear-to-r from-blue-50 to-cyan-50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Live Preview</p>
        <p className="text-sm font-semibold text-slate-800">{templateName || 'Template Preview'}</p>
      </div>
      <div className="p-2 sm:p-3">
        {children}
      </div>
    </div>
  );
}
