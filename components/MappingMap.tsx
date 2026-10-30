'use client';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, Pane, useMap } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { MapSite } from '@/lib/mapBook';
import { bookBasemap, physicalBasemap } from '@/lib/basemap';
import { useLang } from '@/lib/i18n/LangContext';
import 'leaflet/dist/leaflet.css';

/** Political: the tiles with state lines. Physical: relief and rivers. Outline: the exam's plain map. */
export type MapBase = 'political' | 'physical' | 'outline';

const INDIA_BOUNDS: [[number, number], [number, number]] = [[7.067, 56.787], [37.193, 102.996]];

// Fetched once per visit and shared by every map on the page.
let statesP: Promise<GeoJsonObject | null> | null = null;
let outlineP: Promise<GeoJsonObject | null> | null = null;
const fetchJson = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null);
function useGeo(kind: 'states' | 'outline', on: boolean) {
  const [data, setData] = useState<GeoJsonObject | null>(null);
  useEffect(() => {
    if (!on) return;
    const p = kind === 'states' ? (statesP ??= fetchJson('/india_states.geojson')) : (outlineP ??= fetchJson('/api/map-outline'));
    let live = true;
    p.then((d) => { if (live) setData(d); });
    return () => { live = false; };
  }, [kind, on]);
  return on ? data : null;
}

/**
 * Frames the map: every place in view, the picked one flown to, or (for the
 * quiz) the whole of India. Redone when the frame changes size, as it does
 * when a phone turns or a chapter opens beside another.
 */
function Frame({ sites, selected, fixed }: { sites: MapSite[]; selected: string | null; fixed?: boolean }) {
  const map = useMap();
  const fit = useCallback(() => {
    if (fixed || sites.length === 0) { map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] }); return; }
    if (sites.length === 1) { map.setView([sites[0].lat, sites[0].lng], 6); return; }
    const lats = sites.map((s) => s.lat), lngs = sites.map((s) => s.lng);
    map.fitBounds([[Math.min(...lats) - 1, Math.min(...lngs) - 1], [Math.max(...lats) + 1, Math.max(...lngs) + 1]], { padding: [20, 20] });
  }, [map, sites, fixed]);
  useEffect(() => {
    const target = !fixed && selected ? sites.find((s) => s.name === selected) : undefined;
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 5), { duration: 0.6 });
    else fit();
  }, [map, sites, selected, fixed, fit]);
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/** Lines of latitude and longitude every 4°, and the Tropic of Cancer, as on the exam's outline map. */
function Graticule({ hi }: { hi: boolean }) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = map.getContainer();
    const w = box.clientWidth, h = box.clientHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.font = '600 9px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 0.8;
    for (let lat = 8; lat <= 36; lat += 4) {
      const a = map.latLngToContainerPoint([lat, 60]), b = map.latLngToContainerPoint([lat, 104]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(`${lat}°N`, 3, a.y);
      ctx.textAlign = 'right'; ctx.fillText(`${lat}°N`, w - 3, a.y);
    }
    for (let lng = 60; lng <= 104; lng += 4) {
      const a = map.latLngToContainerPoint([36, lng]), b = map.latLngToContainerPoint([8, lng]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(`${lng}°E`, a.x, 2);
      ctx.textBaseline = 'bottom'; ctx.fillText(`${lng}°E`, b.x, h - 2);
    }
    const t1 = map.latLngToContainerPoint([23.5, 60]), t2 = map.latLngToContainerPoint([23.5, 104]);
    ctx.beginPath(); ctx.setLineDash([8, 4]); ctx.lineWidth = 1.2; ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke(); ctx.setLineDash([]);
    ctx.textBaseline = 'bottom'; ctx.textAlign = 'left'; ctx.fillText(hi ? 'कर्क रेखा (23½°N)' : 'Tropic of Cancer (23½°N)', t1.x + 4, t1.y - 2);
  }, [map, hi]);
  useEffect(() => {
    const box = map.getContainer();
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:450;';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;';
    layer.appendChild(canvas); box.appendChild(layer); canvasRef.current = canvas;
    redraw();
    map.on('move zoom moveend zoomend resize', redraw);
    return () => { map.off('move zoom moveend zoomend resize', redraw); layer.remove(); canvasRef.current = null; };
  }, [map, redraw]);
  return null;
}

