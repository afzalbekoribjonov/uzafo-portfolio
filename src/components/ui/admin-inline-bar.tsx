'use client';

import {Eye, Pencil, Save, Trash2, X} from 'lucide-react';
import type {ReactNode} from 'react';

export function AdminInlineBar({editing, onToggle, onSave, onCancel, onDelete, extra}: {
  editing: boolean;
  onToggle: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky top-20 z-30 mb-2 flex flex-wrap items-center gap-2.5 rounded-[20px] p-3 shadow-lg backdrop-blur"
      style={{border:'1px solid var(--border-1)', background:'var(--input-bg)'}}>
      <button type="button" onClick={onToggle}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
        style={{background:'var(--accent)', color:'var(--accent-fg)'}}>
        {editing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
        {editing ? "Ko'rinish" : 'Tahrirlash'}
      </button>
      {editing && onSave && (
        <button type="button" onClick={onSave}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
          <Save className="h-4 w-4" /> Saqlash
        </button>
      )}
      {editing && onCancel && (
        <button type="button" onClick={onCancel}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
          <X className="h-4 w-4" /> Bekor
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20">
          <Trash2 className="h-4 w-4" /> O'chirish
        </button>
      )}
      {extra}
    </div>
  );
}
