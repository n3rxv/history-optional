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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const INTERVAL = 4;
  const LAT_MIN = 8, LAT_MAX = 36, LNG_MIN = 60, LNG_MAX = 104;

  const redraw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const size = map.getSize();
    svg.setAttribute('width', String(size.x));
    svg.setAttribute('height', String(size.y));
    svg.setAttribute('viewBox', `0 0 ${size.x} ${size.y}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const ns = 'http://www.w3.org/2000/svg';

    const mkLine = (x1: number, y1: number, x2: number, y2: number, stroke: string) => {
      const el = document.createElementNS(ns, 'line');
      el.setAttribute('x1', String(x1)); el.setAttribute('y1', String(y1));
      el.setAttribute('x2', String(x2)); el.setAttribute('y2', String(y2));
      el.setAttribute('stroke', stroke); el.setAttribute('stroke-width', '0.9');
      el.setAttribute('stroke-dasharray', '5 3');
      svg.appendChild(el);
    };

    const mkText = (x: number, y: number, text: string, anchor: string, fill: string) => {
      const el = document.createElementNS(ns, 'text');
      el.setAttribute('x', String(x)); el.setAttribute('y', String(y));
      el.setAttribute('font-size', '9'); el.setAttribute('font-family', 'monospace');
      el.setAttribute('text-anchor', anchor); el.setAttribute('fill', fill);
      el.setAttribute('stroke', 'rgba(0,0,0,0.8)'); el.setAttribute('stroke-width', '2');
      el.setAttribute('paint-order', 'stroke');
      el.textContent = text;
      svg.appendChild(el);
    };

    for (let lat = LAT_MIN; lat <= LAT_MAX; lat += INTERVAL) {
      const p1 = map.latLngToContainerPoint([lat, LNG_MIN]);
      const p2 = map.latLngToContainerPoint([lat, LNG_MAX]);
      mkLine(p1.x, p1.y, p2.x, p2.y, 'rgba(120,180,255,0.75)');
      mkText(5, p1.y - 2, `${lat}\u00b0N`, 'start', 'rgba(180,220,255,0.95)');
      mkText(size.x - 5, p1.y - 2, `${lat}\u00b0N`, 'end', 'rgba(180,220,255,0.95)');
    }

    for (let lng = LNG_MIN; lng <= LNG_MAX; lng += INTERVAL) {
      const p1 = map.latLngToContainerPoint([LAT_MAX, lng]);
      const p2 = map.latLngToContainerPoint([LAT_MIN, lng]);
      mkLine(p1.x, p1.y, p2.x, p2.y, 'rgba(255,160,100,0.75)');
      mkText(p1.x, 11, `${lng}\u00b0E`, 'middle', 'rgba(255,210,170,0.95)');
      mkText(p2.x, size.y - 3, `${lng}\u00b0E`, 'middle', 'rgba(255,210,170,0.95)');
    }
  }, [map]);

  useEffect(() => {
    const pane = map.getPane('overlayPane');
    if (!pane) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as SVGSVGElement;
    svg.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:500;';
    pane.appendChild(svg);
    svgRef.current = svg;
    redraw();
    map.on('moveend zoomend resize move', redraw);
    return () => {
      map.off('moveend zoomend resize move', redraw);
      if (pane.contains(svg)) pane.removeChild(svg);
      svgRef.current = null;
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
