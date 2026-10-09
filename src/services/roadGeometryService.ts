// Service to fetch real road-following coordinates from Google Routes API & OSRM
const roadCache = new Map<string, Array<{ lat: number; lng: number }>>();

export async function fetchRoadCoordinates(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'DRIVE' | 'WALK' | 'TRANSIT' = 'DRIVE'
): Promise<Array<{ lat: number; lng: number }>> {
  const cacheKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}_${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}_${travelMode}`;
  if (roadCache.has(cacheKey)) {
    return roadCache.get(cacheKey)!;
  }

  // 1. Try backend proxy (which invokes Google Routes API with API Key)
  try {
    const res = await fetch('/api/routes/geometry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, travelMode }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.coordinates) && data.coordinates.length > 0) {
        roadCache.set(cacheKey, data.coordinates);
        return data.coordinates;
      }
    }
  } catch (err) {
    console.warn('[Backend road geometry proxy unreachable, trying OSRM client]:', err);
  }

  // 2. Client-side OSRM fallback
  try {
    const osrmMode = travelMode === 'WALK' ? 'foot' : 'driving';
    const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmMode}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    if (res.ok) {
      const osrmData = await res.json();
      if (osrmData.routes && osrmData.routes[0]?.geometry?.coordinates) {
        const coords = osrmData.routes[0].geometry.coordinates.map((pt: [number, number]) => ({
          lat: pt[1],
          lng: pt[0],
        }));
        roadCache.set(cacheKey, coords);
        return coords;
      }
    }
  } catch (err) {
    console.warn('[Client OSRM fallback failed]:', err);
  }

  // 3. Fallback road curvature
  const steps = 24;
  const coords: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * 0.007;
    coords.push({
      lat: origin.lat + (destination.lat - origin.lat) * t + curve,
      lng: origin.lng + (destination.lng - origin.lng) * t + (curve * 0.6),
    });
  }

  roadCache.set(cacheKey, coords);
  return coords;
}
