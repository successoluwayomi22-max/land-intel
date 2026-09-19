export interface Point {
  lat: number;
  lng: number;
}

export interface PolygonAnalysisResult {
  coordinates: Point[];
  calculatedAreaSqm: number;
  calculatedAreaHectares: number;
  calculatedPerimeterM: number;
  isValidPolygon: boolean;
  hasSelfIntersection: boolean;
  hasDuplicatePoints: boolean;
  warnings: string[];
  centroid: Point;
}

/**
 * Calculates geodesic distance between two points in meters (Haversine formula)
 */
export function haversineDistance(p1: Point, p2: Point): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates geodesic area of a polygon in square meters using spherical approximation
 */
export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;

  const R = 6378137; // WGS84 semi-major axis in meters
  let total = 0;

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const lng1 = (p1.lng * Math.PI) / 180;
    const lng2 = (p2.lng * Math.PI) / 180;

    total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = Math.abs((total * R * R) / 2);
  return Math.round(area * 100) / 100;
}

/**
 * Checks if two line segments (p1-p2 and p3-p4) intersect
 */
function linesIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const ccw = (a: Point, b: Point, c: Point) =>
    (c.lat - a.lat) * (b.lng - a.lng) > (b.lat - a.lat) * (c.lng - a.lng);

  return (
    ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
    ccw(p1, p2, p3) !== ccw(p1, p2, p4)
  );
}

/**
 * Validates and analyzes a polygon constructed from boundary beacons/coordinates
 */
export function analyzeBoundaryPolygon(coordinates: Point[]): PolygonAnalysisResult {
  const warnings: string[] = [];

  if (!coordinates || coordinates.length < 3) {
    return {
      coordinates: coordinates || [],
      calculatedAreaSqm: 0,
      calculatedAreaHectares: 0,
      calculatedPerimeterM: 0,
      isValidPolygon: false,
      hasSelfIntersection: false,
      hasDuplicatePoints: false,
      warnings: ["At least 3 distinct boundary coordinate points are required to form a closed land parcel."],
      centroid: { lat: 0, lng: 0 },
    };
  }

  // 1. Check duplicate points
  let hasDuplicatePoints = false;
  for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
      if (
        Math.abs(coordinates[i].lat - coordinates[j].lat) < 0.000001 &&
        Math.abs(coordinates[i].lng - coordinates[j].lng) < 0.000001
      ) {
        hasDuplicatePoints = true;
        warnings.push(`Duplicate boundary beacon coordinates detected between point ${i + 1} and ${j + 1}.`);
      }
    }
  }

  // 2. Check self-intersections
  let hasSelfIntersection = false;
  const n = coordinates.length;
  for (let i = 0; i < n; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % n];

    for (let j = i + 2; j < n; j++) {
      if ((i === 0 && j === n - 1) || Math.abs(i - j) <= 1) continue;

      const p3 = coordinates[j];
      const p4 = coordinates[(j + 1) % n];

      if (linesIntersect(p1, p2, p3, p4)) {
        hasSelfIntersection = true;
        warnings.push(`Boundary self-intersection detected between edge ${i + 1}-${(i + 1) % n + 1} and ${j + 1}-${(j + 1) % n + 1}.`);
        break;
      }
    }
    if (hasSelfIntersection) break;
  }

  // 3. Calculate perimeter
  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    perimeter += haversineDistance(coordinates[i], coordinates[(i + 1) % n]);
  }

  // 4. Calculate Area
  const areaSqm = calculatePolygonArea(coordinates);
  const areaHectares = Math.round((areaSqm / 10000) * 1000) / 1000;

  // 5. Calculate Centroid
  let sumLat = 0;
  let sumLng = 0;
  for (const p of coordinates) {
    sumLat += p.lat;
    sumLng += p.lng;
  }
  const centroid = {
    lat: Math.round((sumLat / n) * 1000000) / 1000000,
    lng: Math.round((sumLng / n) * 1000000) / 1000000,
  };

  const isValidPolygon = !hasSelfIntersection && areaSqm > 0;

  return {
    coordinates,
    calculatedAreaSqm: areaSqm,
    calculatedAreaHectares: areaHectares,
    calculatedPerimeterM: Math.round(perimeter * 100) / 100,
    isValidPolygon,
    hasSelfIntersection,
    hasDuplicatePoints,
    warnings,
    centroid,
  };
}
