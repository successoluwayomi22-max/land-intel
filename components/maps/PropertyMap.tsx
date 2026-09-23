"use client";

import React, { useMemo } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { MapProvider } from "./MapProvider";

interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

interface PropertyMapProps {
  center?: { lat: number; lng: number };
  coordinates?: Coordinate[];
  zoom?: number;
  height?: string;
  showSatellite?: boolean;
  className?: string;
}

/**
 * Interactive property map with optional boundary polygon overlay.
 * Renders beacon markers and a boundary polygon when coordinates are provided.
 */
export const PropertyMap: React.FC<PropertyMapProps> = ({
  center,
  coordinates = [],
  zoom = 16,
  height = "400px",
  showSatellite = true,
  className = "",
}) => {
  // Calculate center from coordinates if not explicitly provided
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (coordinates.length === 0) return { lat: 6.4541, lng: 3.4218 }; // Default: Lagos

    const avgLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
    return { lat: avgLat, lng: avgLng };
  }, [center, coordinates]);

  return (
    <MapProvider>
      <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
        <Map
          defaultZoom={zoom}
          defaultCenter={mapCenter}
          mapTypeId={showSatellite ? "satellite" : "roadmap"}
          mapTypeControl={true}
          streetViewControl={false}
          fullscreenControl={true}
          zoomControl={true}
          gestureHandling="cooperative"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Single property location marker when no specific polygon beacons are available */}
          {coordinates.length === 0 && center && (
            <Marker
              position={center}
              title="Identified Property Coordinates"
            />
          )}

          {/* Beacon markers */}
          {coordinates.map((coord, i) => (
            <Marker
              key={i}
              position={{ lat: coord.lat, lng: coord.lng }}
              title={coord.label || `Beacon ${i + 1}`}
            />
          ))}

          {/* Boundary polygon */}
          {coordinates.length >= 3 && (
            <BoundaryPolygon coordinates={coordinates} />
          )}

          {/* Dynamic map re-centering controller */}
          <MapController center={center} coordinates={coordinates} />
        </Map>
      </div>
    </MapProvider>
  );
};

/**
 * Keeps map centered on active bounds or center point dynamically.
 */
function MapController({
  center,
  coordinates,
}: {
  center?: { lat: number; lng: number };
  coordinates: Coordinate[];
}) {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;
    if (coordinates.length >= 3) {
      const bounds = new google.maps.LatLngBounds();
      coordinates.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
      map.fitBounds(bounds, 60);
    } else if (center) {
      map.panTo(center);
      map.setZoom(17);
    }
  }, [map, center, coordinates]);

  return null;
}

/**
 * Renders a polygon boundary overlay on the map.
 */
function BoundaryPolygon({ coordinates }: { coordinates: Coordinate[] }) {
  const map = useMap();

  React.useEffect(() => {
    if (!map || coordinates.length < 3) return;

    const polygon = new google.maps.Polygon({
      paths: coordinates.map((c) => ({ lat: c.lat, lng: c.lng })),
      strokeColor: "#2563eb",
      strokeOpacity: 0.9,
      strokeWeight: 2.5,
      fillColor: "#2563eb",
      fillOpacity: 0.12,
    });

    polygon.setMap(map);

    // Fit bounds to polygon
    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
    map.fitBounds(bounds, 60); // 60px padding

    return () => {
      polygon.setMap(null);
    };
  }, [map, coordinates]);

  return null;
}
