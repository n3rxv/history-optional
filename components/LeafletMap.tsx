'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { MapEntry } from '@/lib/mapData';
import { quizBasemap } from '@/lib/basemap';
import 'leaflet/dist/leaflet.css';

// India, south-west corner to north-east.
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 66.5],
  [35.5, 97.5],
];

/**
 * Keeps India filling the map. The frame's width follows the page (a phone,
 * a rotated phone, a desktop column), so the fit is redone whenever it
 * changes size, not only on the first render.
 */
function FitIndia() {
  const map = useMap();
  useEffect(() => {
    const fit = () => { map.invalidateSize(); map.fitBounds(INDIA_BOUNDS, { padding: [8, 8] }); };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

/**
 * The map question's map: a numbered dot for each place. The dots' colours
 * follow the list beside it: accent once answered, green or red once judged,
 * amber when the answer is shown but not yet judged.
 */
export default function LeafletMap({
  entries,
  selectedDot,
  onDotClick,
  answered,
  revealed,
  correct = {},
}: {
  entries: MapEntry[];
  selectedDot: number | null;
  onDotClick: (num: number) => void;
  answered: Record<number, string>;
  revealed: Record<number, boolean>;
  correct?: Record<number, boolean>;
}) {
  return (
    <div className="lm">
      <MapContainer
        bounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        zoomControl
        zoomSnap={0.25}
        scrollWheelZoom={false}
        attributionControl={quizBasemap.requireVisibleAttribution}
      >
        <TileLayer url={quizBasemap.url} maxNativeZoom={quizBasemap.maxNativeZoom} maxZoom={19} attribution={quizBasemap.attribution} />
        <FitIndia />

        {entries.map((entry) => {
          const n = entry.number;
          const isSelected = selectedDot === n;
          const state = correct[n] === true ? 'ok' : correct[n] === false ? 'no' : revealed[n] ? 'shown' : answered[n] || isSelected ? 'done' : '';
          const filled = state !== '';
          // Colours come from classes: a CSS variable written into an SVG
          // attribute is not read by every browser. Leaflet sets a class only
          // when it creates the dot, so a change of state makes a new one.
          return (
            <CircleMarker
              key={`${n}-${state}-${isSelected}`}
              center={[entry.lat, entry.lng]}
              radius={isSelected ? 14 : 10}
              pathOptions={{ className: `lm-dot ${state}${isSelected ? ' sel' : ''}`, fillOpacity: 1, weight: isSelected ? 2.5 : 1.5 }}
              eventHandlers={{ click: () => onDotClick(n) }}
            >
              <Tooltip permanent direction="center" offset={[0, 0]} className="lm-label">
                <span style={{ fontSize: isSelected ? 11 : 9, color: filled ? '#fff' : 'var(--text)' }}>{n}</span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <style>{`
        .lm { width: 100%; height: 520px; background: #e6e6e6; }
        /* The tiles are light grey in either theme; so is what shows between them. */
        .lm .leaflet-container { background: #e6e6e6; font-family: var(--font-ui); }
        /* Leaflet blends tiles with plus-lighter against seams, which at a fractional zoom adds the backdrop in and draws pale lines along every tile edge. */
        .lm .leaflet-container img.leaflet-tile { mix-blend-mode: normal; }
        .lm-dot { fill: var(--ds-card); stroke: var(--text3); }
        .lm-dot.done { fill: var(--accent); stroke: #fff; }
        .lm-dot.shown { fill: var(--warning-text); stroke: #fff; }
        .lm-dot.ok { fill: var(--success-text); stroke: #fff; }
        .lm-dot.no { fill: var(--danger-text); stroke: #fff; }
        .lm-dot.sel { stroke: var(--text); }
        .lm-label { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; font-weight: 800; user-select: none; pointer-events: none; }
        .lm-label::before { display: none !important; }
        @media (max-width: 640px) { .lm { height: min(400px, 105vw); } }
      `}</style>
    </div>
  );
}