/**
 * The map book's map. Places are blue dots, the ones UPSC has asked amber,
 * the picked one a white dot ringed in blue. The base is the political map
 * (tiles and state lines), the physical map (relief and rivers, no names) or
 * the plain outline of the region, as in the exam; the quiz uses the outline
 * by default, so a basemap label cannot give the answer away. A past paper's
 * places carry their number on the paper and are drawn as numbered dots, as
 * on the exam's map. Dot colours come from classes, since a CSS variable in an
 * SVG attribute is not read by every browser, and each dot has a wider,
 * invisible ring around it to be easy to tap.
 */
export default function MappingMap({ sites, selected, onPick, outline = false, base: baseProp, grid = false, fixed = false, quiet = false }: {
  sites: MapSite[];
  selected: string | null;
  onPick: (name: string) => void;
  /** The plain outline map, no tiles and no state lines. Shorthand for base="outline". */
  outline?: boolean;
  base?: MapBase;
  grid?: boolean;
  /** Keep India in frame whatever is picked (the quiz). */
  fixed?: boolean;
  /** No names on hover (the quiz, and testing yourself on a paper). */
  quiet?: boolean;
}) {
  const { langHi: hi } = useLang();
  const base: MapBase = baseProp ?? (outline ? 'outline' : 'political');
  const plain = base === 'outline';
  const states = useGeo('states', base === 'political');
  const shape = useGeo('outline', base !== 'political');
  const tiles = base === 'physical' ? physicalBasemap : bookBasemap;
  return (
    <div className={`mm${plain ? ' plain' : ''}`}>
      <MapContainer key={base} bounds={INDIA_BOUNDS} style={{ width: '100%', height: '100%' }}
        zoomControl scrollWheelZoom={false} attributionControl={!plain && tiles.requireVisibleAttribution}>
        {/* Shapes arrive after the dots; in the dots' own layer they would be drawn over them. */}
        <Pane name="shapes" style={{ zIndex: 350 }}>
          {plain ? (
            shape && <GeoJSON data={shape} interactive={false} style={(f) => {
              const india = f?.properties?.name === 'India';
              return { fillColor: india ? '#fbf8f2' : '#ebe7de', fillOpacity: 1, color: '#3a3a3a', weight: india ? 1.4 : 0.7 };
            }} />
          ) : base === 'physical' ? (
            // The relief has no borders of its own: the countries' outlines, unfilled.
            shape && <GeoJSON data={shape} interactive={false} style={() => ({ fill: false, className: 'mm-border', weight: 1 })} />
          ) : (
            states && <GeoJSON data={states} interactive={false} style={() => ({ fill: false, color: '#8a8a8a', weight: 1, opacity: 0.7 })} />
          )}
        </Pane>
        {!plain && <TileLayer url={tiles.url} maxNativeZoom={tiles.maxNativeZoom} maxZoom={19} attribution={tiles.attribution} />}
        <Frame sites={sites} selected={selected} fixed={fixed} />
        {grid && <Graticule hi={hi} />}
        {sites.map((s) => {
          const on = selected === s.name;
          const asked = s.asked.length > 0;
          if (s.num != null) {
            return (
              <Fragment key={s.name}>
                <CircleMarker center={[s.lat, s.lng]} radius={18} pathOptions={{ className: 'mm-hit', weight: 0 }} eventHandlers={{ click: () => onPick(s.name) }}>
                  {!quiet && (
                    <Tooltip direction="top" offset={[0, -10]} className="mm-tip">
                      <strong>{s.num}. {s.label}</strong>
                      {s.place && <span>{s.place}</span>}
                    </Tooltip>
                  )}
                </CircleMarker>
                <CircleMarker
                  key={`${s.name}-${on}`}
                  center={[s.lat, s.lng]}
                  radius={on ? 13 : 10}
                  pathOptions={{ className: `mm-num${on ? ' on' : ''}`, fillOpacity: 1, weight: on ? 2.5 : 1.5 }}
                  eventHandlers={{ click: () => onPick(s.name) }}
                >
                  <Tooltip permanent direction="center" offset={[0, 0]} className={`mm-n${on ? ' on' : ''}`}>{s.num}</Tooltip>
                </CircleMarker>
              </Fragment>
            );
          }
          return (
            <Fragment key={s.name}>
              <CircleMarker center={[s.lat, s.lng]} radius={16} pathOptions={{ className: 'mm-hit', weight: 0 }} eventHandlers={{ click: () => onPick(s.name) }} />
              <CircleMarker
                // Leaflet sets a class only when it makes the dot.
                key={`${s.name}-${on}`}
                center={[s.lat, s.lng]}
                // The quiz's one place is the whole question; it is drawn larger.
                radius={on ? 8 : quiet ? 7 : 5}
                pathOptions={{ className: `mm-dot${asked ? ' asked' : ''}${on ? ' on' : ''}`, fillOpacity: 1, weight: on ? 3 : 1.5 }}
                eventHandlers={{ click: () => onPick(s.name) }}
              >
                {!quiet && (
                  <Tooltip direction="top" offset={[0, -6]} className="mm-tip">
                    <strong>{s.label}</strong>
                    <span>{s.place}</span>
                    {asked && <em>{hi ? 'UPSC ने पूछा' : 'Asked'} {s.asked.join(', ')}</em>}
                  </Tooltip>
                )}
              </CircleMarker>
            </Fragment>
          );
        })}
      </MapContainer>
      <style>{`
        .mm { position: relative; z-index: 0; isolation: isolate; width: 100%; height: var(--map-h, 440px); border: 1px solid var(--border2); border-radius: var(--radius-lg, 14px); overflow: hidden; background: #e6e6e6; }
        .mm .leaflet-container { background: #e6e6e6; font-family: var(--font-ui); }
        .mm.plain, .mm.plain .leaflet-container { background: #d6e4f0; }
        /* Leaflet's plus-lighter tile blend draws pale seams at a fractional zoom. */
        .mm .leaflet-container img.leaflet-tile { mix-blend-mode: normal; }
        .mm-hit { fill: transparent; stroke: none; cursor: pointer; }
        .mm-dot { fill: var(--accent); stroke: rgba(255, 255, 255, 0.85); cursor: pointer; }
        .mm-dot.asked { fill: var(--warning-text); }
        .mm-dot.on { fill: #fff; stroke: var(--accent); }
        .mm-border { stroke: var(--black-700); stroke-opacity: 0.55; }
        .mm-num { fill: var(--white-50); stroke: var(--black-800); cursor: pointer; }
        .mm-num.on { fill: var(--accent); stroke: var(--white-50); }
        .mm-n { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; color: var(--black-800) !important; font: 800 10px var(--font-ui); user-select: none; pointer-events: none; }
        .mm-n.on { color: var(--white-50) !important; font-size: 11px; }
        .mm-n::before { display: none !important; }
        .mm-tip { display: flex; flex-direction: column; gap: 1px; padding: 6px 10px !important; background: var(--ds-card, #fff) !important; border: 1px solid var(--border2) !important; border-radius: 8px !important; box-shadow: var(--elev-2) !important; color: var(--text) !important; font-family: var(--font-ui); font-size: 12px; }
        .mm-tip span { color: var(--text3); font-size: 11px; }
        .mm-tip em { font-style: normal; color: var(--warning-text); font-size: 11px; font-weight: 600; }
        .mm-tip::before { border-top-color: var(--border2) !important; }
      `}</style>
    </div>
  );
}
