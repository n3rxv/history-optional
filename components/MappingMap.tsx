'use client';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { useEffect, useState, useCallback, useRef } from 'react';
import { indiaGeoJSON } from '@/lib/indiaGeoJSON';
import { BookSite } from '@/lib/bookData';
import { useLang } from '@/lib/i18n/LangContext';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [7.067, 56.787],
  [37.193, 102.996],
];

function FitBounds({ sites, selectedSite, disableAutoZoom }: { sites: BookSite[]; selectedSite: string | null; disableAutoZoom?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (disableAutoZoom) { map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] }); return; }
    const valid = sites.filter(s => s.lat != null && s.lng != null);
    if (selectedSite) {
      const target = valid.find(s => s.name === selectedSite);
      if (target) { map.flyTo([target.lat as number, target.lng as number], 5, { duration: 0.6 }); return; }
    }
    if (valid.length === 0) { map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] }); return; }
    if (valid.length === 1) { map.setView([valid[0].lat as number, valid[0].lng as number], 6); return; }
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...valid.map(s => s.lat as number)) - 1, Math.min(...valid.map(s => s.lng as number)) - 1],
      [Math.max(...valid.map(s => s.lat as number)) + 1, Math.max(...valid.map(s => s.lng as number)) + 1],
    ];
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, sites, selectedSite, disableAutoZoom]);
  return null;
}

function GraticuleGrid() {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const INTERVAL = 4;
  const LAT_MIN = 8, LAT_MAX = 36, LNG_MIN = 60, LNG_MAX = 104;
  const TROPIC = 23.5;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mapContainer = map.getContainer();
    const w = mapContainer.clientWidth;
    const h = mapContainer.clientHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const LINE_COLOR = 'rgba(0,0,0,0.85)';
    const LABEL_COLOR = 'rgba(0,0,0,1)';
    const FONT = 'bold 8px monospace';

    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += INTERVAL) {
      const p1 = map.latLngToContainerPoint([lat, LNG_MIN]);
      const p2 = map.latLngToContainerPoint([lat, LNG_MAX]);
      ctx.beginPath();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = LINE_COLOR;
      ctx.setLineDash([]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.font = FONT;
      ctx.fillStyle = LABEL_COLOR;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(`${lat}°N`, 3, p1.y);
      ctx.textAlign = 'right';
      ctx.fillText(`${lat}°N`, w - 3, p1.y);
    }

    for (let lng = LNG_MIN; lng <= LNG_MAX; lng += INTERVAL) {
      const p1 = map.latLngToContainerPoint([LAT_MAX, lng]);
      const p2 = map.latLngToContainerPoint([LAT_MIN, lng]);
      ctx.beginPath();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = LINE_COLOR;
      ctx.setLineDash([]);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.font = FONT;
      ctx.fillStyle = LABEL_COLOR;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${lng}°E`, p1.x, 2);
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${lng}°E`, p2.x, h - 2);
    }

    const tc1 = map.latLngToContainerPoint([TROPIC, LNG_MIN]);
    const tc2 = map.latLngToContainerPoint([TROPIC, LNG_MAX]);
    ctx.beginPath();
    ctx.setLineDash([8, 4]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.moveTo(tc1.x, tc1.y);
    ctx.lineTo(tc2.x, tc2.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('Tropic of Cancer (23½°N)', tc1.x + 4, tc1.y - 2);
  }, [map]);

  useEffect(() => {
    const mapContainer = map.getContainer();
    const div = document.createElement('div');
    div.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:450;';
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;top:0;left:0;';
    div.appendChild(canvas);
    mapContainer.appendChild(div);
    canvasRef.current = canvas;
    redraw();
    map.on('move zoom moveend zoomend resize', redraw);
    return () => {
      map.off('move zoom moveend zoomend resize', redraw);
      if (mapContainer.contains(div)) mapContainer.removeChild(div);
      canvasRef.current = null;
    };
  }, [map, redraw]);

  return null;
}

