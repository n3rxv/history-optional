'use client';
import { useEffect, useRef } from 'react';
import { BookSite } from '@/lib/bookData';
import { indiaGeoJSON } from '@/lib/indiaGeoJSON';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS: [[number, number], [number, number]] = [[6.5, 66.5], [38.5, 98.0]];

export default function QuizMap({ site }: { site: BookSite }) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const lMapRef   = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || lMapRef.current) return;
    import('leaflet').then(({ default: L }) => {
      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true, attributionControl: false });
      map.fitBounds(INDIA_BOUNDS as any, { padding: [10, 10] });
      lMapRef.current = map;
      L.geoJSON(indiaGeoJSON as any, {
        style: (feature: any) => {
          const isIndia = feature?.properties?.name === 'India';
          return {
            fillColor: isIndia ? '#e8e0d8' : '#d4cfc8',
            fillOpacity: 1,
            color: '#aaa',
            weight: isIndia ? 1.5 : 1,
          };
        },
      }).addTo(map);
      if (site.lat != null && site.lng != null) {
        markerRef.current = L.circleMarker([site.lat as number, site.lng as number], {
          radius: 13, fillColor: '#f59e0b', fillOpacity: 1, color: '#fff', weight: 3,
        }).addTo(map);
      }
    });
    return () => { if (lMapRef.current) { lMapRef.current.remove(); lMapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!lMapRef.current) return;
    import('leaflet').then(({ default: L }) => {
      if (markerRef.current) markerRef.current.remove();
      if (site.lat != null && site.lng != null) {
        markerRef.current = L.circleMarker([site.lat as number, site.lng as number], {
          radius: 13, fillColor: '#f59e0b', fillOpacity: 1, color: '#fff', weight: 3,
        }).addTo(lMapRef.current);
        lMapRef.current.fitBounds(INDIA_BOUNDS as any, { padding: [10, 10] });
      }
    });
  }, [site.name]);

  return (
    <div style={{ width: '100%', height: 440, border: '1.5px solid var(--border2)', borderRadius: 10, overflow: 'hidden', background: '#c8d8e8' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#c8d8e8' }} />
    </div>
  );
}
