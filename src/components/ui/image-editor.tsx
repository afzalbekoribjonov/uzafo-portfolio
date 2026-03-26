'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Check, Crop, FlipHorizontal, RotateCcw, RotateCw, SlidersHorizontal, X, ZoomIn, ZoomOut} from 'lucide-react';

interface CropArea { x: number; y: number; w: number; h: number; }
interface DragState { type: 'move'|'nw'|'ne'|'sw'|'se'|'n'|'s'|'e'|'w'; startX: number; startY: number; startCrop: CropArea; }

interface ImageEditorProps {
  src: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const HANDLE_SIZE = 10;
const MIN_SIZE = 40;

export function ImageEditor({src, onSave, onCancel}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [tab, setTab] = useState<'crop'|'adjust'>('crop');

  // Canvas display dimensions
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);
  // Crop area as fraction [0..1] of canvas display
  const [crop, setCrop] = useState<CropArea>({x: 0, y: 0, w: 1, h: 1});
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);

  /* ── Load image ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.src = src;
  }, [src]);

  /* ── Size canvas to container ───────────────────────────────────────── */
  useEffect(() => {
    if (!ready || !containerRef.current || !imgRef.current) return;
    const maxW = containerRef.current.clientWidth;
    const maxH = Math.min(400, window.innerHeight * 0.45);
    const img = imgRef.current;
    const isRotated = rotation % 180 !== 0;
    const iw = isRotated ? img.naturalHeight : img.naturalWidth;
    const ih = isRotated ? img.naturalWidth : img.naturalHeight;
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    setCanvasW(Math.round(iw * scale * zoom));
    setCanvasH(Math.round(ih * scale * zoom));
  }, [ready, rotation, zoom]);

  /* ── Draw ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || canvasW === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    if (flipH) ctx.scale(-1, 1);
    ctx.rotate((rotation * Math.PI) / 180);

    const img = imgRef.current;
    const isRotated = rotation % 180 !== 0;
    const dw = isRotated ? canvasH : canvasW;
    const dh = isRotated ? canvasW : canvasH;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    ctx.filter = 'none';

    // Draw crop overlay
    const cx = crop.x * canvasW, cy = crop.y * canvasH;
    const cw = crop.w * canvasW, ch = crop.h * canvasH;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvasW, cy);
    ctx.fillRect(0, cy + ch, canvasW, canvasH - cy - ch);
    ctx.fillRect(0, cy, cx, ch);
    ctx.fillRect(cx + cw, cy, canvasW - cx - cw, ch);

    // Crop border
    ctx.strokeStyle = 'rgba(34,211,238,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds grid
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(cx + (cw * i) / 3, cy); ctx.lineTo(cx + (cw * i) / 3, cy + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + (ch * i) / 3); ctx.lineTo(cx + cw, cy + (ch * i) / 3); ctx.stroke();
    }

    // Corner & edge handles
    const handles: Array<{x: number; y: number}> = [
      {x: cx, y: cy}, {x: cx + cw, y: cy}, {x: cx, y: cy + ch}, {x: cx + cw, y: cy + ch},
      {x: cx + cw / 2, y: cy}, {x: cx + cw / 2, y: cy + ch},
      {x: cx, y: cy + ch / 2}, {x: cx + cw, y: cy + ch / 2},
    ];
    ctx.fillStyle = '#22d3ee';
    handles.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, HANDLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [canvasW, canvasH, crop, rotation, flipH, brightness, contrast, saturation]);

  /* ── Mouse helpers ──────────────────────────────────────────────────── */
  const getPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {x: (e.clientX - rect.left) / canvasW, y: (e.clientY - rect.top) / canvasH};
  };

  const hitHandle = (px: number, py: number): DragState['type'] | null => {
    const {x: cx, y: cy, w: cw, h: ch} = crop;
    const t = HANDLE_SIZE / canvasW;
    const ty = HANDLE_SIZE / canvasH;
    const near = (a: number, b: number, eps: number) => Math.abs(a - b) < eps;

    if (near(px, cx, t) && near(py, cy, ty)) return 'nw';
    if (near(px, cx + cw, t) && near(py, cy, ty)) return 'ne';
    if (near(px, cx, t) && near(py, cy + ch, ty)) return 'sw';
    if (near(px, cx + cw, t) && near(py, cy + ch, ty)) return 'se';
    if (near(px, cx + cw / 2, t) && near(py, cy, ty)) return 'n';
    if (near(px, cx + cw / 2, t) && near(py, cy + ch, ty)) return 's';
    if (near(px, cx, t) && near(py, cy + ch / 2, ty)) return 'w';
    if (near(px, cx + cw, t) && near(py, cy + ch / 2, ty)) return 'e';
    if (px > cx && px < cx + cw && py > cy && py < cy + ch) return 'move';
    return null;
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const {x, y} = getPos(e);
    const type = hitHandle(x, y);
    if (type) setDragging({type, startX: x, startY: y, startCrop: {...crop}});
  }, [crop, canvasW, canvasH]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const {x: px, y: py} = getPos(e);
    const dx = px - dragging.startX;
    const dy = py - dragging.startY;
    const {x: sx, y: sy, w: sw, h: sh} = dragging.startCrop;
    const minW = MIN_SIZE / canvasW;
    const minH = MIN_SIZE / canvasH;

    let nx = sx, ny = sy, nw = sw, nh = sh;

    if (dragging.type === 'move') {
      nx = Math.max(0, Math.min(1 - sw, sx + dx));
      ny = Math.max(0, Math.min(1 - sh, sy + dy));
    } else {
      if (dragging.type.includes('n')) { ny = Math.max(0, Math.min(sy + sh - minH, sy + dy)); nh = sh - (ny - sy); }
      if (dragging.type.includes('s')) { nh = Math.max(minH, Math.min(1 - sy, sh + dy)); }
      if (dragging.type.includes('w')) { nx = Math.max(0, Math.min(sx + sw - minW, sx + dx)); nw = sw - (nx - sx); }
      if (dragging.type.includes('e')) { nw = Math.max(minW, Math.min(1 - sx, sw + dx)); }
    }

    setCrop({x: nx, y: ny, w: nw, h: nh});
  }, [dragging, canvasW, canvasH]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  /* ── Cursor ─────────────────────────────────────────────────────────── */
  const [cursor, setCursor] = useState('default');
  const onMouseMoveForCursor = useCallback((e: React.MouseEvent) => {
    if (dragging) return;
    const {x, y} = getPos(e);
    const t = hitHandle(x, y);
    const map: Record<string, string> = {nw:'nw-resize',ne:'ne-resize',sw:'sw-resize',se:'se-resize',n:'n-resize',s:'s-resize',w:'w-resize',e:'e-resize',move:'grab'};
    setCursor(t ? (map[t] ?? 'crosshair') : 'crosshair');
  }, [dragging, crop, canvasW, canvasH]);

  /* ── Toolbar actions ─────────────────────────────────────────────────── */
  const rotate = (dir: 1 | -1) => setRotation(r => (r + dir * 90 + 360) % 360);
  const resetCrop = () => setCrop({x: 0, y: 0, w: 1, h: 1});

  const presetCrop = (ratio: number) => {
    const currentAspect = (crop.w * canvasW) / (crop.h * canvasH);
    const targetAspect = ratio;
    if (Math.abs(currentAspect - targetAspect) < 0.01) { resetCrop(); return; }
    const cw = Math.min(1, crop.h * (canvasH / canvasW) * targetAspect);
    const ch = Math.min(1, crop.w * (canvasW / canvasH) / targetAspect);
    const finalW = cw <= 1 ? cw : ch * targetAspect * canvasH / canvasW;
    const finalH = finalW * canvasW / (canvasH * targetAspect);
    const ox = Math.max(0, (1 - finalW) / 2);
    const oy = Math.max(0, (1 - finalH) / 2);
    setCrop({x: ox, y: oy, w: Math.min(finalW, 1), h: Math.min(finalH, 1)});
  };

  /* ── Apply and save ─────────────────────────────────────────────────── */
  const handleSave = () => {
    if (!imgRef.current) return;
    const out = document.createElement('canvas');
    const img = imgRef.current;
    const isRotated = rotation % 180 !== 0;

    // Crop in original image coords
    const srcW = isRotated ? img.naturalHeight : img.naturalWidth;
    const srcH = isRotated ? img.naturalWidth : img.naturalHeight;
    const cropX = crop.x * srcW;
    const cropY = crop.y * srcH;
    const cropW = crop.w * srcW;
    const cropH = crop.h * srcH;

    out.width = Math.round(cropW);
    out.height = Math.round(cropH);
    const ctx = out.getContext('2d')!;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.save();
    ctx.translate(cropW / 2, cropH / 2);
    if (flipH) ctx.scale(-1, 1);
    ctx.rotate((rotation * Math.PI) / 180);
    const drawW = isRotated ? cropH : cropW;
    const drawH = isRotated ? cropW : cropH;
    ctx.drawImage(img, cropX, cropY, drawW, drawH, -cropW / 2, -cropH / 2, cropW, cropH);
    ctx.restore();
    onSave(out.toDataURL('image/jpeg', 0.92));
  };

  if (!ready) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <div className="space-y-3 text-center">
          <div className="skeleton mx-auto h-8 w-8 rounded-full bg-white/10" />
          <p className="text-sm text-slate-400">Rasm yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Crop className="h-4 w-4 text-cyan-300" />
          <span className="text-sm font-semibold text-white">Rasm muharriri</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
            <X className="h-3.5 w-3.5" /> Bekor
          </button>
          <button type="button" onClick={handleSave} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300">
            <Check className="h-3.5 w-3.5" /> Saqlash
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 px-4 pt-3">
        {(['crop', 'adjust'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`cursor-pointer rounded-t-xl px-4 py-2 text-xs font-medium transition ${tab === t ? 'bg-white/8 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'crop' ? <span className="flex items-center gap-1.5"><Crop className="h-3.5 w-3.5" /> Kesish</span>
              : <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Sozlash</span>}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="relative flex items-center justify-center overflow-hidden bg-slate-950/40 p-4" style={{minHeight: 200}}>
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          style={{cursor, maxWidth: '100%', display: 'block', borderRadius: 12}}
          onMouseDown={onMouseDown}
          onMouseMove={(e) => { onMouseMove(e); onMouseMoveForCursor(e); }}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />
      </div>

      {/* Toolbar */}
      <div className="border-t border-white/10 p-4 space-y-4">
        {tab === 'crop' ? (
          <div className="space-y-4">
            {/* Rotation & flip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 w-20">Aylantirish</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => rotate(-1)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" /> Chap</button>
                <button type="button" onClick={() => rotate(1)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><RotateCw className="h-3.5 w-3.5" /> O'ng</button>
                <button type="button" onClick={() => setFlipH(f => !f)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${flipH ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'}`}><FlipHorizontal className="h-3.5 w-3.5" /> Aks</button>
              </div>
            </div>
            {/* Aspect ratio presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 w-20">Nisbat</span>
              <div className="flex flex-wrap gap-2">
                {[['Erkin', 0], ['1:1', 1], ['4:3', 4/3], ['3:2', 3/2], ['16:9', 16/9]].map(([label, r]) => (
                  <button key={label as string} type="button" onClick={() => r === 0 ? resetCrop() : presetCrop(r as number)}
                    className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white">
                    {label as string}
                  </button>
                ))}
                <button type="button" onClick={resetCrop} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10">Tiklash</button>
              </div>
            </div>
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-20">Zoom</span>
              <button type="button" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10"><ZoomOut className="h-3.5 w-3.5" /></button>
              <input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} className="flex-1" />
              <button type="button" onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10"><ZoomIn className="h-3.5 w-3.5" /></button>
              <span className="w-10 text-right text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              {label: 'Yorqinlik', val: brightness, set: setBrightness, min: 50, max: 150},
              {label: 'Kontrast',  val: contrast,   set: setContrast,   min: 50, max: 150},
              {label: 'To\'yinish',val: saturation, set: setSaturation, min: 0,  max: 200},
            ].map(({label, val, set, min, max}) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-slate-400">{label}</span>
                <input type="range" min={min} max={max} value={val} onChange={e => set(parseInt(e.target.value))} className="flex-1" />
                <span className="w-10 text-right text-xs text-slate-400">{val}%</span>
                <button type="button" onClick={() => set(100)} className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">↺</button>
              </div>
            ))}
            <button type="button" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
              Barcha sozlamalarni tiklash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
