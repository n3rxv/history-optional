'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { BookSite } from '@/lib/bookData';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 66.5],
  [38.5, 98.0],
];

function FlyToSite({ site }: { site: BookSite }) {
  const map = useMap();
  useEffect(() => {
    if (site.lat != null && site.lng != null) {
      map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
    }
  }, [site.name]);
  return null;
}

export default function QuizMap({ site }: { site: BookSite }) {
  return (
    <div style={{
      width: '100%',
      height: 440,
      border: '1.5px solid var(--border2)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <MapContainer
        bounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
        key={site.name}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
        />
        <FlyToSite site={site} />
        {site.lat != null && site.lng != null && (
          <CircleMarker
            center={[site.lat, site.lng]}
            radius={13}
            pathOptions={{
              fillColor: '#f59e0b',
              fillOpacity: 1,
              color: '#fff',
              weight: 3,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
