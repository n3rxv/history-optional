'use client';
import { useEffect, useState } from 'react';
import { MapContainer, GeoJSON, CircleMarker, useMap } from 'react-leaflet';
import { BookSite } from '@/lib/bookData';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 66.5],
  [38.5, 98.0],
];

// Module-level cache — fetched once, reused across remounts
let geoCache: any = null;

function ResetView({ siteName }: { siteName: string }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
  }, [siteName]);
  return null;
}

export default function QuizMap({ site }: { site: BookSite }) {
  const [geoData, setGeoData] = useState<any>(geoCache);

  useEffect(() => {
    if (geoCache) { setGeoData(geoCache); return; }
    fetch('/india-outline.geojson')
      .then(r => r.json())
      .then(data => { geoCache = data; setGeoData(data); });
  }, []);

  return (
    <div style={{
      width: '100%', height: 440,
      border: '1.5px solid var(--border2)',
      borderRadius: 10, overflow: 'hidden',
      background: '#c8d8e8',
    }}>
      <MapContainer
        bounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%', background: '#c8d8e8' }}
        zoomControl={true}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <ResetView siteName={site.name} />
        {geoData && (
          <GeoJSON
            key="india-outline"
            data={geoData}
            style={{
              fillColor: '#e8e0d8',
              fillOpacity: 1,
              color: '#aaa',
              weight: 1.5,
            }}
          />
        )}
        {site.lat != null && site.lng != null && (
          <CircleMarker
            key={site.name}
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
