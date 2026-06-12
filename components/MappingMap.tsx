'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { BookSite } from '@/lib/bookData';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 66.5],
  [38.5, 98.0],
];

function FitBounds({ sites, selectedSite }: { sites: BookSite[]; selectedSite: string | null }) {
  const map = useMap();

  useEffect(() => {
    const valid = sites.filter(s => s.lat != null && s.lng != null);
    if (selectedSite) {
      const target = valid.find(s => s.name === selectedSite);
      if (target) {
        map.flyTo([target.lat as number, target.lng as number], 5, { duration: 0.6 });
        return;
      }
    }
    if (valid.length === 0) {
      map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
      return;
    }
    if (valid.length === 1) {
      map.setView([valid[0].lat as number, valid[0].lng as number], 6);
      return;
    }
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...valid.map(s => s.lat as number)) - 1, Math.min(...valid.map(s => s.lng as number)) - 1],
      [Math.max(...valid.map(s => s.lat as number)) + 1, Math.max(...valid.map(s => s.lng as number)) + 1],
    ];
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [map, sites, selectedSite]);

  return null;
}

export default function MappingMap({
  sites,
  selectedSite,
  onSiteClick,
  noLabels = false,
}: {
  sites: BookSite[];
  selectedSite: string | null;
  onSiteClick: (name: string) => void;
  noLabels?: boolean;
}) {
  const validSites = sites.filter(s => s.lat != null && s.lng != null);
  const tileUrl = noLabels
    ? 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={{
      width: '100%',
      height: 420,
      border: '1.5px solid var(--border2)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <MapContainer
        bounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%', background: 'var(--bg2)' }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap &copy; CARTO" />
        <FitBounds sites={validSites} selectedSite={selectedSite} />

        {validSites.map((site) => {
          const isSelected = selectedSite === site.name;
          const hasPYQ = site.pyqYears && site.pyqYears.length > 0;
          const fillColor = isSelected ? '#ffffff' : hasPYQ ? '#eab308' : '#a78bfa';
          const radius = isSelected ? 11 : hasPYQ ? 8 : 6;

          return (
            <CircleMarker
              key={site.name}
              center={[site.lat as number, site.lng as number]}
              radius={radius}
              pathOptions={{
                fillColor,
                fillOpacity: 1,
                color: isSelected ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => onSiteClick(site.name) }}
            >
              {!noLabels && (
                <Tooltip direction="top" offset={[0, -6]} className="mapping-tooltip">
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12 }}>
                    <strong>{site.name}</strong>
                    <div style={{ color: '#aaa', fontSize: 11 }}>{site.location}</div>
                    {hasPYQ && (
                      <div style={{ color: '#eab308', fontSize: 10, marginTop: 2 }}>
                        PYQ: {site.pyqYears.join(', ')}
                      </div>
                    )}
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>

      <style>{`
        .mapping-tooltip {
          background: var(--bg3) !important;
          border: 1px solid var(--border2) !important;
          color: var(--text) !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
        }
        .mapping-tooltip::before { border-top-color: var(--border2) !important; }
        .leaflet-container { font-family: var(--font-ui) !important; }
      `}</style>
    </div>
  );
}
