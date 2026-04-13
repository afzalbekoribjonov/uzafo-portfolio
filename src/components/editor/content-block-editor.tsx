'use client';

import {useState} from 'react';
import {ChevronDown, ChevronUp, Clapperboard, Code2, Crop, FileText, Image as ImageIcon, Plus, Quote, Trash2, Upload} from 'lucide-react';
import {RichTextEditor} from '@/components/editor/rich-text-editor';
import {DynamicMedia, MediaTypeBadge} from '@/components/ui/dynamic-media';
import {ImageEditor} from '@/components/ui/image-editor';
import {isLiveModeEnabled} from '@/lib/auth';
import {uploadMediaSource} from '@/lib/imagekit';
import type {ContentBlock, Locale} from '@/lib/types';
import {makeId, resolveText} from '@/lib/utils';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

export function createBlock(type: ContentBlock['type']): ContentBlock {
  if (type === 'image') return {id: makeId('block'), type, src: '', alt: 'Rasm tavsifi'};
  if (type === 'video') return {id: makeId('block'), type, src: '', caption: 'Video tavsifi'};
  if (type === 'code') return {id: makeId('block'), type, language: 'ts', content: '// Kod bu yerda...'};
  if (type === 'quote') return {id: makeId('block'), type, content: '<p>Muhim fikr yoki eslatma.</p>'};
  return {id: makeId('block'), type: 'richText', content: '<p>Yozishni boshlang...</p>'};
}

const BLOCK_LABELS: Record<ContentBlock['type'], string> = {
  richText: 'Matn', quote: 'Iqtibos', code: 'Kod', image: 'Rasm', video: 'Video'
};

const BLOCK_ICONS: Record<ContentBlock['type'], React.ElementType> = {
  richText: FileText, quote: Quote, code: Code2, image: ImageIcon, video: Clapperboard
};