export default function MappingMap({
  sites, selectedSite, onSiteClick, noLabels = false, disableAutoZoom = false, showGrid = false,
}: {
  sites: BookSite[]; selectedSite: string | null; onSiteClick: (name: string) => void;
  noLabels?: boolean; disableAutoZoom?: boolean; showGrid?: boolean;
}) {
  const validSites = sites.filter(s => s.lat != null && s.lng != null);
  const [statesGeoJSON, setStatesGeoJSON] = useState<any>(null);
  const { langHi } = useLang();

  useEffect(() => {
    fetch('/india_states.geojson').then(r => r.json()).then(data => setStatesGeoJSON(data)).catch(() => {});
  }, []);

  const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ width: '100%', height: 420, border: '1.5px solid var(--border2)', borderRadius: 10, overflow: 'hidden', position: 'relative', zIndex: 0 }}>
      <MapContainer
        key={noLabels ? 'nolabels' : 'labels'}
        bounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%', background: noLabels ? '#c8d8e8' : 'var(--bg2)' }}
        zoomControl={true} scrollWheelZoom={true} attributionControl={false}
      >
        {noLabels ? (
          <GeoJSON data={indiaGeoJSON as any} style={(feature: any) => {
            const isIndia = feature?.properties?.name === 'India';
            return { fillColor: isIndia ? '#f5f0e8' : '#e8e3d8', fillOpacity: 1, color: '#222', weight: isIndia ? 1.5 : 0.8 };
          }} />
        ) : (
          <>
            <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap &copy; CARTO" />
            {statesGeoJSON && (
              <GeoJSON key="states" data={statesGeoJSON} interactive={false}
                style={() => ({ fillColor: 'transparent', fillOpacity: 0, color: '#888', weight: 1, opacity: 0.7 })}
              />
            )}
          </>
        )}
        <FitBounds sites={validSites} selectedSite={selectedSite} disableAutoZoom={disableAutoZoom} />
        {showGrid && <GraticuleGrid />}
        {validSites.map((site) => {
          const isSelected = selectedSite === site.name;
          const hasPYQ = site.pyqYears && site.pyqYears.length > 0;
          return (
            <>
            <CircleMarker
              key={`${site.name}_hit`}
              center={[site.lat as number, site.lng as number]}
              radius={18}
              pathOptions={{ fillColor: 'transparent', fillOpacity: 0, color: 'transparent', weight: 0 }}
              eventHandlers={{ click: () => onSiteClick(site.name) }}
            />
            <CircleMarker
              key={site.name}
              center={[site.lat as number, site.lng as number]}
              radius={isSelected ? 8 : 4}
              pathOptions={{
                fillColor: isSelected ? '#ffffff' : hasPYQ ? '#f59e0b' : '#7c3aed',
                fillOpacity: 1,
                color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onSiteClick(site.name) }}
            >
              {!noLabels && (
                <Tooltip direction="top" offset={[0, -6]} className="mapping-tooltip">
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12 }}>
                    <strong>{langHi && site.name_hi ? site.name_hi : site.name}</strong>
                    <div style={{ color: '#aaa', fontSize: 11 }}>{langHi && site.location_hi ? site.location_hi : site.location}</div>
                    {hasPYQ && <div style={{ color: '#eab308', fontSize: 10, marginTop: 2 }}>PYQ: {site.pyqYears.join(', ')}</div>}
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
            </>
          );
        })}
      </MapContainer>
      <style>{`
        .mapping-tooltip { background: var(--bg3) !important; border: 1px solid var(--border2) !important; color: var(--text) !important; border-radius: 6px !important; padding: 6px 10px !important; }
        .mapping-tooltip::before { border-top-color: var(--border2) !important; }
        .leaflet-container { font-family: var(--font-ui) !important; }
      `}</style>
    </div>
  );
}
