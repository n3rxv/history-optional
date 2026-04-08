'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { MapEntry } from '@/lib/mapData';
import 'leaflet/dist/leaflet.css';

// India bounds for fitBounds
const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 66.5],   // SW corner
  [35.5, 97.5],  // NE corner
];

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
  }, [map]);
  return null;
}

export default function LeafletMap({
  entries,
  selectedDot,
  onDotClick,
  answered,
  revealed,
}: {
  entries: MapEntry[];
  selectedDot: number | null;
  onDotClick: (num: number) => void;
  answered: Record<number, string>;
  revealed: Record<number, boolean>;
}) {
  return (
    <div style={{
      width: '100%',
      maxWidth: 500,
      height: 520,
      border: '1.5px solid #aaa',
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <MapContainer
        bounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        {/* Clean light tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <FitBounds />

        {entries.map(entry => {
          const isSelected = selectedDot === entry.number;
          const isRevealed = !!revealed[entry.number];
          const isAnswered = !!answered[entry.number];

          const color = isRevealed
            ? '#22a85a'
            : isAnswered
            ? '#b48c3c'
            : isSelected
            ? '#e05c2a'
            : '#1a1a2e';

          const radius = isSelected ? 14 : 10;

          return (
            <CircleMarker
              key={entry.number}
              center={[entry.lat, entry.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 1,
                color: isSelected ? '#fff' : 'rgba(255,255,255,0.8)',
                weight: 2,
              }}
              eventHandlers={{
                click: () => onDotClick(entry.number),
              }}
            >
              <Tooltip
                permanent
                direction="center"
                offset={[0, 0]}
                className="dot-label"
              >
                <span style={{
                  fontSize: isSelected ? 10 : 8,
                  fontWeight: 700,
                  color: '#fff',
                  userSelect: 'none',
                }}>
                  {entry.number}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <style>{`
        .dot-label {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .dot-label::before { display: none !important; }
      `}</style>
    </div>
  );
}