export function ContentBlockEditor({blocks, onChange, locale, allowAdd = true, uploadContext}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  locale: Locale;
  allowAdd?: boolean;
  uploadContext?: {ownerType: 'project' | 'post'; ownerSlug: string};
}) {
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  const update = (id: string, updater: (b: ContentBlock) => ContentBlock) =>
    onChange(blocks.map(b => b.id === id ? updater(b) : b));

  const remove = (id: string) => onChange(blocks.filter(b => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= blocks.length) return;
    const arr = [...blocks];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  };

  const add = (type: ContentBlock['type']) => onChange([...blocks, createBlock(type)]);

  const uploadSource = async (source: File | string) => {
    if (isLiveModeEnabled() && uploadContext?.ownerSlug) {
      const media = await uploadMediaSource(source, {
        ownerType: uploadContext.ownerType,
        ownerSlug: uploadContext.ownerSlug,
        role: 'content'
      });
      return media.url;
    }

    return typeof source === 'string' ? source : readFileAsDataUrl(source);
  };

  const AddButtons = () => (
    <div className="flex flex-wrap gap-2 pt-2">
      {(['richText','quote','code','image','video'] as const).map(type => {
        const Icon = BLOCK_ICONS[type];
        return (
          <button key={type} type="button" onClick={() => add(type)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white">
            <Plus className="h-3 w-3" /> <Icon className="h-3 w-3" /> {BLOCK_LABELS[type]}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const Icon = BLOCK_ICONS[block.type];
        const editingThisImage = editingImageId === block.id;
        const uploadingThis = uploadingBlockId === block.id;

        return (
          <div key={block.id} className="rounded-[24px] border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-300">
                  <Icon className="h-3 w-3" /> {BLOCK_LABELS[block.type]}
                </span>
                <span className="text-[11px] text-slate-500">#{index + 1}</span>
                {uploadingThis ? <span className="text-[11px] text-cyan-300">Yuklanmoqda...</span> : null}
              </div>
              <div className="flex gap-1.5">
                {index > 0 && (
                  <button type="button" onClick={() => move(block.id, -1)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                )}
                {index < blocks.length - 1 && (
                  <button type="button" onClick={() => move(block.id, 1)} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => remove(block.id)} className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 p-1.5 text-rose-300 transition hover:bg-rose-500/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {block.type === 'code' && (
                <div className="space-y-3">
                  <input value={block.language}
                    onChange={e => update(block.id, b => b.type === 'code' ? {...b, language: e.target.value} : b)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-300 outline-none"
                    placeholder="Dasturlash tili (ts, js, python...)" />
                  <textarea value={resolveText(block.content, locale)}
                    onChange={e => update(block.id, b => b.type === 'code' ? {...b, content: e.target.value} : b)}
                    className="min-h-40 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 font-mono text-sm text-cyan-200 outline-none" />
                </div>
              )}

              {(block.type === 'richText' || block.type === 'quote') && (
                <RichTextEditor
                  value={resolveText(block.content, locale)}
                  onChange={val => update(block.id, b => (b.type === 'richText' || b.type === 'quote') ? {...b, content: val} : b)}
                  placeholder={block.type === 'quote' ? 'Iqtibos matni...' : 'Kontent yozing...'}
                />
              )}

              {block.type === 'image' && (
                <div className="space-y-3">
                  {editingThisImage && block.src ? (
                    <ImageEditor
                      key={block.src}
                      src={block.src}
                      onSave={async (dataUrl) => {
                        try {
                          setUploadingBlockId(block.id);
                          const uploadedUrl = await uploadSource(dataUrl);
                          update(block.id, b => b.type === 'image' ? {...b, src: uploadedUrl} : b);
                        } finally {
                          setUploadingBlockId(null);
                          setEditingImageId(null);
                        }
                      }}
                      onCancel={() => setEditingImageId(null)}
                    />
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <MediaTypeBadge src={block.src} />
                        <div className="flex flex-wrap gap-1.5">
                          {block.src && (
                            <button type="button" onClick={() => setEditingImageId(block.id)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-300 transition hover:bg-cyan-400/20">
                              <Crop className="h-3.5 w-3.5" /> Tahrirlash
                            </button>
                          )}
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                            <Upload className="h-3.5 w-3.5" /> Yuklash
                            <input type="file" accept="image/*" className="hidden"
                              onChange={async e => {
                                const input = e.currentTarget;
                                const file = input.files?.[0];
                                if (!file) return;
                                try {
                                  setUploadingBlockId(block.id);
                                  const uploadedUrl = await uploadSource(file);
                                  update(block.id, b => b.type === 'image' ? {...b, src: uploadedUrl} : b);
                                } finally {
                                  setUploadingBlockId(null);
                                  input.value = '';
                                }
                              }} />
                          </label>
                          {block.src && (
                            <button type="button" onClick={() => update(block.id, b => b.type === 'image' ? {...b, src: ''} : b)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20">
                              <Trash2 className="h-3.5 w-3.5" /> O'chirish
                            </button>
                          )}
                        </div>
                      </div>
                      <DynamicMedia src={block.src} alt={resolveText(block.alt, locale)}
                        className="rounded-[20px] border border-white/10"
                        placeholderTitle="Rasm bloki bo'sh" placeholderHint="URL kiriting yoki rasm yuklang." />
                      <input value={block.src}
                        onChange={e => update(block.id, b => b.type === 'image' ? {...b, src: e.target.value} : b)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                        placeholder="Rasm URL manzili" />
                      <input value={resolveText(block.alt, locale)}
                        onChange={e => update(block.id, b => b.type === 'image' ? {...b, alt: e.target.value} : b)}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                        placeholder="Alt matn (ekran o'quvchilar uchun)" />
                    </>
                  )}
                </div>
              )}

              {block.type === 'video' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <MediaTypeBadge src={block.src} />
                    <div className="flex gap-1.5">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
                        <Upload className="h-3.5 w-3.5" /> Video yuklash
                        <input type="file" accept="video/*" className="hidden"
                          onChange={async e => {
                            const input = e.currentTarget;
                            const file = input.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingBlockId(block.id);
                              const uploadedUrl = await uploadSource(file);
                              update(block.id, b => b.type === 'video' ? {...b, src: uploadedUrl} : b);
                            } finally {
                              setUploadingBlockId(null);
                              input.value = '';
                            }
                          }} />
                      </label>
                      {block.src && (
                        <button type="button" onClick={() => update(block.id, b => b.type === 'video' ? {...b, src: ''} : b)}
                          className="cursor-pointer rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20">
                          O'chirish
                        </button>
                      )}
                    </div>
                  </div>
                  <DynamicMedia src={block.src} alt={resolveText(block.caption, locale)}
                    className="rounded-[20px] border border-white/10"
                    placeholderTitle="Video bloki bo'sh" placeholderHint="URL kiriting yoki video yuklang." />
                  <input value={block.src}
                    onChange={e => update(block.id, b => b.type === 'video' ? {...b, src: e.target.value} : b)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Video URL manzili" />
                  <input value={resolveText(block.caption, locale)}
                    onChange={e => update(block.id, b => b.type === 'video' ? {...b, caption: e.target.value} : b)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none"
                    placeholder="Video tavsifi" />
                </div>
              )}

              {allowAdd && index === blocks.length - 1 && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <AddButtons />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {allowAdd && blocks.length === 0 && <AddButtons />}
    </div>
  );
}
