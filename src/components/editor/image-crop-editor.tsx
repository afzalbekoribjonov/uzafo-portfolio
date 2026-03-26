'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Check, ChevronLeft, ChevronRight, Minus, Plus, RefreshCw, RotateCcw, RotateCw, X, ZoomIn, ZoomOut} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface CropBox { x: number; y: number; w: number; h: number; }
type Ratio = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

const RATIOS: {label: string; value: Ratio; r?: number}[] = [
  {label:'Erkin', value:'free'},
  {label:'1:1', value:'1:1', r:1},
  {label:'4:3', value:'4:3', r:4/3},
  {label:'16:9', value:'16:9', r:16/9},
  {label:'3:2', value:'3:2', r:3/2},
];

interface Props {
  src: string;           // data URL or URL
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

/* ── Component ──────────────────────────────────────────────────────────── */
export function ImageCropEditor({src, onSave, onCancel}: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [loaded,  setLoaded]  = useState(false);
  const [scale,   setScale]   = useState(1);
  const [rotate,  setRotate]  = useState(0);
  const [flipH,   setFlipH]   = useState(false);
  const [ratio,   setRatio]   = useState<Ratio>('free');
  const [brightness, setBrightness] = useState(100);
  const [contrast,   setContrast]   = useState(100);
  const [crop,    setCrop]    = useState<CropBox>({x:0,y:0,w:100,h:100}); // percent
  const [dragging,setDragging]= useState<{mode:'move'|'resize'; sx:number; sy:number; cx:number; cy:number; cw:number; ch:number}|null>(null);

  /* Load image */
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
      setCrop({x:0, y:0, w:100, h:100});
    };
    img.src = src;
  }, [src]);

  /* Draw on canvas */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !loaded) return;

    const W = canvas.width;
    const H = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.save();

    // background
    ctx.fillStyle = 'var(--bg-deep, #0f172a)';
    ctx.fillRect(0, 0, W, H);

    // filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Center + transforms
    ctx.translate(W/2, H/2);
    ctx.rotate((rotate * Math.PI) / 180);
    if (flipH) ctx.scale(-1, 1);

    const maxW = W * 0.9 * scale;
    const maxH = H * 0.9 * scale;
    const aspect = img.naturalWidth / img.naturalHeight;
    let dw = maxW, dh = maxW / aspect;
    if (dh > maxH) { dh = maxH; dw = maxH * aspect; }

    ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
    ctx.restore();

    // Crop overlay - darken outside
    const cx = crop.x / 100 * W;
    const cy = crop.y / 100 * H;
    const cw = crop.w / 100 * W;
    const ch = crop.h / 100 * H;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, cy);
    ctx.fillRect(0, cy + ch, W, H - cy - ch);
    ctx.fillRect(0, cy, cx, ch);
    ctx.fillRect(cx + cw, cy, W - cx - cw, ch);

    // Crop border
    ctx.strokeStyle = 'rgba(34,211,238,0.9)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule-of-thirds guides
    ctx.strokeStyle = 'rgba(34,211,238,0.25)';
    ctx.lineWidth = 0.75;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(cx + cw*i/3, cy); ctx.lineTo(cx + cw*i/3, cy+ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + ch*i/3); ctx.lineTo(cx+cw, cy + ch*i/3); ctx.stroke();
    }

    // Corner handles
    const hs = 8;
    ctx.fillStyle = '#22d3ee';
    const corners = [[cx,cy],[cx+cw,cy],[cx,cy+ch],[cx+cw,cy+ch]];
    corners.forEach(([hx,hy]) => { ctx.fillRect(hx-hs/2, hy-hs/2, hs, hs); });
  }, [loaded, scale, rotate, flipH, crop, brightness, contrast]);

  useEffect(() => { draw(); }, [draw]);

  /* Mouse handlers */
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 100;
    const y = (e.clientY - r.top) / r.height * 100;
    return {x, y};
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const {x, y} = getPos(e);
    const cx = crop.x, cy = crop.y, cw = crop.w, ch = crop.h;
    // Check if near a corner (resize)
    const corners = [{x:cx,y:cy},{x:cx+cw,y:cy},{x:cx,y:cy+ch},{x:cx+cw,y:cy+ch}];
    const near = corners.find(c => Math.abs(c.x-x)<4 && Math.abs(c.y-y)<4);
    const mode = near || (x>=cx && x<=cx+cw && y>=cy && y<=cy+ch) ? (near ? 'resize' : 'move') : null;
    if (mode) setDragging({mode, sx:x, sy:y, cx, cy, cw, ch});
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const {x, y} = getPos(e);
    const dx = x - dragging.sx;
    const dy = y - dragging.sy;
    if (dragging.mode === 'move') {
      const newX = Math.max(0, Math.min(100 - dragging.cw, dragging.cx + dx));
      const newY = Math.max(0, Math.min(100 - dragging.ch, dragging.cy + dy));
      setCrop(c => ({...c, x:newX, y:newY}));
    } else {
      // Resize from bottom-right corner (simplified)
      const canvas = canvasRef.current;
      if (!canvas) return;
      const aspect = canvas.width / canvas.height;
      let newW = Math.max(10, Math.min(100 - dragging.cx, dragging.cw + dx));
      let newH = Math.max(10, Math.min(100 - dragging.cy, dragging.ch + dy));
      if (ratio !== 'free') {
        const r = RATIOS.find(rv => rv.value === ratio)?.r ?? 1;
        newH = newW / r / (canvas.width / canvas.height) * (canvas.width / canvas.height);
        // Simpler: fix width, compute height
        newH = (newW / 100 * canvas.width) / r / canvas.height * 100;
        newH = Math.max(5, Math.min(100 - dragging.cy, newH));
      }
      setCrop(c => ({...c, w:newW, h:newH}));
    }
  };

  const onMouseUp = () => setDragging(null);

  /* Crop ratio change */
  const changeRatio = (rv: Ratio) => {
    setRatio(rv);
    if (rv === 'free') return;
    const r = RATIOS.find(x => x.value === rv)?.r ?? 1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const asp = canvas.width / canvas.height;
    const w = 80;
    const h = w / r / asp * 100 * (canvas.height / canvas.width);
    const hw = (w / r / asp) * (canvas.height / canvas.width);
    const newH = Math.min(90, hw);
    const newW = Math.min(90, newH * r * asp);
    setCrop({x:(100-newW)/2, y:(100-newH)/2, w:newW, h:newH});
  };

  /* Export */
  const handleSave = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Create export canvas
    const out = document.createElement('canvas');
    const W = canvas.width, H = canvas.height;
    const cx = crop.x/100*W, cy = crop.y/100*H;
    const cw = crop.w/100*W, ch = crop.h/100*H;
    out.width = Math.round(cw);
    out.height = Math.round(ch);
    const ctx = out.getContext('2d');
    if (!ctx) return;

    // Redraw full image onto temp canvas, then extract crop region
    const tmp = document.createElement('canvas');
    tmp.width = W; tmp.height = H;
    const tc = tmp.getContext('2d');
    if (!tc) return;

    tc.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    tc.translate(W/2, H/2);
    tc.rotate((rotate * Math.PI) / 180);
    if (flipH) tc.scale(-1,1);
    const maxW = W * 0.9 * scale, maxH = H * 0.9 * scale;
    const asp = img.naturalWidth / img.naturalHeight;
    let dw = maxW, dh = maxW / asp;
    if (dh > maxH) { dh = maxH; dw = maxH * asp; }
    tc.drawImage(img, -dw/2, -dh/2, dw, dh);

    ctx.drawImage(tmp, cx, cy, cw, ch, 0, 0, cw, ch);
    onSave(out.toDataURL('image/jpeg', 0.92));
  };

  /* Reset */
  const resetAll = () => {
    setScale(1); setRotate(0); setFlipH(false);
    setBrightness(100); setContrast(100);
    setCrop({x:0,y:0,w:100,h:100});
    setRatio('free');
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:60, display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', padding:'16px',
    }}>
      <div style={{
        width:'100%', maxWidth:'840px', maxHeight:'92vh', display:'flex', flexDirection:'column',
        background:'var(--bg-overlay)', border:'1px solid var(--bd)', borderRadius:'24px', overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--bd)'}}>
          <p style={{color:'var(--fg-1)', fontWeight:600, fontSize:'.95rem'}}>Rasmni tahrirlash</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetAll} style={{
              display:'inline-flex', alignItems:'center', gap:'6px', borderRadius:'999px', padding:'6px 12px',
              fontSize:'.8rem', color:'var(--fg-3)', background:'var(--bg-surface)', border:'1px solid var(--bd)', cursor:'pointer',
            }}><RefreshCw className="h-3.5 w-3.5"/> Qayta boshlash</button>
            <button type="button" onClick={onCancel} style={{
              borderRadius:'999px', padding:'7px', background:'var(--bg-surface)', border:'1px solid var(--bd)',
              color:'var(--fg-3)', cursor:'pointer', display:'inline-flex',
            }}><X className="h-4 w-4"/></button>
          </div>
        </div>

        {/* Canvas area */}
        <div ref={containerRef} style={{flex:1, padding:'16px', display:'flex', justifyContent:'center', alignItems:'center', minHeight:0, overflow:'hidden'}}>
          <canvas
            ref={canvasRef}
            width={720} height={460}
            style={{
              maxWidth:'100%', maxHeight:'100%', borderRadius:'12px', cursor: dragging ? 'grabbing' : 'crosshair',
              border:'1px solid var(--bd)',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
          {!loaded ? (
            <div style={{position:'absolute', color:'var(--fg-3)', fontSize:'.875rem'}}>Yuklanmoqda...</div>
          ) : null}
        </div>

        {/* Controls */}
        <div style={{padding:'12px 20px', borderTop:'1px solid var(--bd)', display:'flex', flexDirection:'column', gap:'12px'}}>
          {/* Ratio selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span style={{fontSize:'.75rem', color:'var(--fg-4)', minWidth:'60px'}}>Nisbat:</span>
            {RATIOS.map(rv => (
              <button key={rv.value} type="button" onClick={() => changeRatio(rv.value)} style={{
                borderRadius:'999px', padding:'4px 12px', fontSize:'.78rem', cursor:'pointer',
                color: ratio===rv.value ? 'var(--accent-fg)' : 'var(--fg-3)',
                background: ratio===rv.value ? 'var(--accent)' : 'var(--bg-surface)',
                border: ratio===rv.value ? '1px solid var(--accent)' : '1px solid var(--bd)',
                fontWeight: ratio===rv.value ? 600 : 400,
              }}>{rv.label}</button>
            ))}
          </div>

          {/* Zoom + Rotate + Flip */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Zoom */}
            <div className="flex items-center gap-2">
              <span style={{fontSize:'.75rem', color:'var(--fg-4)', minWidth:'40px'}}>Zoom:</span>
              <button type="button" onClick={() => setScale(s => Math.max(0.3,s-0.1))} style={{borderRadius:'999px', padding:'4px', background:'var(--bg-surface)', border:'1px solid var(--bd)', color:'var(--fg-2)', cursor:'pointer', display:'inline-flex'}}><Minus className="h-3.5 w-3.5"/></button>
              <span style={{fontSize:'.8rem', color:'var(--fg-2)', minWidth:'40px', textAlign:'center'}}>{Math.round(scale*100)}%</span>
              <button type="button" onClick={() => setScale(s => Math.min(3,s+0.1))} style={{borderRadius:'999px', padding:'4px', background:'var(--bg-surface)', border:'1px solid var(--bd)', color:'var(--fg-2)', cursor:'pointer', display:'inline-flex'}}><Plus className="h-3.5 w-3.5"/></button>
              <input type="range" min="30" max="300" value={Math.round(scale*100)} onChange={e => setScale(Number(e.target.value)/100)}
                style={{width:'80px', accentColor:'var(--accent)', cursor:'pointer'}}/>
            </div>
            {/* Rotate */}
            <div className="flex items-center gap-2">
              <span style={{fontSize:'.75rem', color:'var(--fg-4)', minWidth:'50px'}}>Burish:</span>
              <button type="button" onClick={() => setRotate(r=>(r-90+360)%360)} style={{borderRadius:'999px', padding:'4px', background:'var(--bg-surface)', border:'1px solid var(--bd)', color:'var(--fg-2)', cursor:'pointer', display:'inline-flex'}}><RotateCcw className="h-3.5 w-3.5"/></button>
              <span style={{fontSize:'.8rem', color:'var(--fg-2)', minWidth:'40px', textAlign:'center'}}>{rotate}°</span>
              <button type="button" onClick={() => setRotate(r=>(r+90)%360)} style={{borderRadius:'999px', padding:'4px', background:'var(--bg-surface)', border:'1px solid var(--bd)', color:'var(--fg-2)', cursor:'pointer', display:'inline-flex'}}><RotateCw className="h-3.5 w-3.5"/></button>
            </div>
            {/* Flip */}
            <button type="button" onClick={() => setFlipH(f=>!f)} style={{
              borderRadius:'999px', padding:'4px 12px', fontSize:'.78rem', cursor:'pointer',
              color: flipH ? 'var(--accent-fg)' : 'var(--fg-3)',
              background: flipH ? 'var(--accent)' : 'var(--bg-surface)',
              border: flipH ? '1px solid var(--accent)' : '1px solid var(--bd)',
            }}>↔ Aks</button>
          </div>

          {/* Brightness / Contrast */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span style={{fontSize:'.75rem', color:'var(--fg-4)', minWidth:'80px'}}>Yorqinlik:</span>
              <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))}
                style={{width:'100px', accentColor:'var(--accent)', cursor:'pointer'}}/>
              <span style={{fontSize:'.78rem', color:'var(--fg-3)', minWidth:'36px'}}>{brightness}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{fontSize:'.75rem', color:'var(--fg-4)', minWidth:'80px'}}>Kontrast:</span>
              <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))}
                style={{width:'100px', accentColor:'var(--accent)', cursor:'pointer'}}/>
              <span style={{fontSize:'.78rem', color:'var(--fg-3)', minWidth:'36px'}}>{contrast}%</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onCancel} style={{
              borderRadius:'999px', padding:'8px 20px', fontSize:'.875rem', cursor:'pointer',
              color:'var(--fg-2)', background:'var(--bg-surface)', border:'1px solid var(--bd)',
            }}>Bekor qilish</button>
            <button type="button" onClick={handleSave} style={{
              borderRadius:'999px', padding:'8px 24px', fontSize:'.875rem', fontWeight:600, cursor:'pointer',
              color:'var(--accent-fg)', background:'var(--accent)', border:'none',
              display:'inline-flex', alignItems:'center', gap:'6px',
            }}><Check className="h-4 w-4"/> Saqlash</button>
          </div>
        </div>
      </div>
    </div>
  );
}
