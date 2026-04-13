'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Check, Crop, FlipHorizontal, RotateCcw, RotateCw, SlidersHorizontal, X, ZoomIn, ZoomOut} from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DragState {
  pointerId: number;
  type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  startX: number;
  startY: number;
  startCrop: CropArea;
}

interface ImageEditorProps {
  src: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const HANDLE_SIZE = 12;
const MIN_SIZE = 40;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getStageSize(width: number, height: number, rotation: number) {
  return rotation % 180 === 0
    ? {width, height}
    : {width: height, height: width};
}

export function ImageEditor({src, onSave, onCancel}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [tab, setTab] = useState<'crop' | 'adjust'>('crop');
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);
  const [crop, setCrop] = useState<CropArea>({x: 0, y: 0, w: 1, h: 1});
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [cursor, setCursor] = useState('crosshair');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();

    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      setError(null);
      setReady(true);
    };

    img.onerror = () => {
      if (cancelled) return;
      imgRef.current = null;
      setError('Rasmni yuklashda xatolik yuz berdi. Boshqa URL yoki yangi faylni sinab ko‘ring.');
      setReady(false);
    };

    img.src = src;

    return () => {
      cancelled = true;
      imgRef.current = null;
    };
  }, [src]);

  const recalculateCanvasSize = useCallback(() => {
    if (!containerRef.current || !imgRef.current) return;

    const containerWidth = Math.max(containerRef.current.clientWidth - 16, 180);
    const viewportHeight = typeof window === 'undefined' ? 440 : window.innerHeight;
    const maxHeight = Math.max(240, Math.min(460, viewportHeight * 0.52));
    const stage = getStageSize(imgRef.current.naturalWidth, imgRef.current.naturalHeight, rotation);
    const fitScale = Math.min(containerWidth / stage.width, maxHeight / stage.height, 1);

    setCanvasW(Math.max(1, Math.round(stage.width * fitScale * zoom)));
    setCanvasH(Math.max(1, Math.round(stage.height * fitScale * zoom)));
  }, [rotation, zoom]);

  useEffect(() => {
    if (!ready) return;
    recalculateCanvasSize();

    if (typeof window === 'undefined') return;

    const handleResize = () => recalculateCanvasSize();
    window.addEventListener('resize', handleResize);

    const observer = typeof ResizeObserver === 'undefined' || !containerRef.current
      ? null
      : new ResizeObserver(() => recalculateCanvasSize());

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [ready, recalculateCanvasSize]);

  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || canvasW === 0 || canvasH === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    if (flipH) ctx.scale(-1, 1);
    ctx.rotate((rotation * Math.PI) / 180);

    const drawScale = canvasW / getStageSize(imgRef.current.naturalWidth, imgRef.current.naturalHeight, rotation).width;
    ctx.drawImage(
      imgRef.current,
      -(imgRef.current.naturalWidth * drawScale) / 2,
      -(imgRef.current.naturalHeight * drawScale) / 2,
      imgRef.current.naturalWidth * drawScale,
      imgRef.current.naturalHeight * drawScale
    );
    ctx.restore();
    ctx.filter = 'none';

    const cropX = crop.x * canvasW;
    const cropY = crop.y * canvasH;
    const cropW = crop.w * canvasW;
    const cropH = crop.h * canvasH;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasW, cropY);
    ctx.fillRect(0, cropY + cropH, canvasW, canvasH - cropY - cropH);
    ctx.fillRect(0, cropY, cropX, cropH);
    ctx.fillRect(cropX + cropW, cropY, canvasW - cropX - cropW, cropH);

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    for (let index = 1; index < 3; index += 1) {
      ctx.beginPath();
      ctx.moveTo(cropX + (cropW * index) / 3, cropY);
      ctx.lineTo(cropX + (cropW * index) / 3, cropY + cropH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cropX, cropY + (cropH * index) / 3);
      ctx.lineTo(cropX + cropW, cropY + (cropH * index) / 3);
      ctx.stroke();
    }

    const handles = [
      {x: cropX, y: cropY},
      {x: cropX + cropW, y: cropY},
      {x: cropX, y: cropY + cropH},
      {x: cropX + cropW, y: cropY + cropH},
      {x: cropX + cropW / 2, y: cropY},
      {x: cropX + cropW / 2, y: cropY + cropH},
      {x: cropX, y: cropY + cropH / 2},
      {x: cropX + cropW, y: cropY + cropH / 2}
    ];

    ctx.fillStyle = '#22d3ee';
    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, HANDLE_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [brightness, canvasH, canvasW, contrast, crop, flipH, rotation, saturation]);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || canvasW === 0 || canvasH === 0) return null;

    return {
      x: clamp((clientX - rect.left) / rect.width, 0, 1),
      y: clamp((clientY - rect.top) / rect.height, 0, 1)
    };
  }, [canvasH, canvasW]);

  const hitHandle = useCallback((pointX: number, pointY: number): DragState['type'] | null => {
    if (canvasW === 0 || canvasH === 0) return null;

    const toleranceX = HANDLE_SIZE / canvasW;
    const toleranceY = HANDLE_SIZE / canvasH;
    const near = (value: number, target: number, tolerance: number) => Math.abs(value - target) <= tolerance;

    if (near(pointX, crop.x, toleranceX) && near(pointY, crop.y, toleranceY)) return 'nw';
    if (near(pointX, crop.x + crop.w, toleranceX) && near(pointY, crop.y, toleranceY)) return 'ne';
    if (near(pointX, crop.x, toleranceX) && near(pointY, crop.y + crop.h, toleranceY)) return 'sw';
    if (near(pointX, crop.x + crop.w, toleranceX) && near(pointY, crop.y + crop.h, toleranceY)) return 'se';
    if (near(pointX, crop.x + crop.w / 2, toleranceX) && near(pointY, crop.y, toleranceY)) return 'n';
    if (near(pointX, crop.x + crop.w / 2, toleranceX) && near(pointY, crop.y + crop.h, toleranceY)) return 's';
    if (near(pointX, crop.x, toleranceX) && near(pointY, crop.y + crop.h / 2, toleranceY)) return 'w';
    if (near(pointX, crop.x + crop.w, toleranceX) && near(pointY, crop.y + crop.h / 2, toleranceY)) return 'e';
    if (pointX > crop.x && pointX < crop.x + crop.w && pointY > crop.y && pointY < crop.y + crop.h) return 'move';
    return null;
  }, [canvasH, canvasW, crop]);

  const updateCursor = useCallback((clientX: number, clientY: number) => {
    if (dragging) return;

    const point = getRelativePoint(clientX, clientY);
    if (!point) return;

    const handle = hitHandle(point.x, point.y);
    const nextCursor: Record<NonNullable<typeof handle>, string> = {
      move: 'grab',
      nw: 'nw-resize',
      ne: 'ne-resize',
      sw: 'sw-resize',
      se: 'se-resize',
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize'
    };

    setCursor(handle ? nextCursor[handle] : 'crosshair');
  }, [dragging, getRelativePoint, hitHandle]);

  const startDrag = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    const handle = hitHandle(point.x, point.y);
    if (!handle) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setCursor(handle === 'move' ? 'grabbing' : 'crosshair');
    setDragging({
      pointerId: event.pointerId,
      type: handle,
      startX: point.x,
      startY: point.y,
      startCrop: {...crop}
    });
  }, [crop, getRelativePoint, hitHandle]);

  const updateDrag = useCallback((clientX: number, clientY: number) => {
    if (!dragging || canvasW === 0 || canvasH === 0) return;

    const point = getRelativePoint(clientX, clientY);
    if (!point) return;

    const dx = point.x - dragging.startX;
    const dy = point.y - dragging.startY;
    const minW = MIN_SIZE / canvasW;
    const minH = MIN_SIZE / canvasH;
    const {x: startX, y: startY, w: startW, h: startH} = dragging.startCrop;

    let nextX = startX;
    let nextY = startY;
    let nextW = startW;
    let nextH = startH;

    if (dragging.type === 'move') {
      nextX = clamp(startX + dx, 0, 1 - startW);
      nextY = clamp(startY + dy, 0, 1 - startH);
    } else {
      if (dragging.type.includes('n')) {
        nextY = clamp(startY + dy, 0, startY + startH - minH);
        nextH = startY + startH - nextY;
      }
      if (dragging.type.includes('s')) {
        nextH = clamp(startH + dy, minH, 1 - startY);
      }
      if (dragging.type.includes('w')) {
        nextX = clamp(startX + dx, 0, startX + startW - minW);
        nextW = startX + startW - nextX;
      }
      if (dragging.type.includes('e')) {
        nextW = clamp(startW + dx, minW, 1 - startX);
      }
    }

    setCrop({
      x: clamp(nextX, 0, 1),
      y: clamp(nextY, 0, 1),
      w: clamp(nextW, minW, 1),
      h: clamp(nextH, minH, 1)
    });
  }, [canvasH, canvasW, dragging, getRelativePoint]);

  const stopDrag = useCallback((pointerId?: number) => {
    setDragging((current) => {
      if (!current) return null;
      if (pointerId !== undefined && current.pointerId !== pointerId) return current;
      return null;
    });
    setCursor('crosshair');
  }, []);

  const rotate = (direction: 1 | -1) => setRotation((current) => (current + direction * 90 + 360) % 360);
  const resetCrop = () => setCrop({x: 0, y: 0, w: 1, h: 1});

  const presetCrop = (targetAspect: number) => {
    if (canvasW === 0 || canvasH === 0) return;

    const currentAspect = canvasW / canvasH;
    let nextWidth = 1;
    let nextHeight = 1;

    if (currentAspect > targetAspect) {
      nextWidth = clamp(targetAspect / currentAspect, 0, 1);
    } else {
      nextHeight = clamp(currentAspect / targetAspect, 0, 1);
    }

    setCrop({
      x: (1 - nextWidth) / 2,
      y: (1 - nextHeight) / 2,
      w: nextWidth,
      h: nextHeight
    });
  };

  const handleSave = useCallback(() => {
    if (!imgRef.current) return;

    try {
      const source = imgRef.current;
      const stage = getStageSize(source.naturalWidth, source.naturalHeight, rotation);

      const stageCanvas = document.createElement('canvas');
      stageCanvas.width = stage.width;
      stageCanvas.height = stage.height;

      const stageContext = stageCanvas.getContext('2d');
      if (!stageContext) return;

      stageContext.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      stageContext.save();
      stageContext.translate(stage.width / 2, stage.height / 2);
      if (flipH) stageContext.scale(-1, 1);
      stageContext.rotate((rotation * Math.PI) / 180);
      stageContext.drawImage(
        source,
        -source.naturalWidth / 2,
        -source.naturalHeight / 2,
        source.naturalWidth,
        source.naturalHeight
      );
      stageContext.restore();

      const cropX = clamp(Math.round(crop.x * stage.width), 0, stage.width - 1);
      const cropY = clamp(Math.round(crop.y * stage.height), 0, stage.height - 1);
      const cropW = clamp(Math.round(crop.w * stage.width), 1, stage.width - cropX);
      const cropH = clamp(Math.round(crop.h * stage.height), 1, stage.height - cropY);

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = cropW;
      outputCanvas.height = cropH;

      const outputContext = outputCanvas.getContext('2d');
      if (!outputContext) return;

      outputContext.drawImage(stageCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      onSave(outputCanvas.toDataURL('image/jpeg', 0.92));
    } catch (saveError) {
      console.error('Image editor save failed.', saveError);
      setError('Rasmni saqlab bo‘lmadi. CORS yoki brauzer cheklovi sabab bo‘lishi mumkin.');
    }
  }, [brightness, contrast, crop, flipH, onSave, rotation, saturation]);

  if (error && !ready) {
    return (
      <div className="rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-5">
        <p className="text-sm font-medium text-rose-200">Rasm muharriri ochilmadi</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{error}</p>
      </div>
    );
  }

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
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
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

      <div className="flex gap-1 border-b border-white/10 px-4 pt-3">
        {(['crop', 'adjust'] as const).map((currentTab) => (
          <button
            key={currentTab}
            type="button"
            onClick={() => setTab(currentTab)}
            className={`cursor-pointer rounded-t-xl px-4 py-2 text-xs font-medium transition ${tab === currentTab ? 'bg-white/8 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            {currentTab === 'crop'
              ? <span className="flex items-center gap-1.5"><Crop className="h-3.5 w-3.5" /> Kesish</span>
              : <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> Sozlash</span>}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="relative flex items-center justify-center overflow-hidden bg-slate-950/40 p-4" style={{minHeight: 220}}>
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          style={{cursor, display: 'block', maxWidth: '100%', touchAction: 'none', borderRadius: 12}}
          onPointerDown={startDrag}
          onPointerMove={(event) => {
            if (dragging?.pointerId === event.pointerId) {
              event.preventDefault();
              updateDrag(event.clientX, event.clientY);
              return;
            }
            updateCursor(event.clientX, event.clientY);
          }}
          onPointerUp={(event) => {
            if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
              canvasRef.current.releasePointerCapture(event.pointerId);
            }
            stopDrag(event.pointerId);
          }}
          onPointerCancel={(event) => {
            if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
              canvasRef.current.releasePointerCapture(event.pointerId);
            }
            stopDrag(event.pointerId);
          }}
          onPointerLeave={() => {
            if (!dragging) {
              setCursor('crosshair');
            }
          }}
        />
      </div>

      {error ? (
        <div className="border-t border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-4 border-t border-white/10 p-4">
        {tab === 'crop' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-xs text-slate-400">Aylantirish</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => rotate(-1)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><RotateCcw className="h-3.5 w-3.5" /> Chap</button>
                <button type="button" onClick={() => rotate(1)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10"><RotateCw className="h-3.5 w-3.5" /> O&apos;ng</button>
                <button type="button" onClick={() => setFlipH((current) => !current)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${flipH ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-300' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'}`}><FlipHorizontal className="h-3.5 w-3.5" /> Aks</button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 text-xs text-slate-400">Nisbat</span>
              <div className="flex flex-wrap gap-2">
                {[['Erkin', 0], ['1:1', 1], ['4:3', 4 / 3], ['3:2', 3 / 2], ['16:9', 16 / 9]].map(([label, ratio]) => (
                  <button
                    key={label as string}
                    type="button"
                    onClick={() => ratio === 0 ? resetCrop() : presetCrop(ratio as number)}
                    className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {label as string}
                  </button>
                ))}
                <button type="button" onClick={resetCrop} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10">
                  Tiklash
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-xs text-slate-400">Zoom</span>
              <button type="button" onClick={() => setZoom((current) => clamp(Number((current - 0.1).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10"><ZoomOut className="h-3.5 w-3.5" /></button>
              <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="flex-1" />
              <button type="button" onClick={() => setZoom((current) => clamp(Number((current + 0.1).toFixed(2)), MIN_ZOOM, MAX_ZOOM))} className="cursor-pointer rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:bg-white/10"><ZoomIn className="h-3.5 w-3.5" /></button>
              <span className="w-10 text-right text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {[
              {label: 'Yorqinlik', value: brightness, setter: setBrightness, min: 50, max: 150},
              {label: 'Kontrast', value: contrast, setter: setContrast, min: 50, max: 150},
              {label: 'To\'yinish', value: saturation, setter: setSaturation, min: 0, max: 200}
            ].map(({label, value, setter, min, max}) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-slate-400">{label}</span>
                <input type="range" min={min} max={max} value={value} onChange={(event) => setter(Number(event.target.value))} className="flex-1" />
                <span className="w-10 text-right text-xs text-slate-400">{value}%</span>
                <button type="button" onClick={() => setter(100)} className="cursor-pointer text-xs text-slate-500 hover:text-slate-300">↺</button>
              </div>
            ))}
            <button type="button" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }} className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10">
              Barcha sozlamalarni tiklash
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
