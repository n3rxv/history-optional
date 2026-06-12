'use client';
import { useEffect, useRef, useState } from 'react';
import { BookSite } from '@/lib/bookData';
import 'leaflet/dist/leaflet.css';

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [6.5, 66.5],
  [38.5, 98.0],
];

let geoCache: any = null;

export default function QuizMap({ site }: { site: BookSite }) {
  const mapRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const geoLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (leafletMapRef.current) return;

    const L = require('leaflet');

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
    leafletMapRef.current = map;

    const loadGeo = (data: any) => {
      geoCache = data;
      if (geoLayerRef.current) geoLayerRef.current.remove();
      geoLayerRef.current = L.geoJSON(data, {
        style: {
          fillColor: '#e8e0d8',
          fillOpacity: 1,
          color: '#aaa',
          weight: 1.5,
        },
      }).addTo(map);
      setReady(true);
    };

    if (geoCache) {
      loadGeo(geoCache);
    } else {
      fetch('/india-outline.geojson')
        .then(r => r.json())
        .then(loadGeo);
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update marker when site changes
  useEffect(() => {
    if (!leafletMapRef.current || !ready) return;
    const L = require('leaflet');
    const map = leafletMapRef.current;

    if (markerRef.current) markerRef.current.remove();

    if (site.lat != null && site.lng != null) {
      markerRef.current = L.circleMarker([site.lat, site.lng], {
        radius: 13,
        fillColor: '#f59e0b',
        fillOpacity: 1,
        color: '#fff',
        weight: 3,
      }).addTo(map);

      map.fitBounds(INDIA_BOUNDS, { padding: [10, 10] });
    }
  }, [site.name, ready]);

  return (
    <div style={{
      width: '100%', height: 440,
      border: '1.5px solid var(--border2)',
      borderRadius: 10, overflow: 'hidden',
      background: '#c8d8e8',
    }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
