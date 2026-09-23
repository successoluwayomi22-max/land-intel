"use client";

import React, { useMemo } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { MapProvider } from "./MapProvider";
import { MapPin, AlertCircle, CheckCircle2, Building, Trees } from "lucide-react";

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
  locationFound?: boolean;
  address?: string;
  occupancyStatus?: "OCCUPIED" | "BARE" | "EMPTY" | "PENDING_VERIFICATION" | string;
}

/**
 * Interactive property cadastral map with boundary polygon overlay and ground reconnaissance status.
 * Renders beacon markers and boundary polygon when coordinates are provided.
 * Uses hybrid satellite mode with maxZoom protection to prevent tile dropouts ("No imagery here").
 */
export const PropertyMap: React.FC<PropertyMapProps> = ({
  center,
  coordinates = [],
  zoom = 15,
  height = "400px",
  showSatellite = true,
  className = "",
  locationFound,
  address,
  occupancyStatus = "BARE",
}) => {
  const isLocated = Boolean(center && (locationFound !== false));

  // Calculate center from coordinates if not explicitly provided
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (coordinates.length === 0) return { lat: 6.4541, lng: 3.4218 }; // Default: Lagos Cadastral Region

    const avgLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
    const avgLng = coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
    return { lat: avgLat, lng: avgLng };
  }, [center, coordinates]);

  return (
    <MapProvider>
      <div className={`relative rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
        {/* Status Overlay Header */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Location Verification Tag */}
          {isLocated ? (
            <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-md border border-slate-700/50 flex items-center gap-1.5 max-w-sm sm:max-w-md truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {center ? `📍 Coordinated (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})` : "Location Located"}
                {address ? ` • ${address}` : ""}
              </span>
            </div>
          ) : (
            <div className="pointer-events-auto bg-amber-950/90 backdrop-blur-md text-amber-200 text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-md border border-amber-800/60 flex items-center gap-1.5 max-w-md">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Location could not be geocoded from address. Displaying regional overview.</span>
            </div>
          )}

          {/* Ground Occupancy Status Badge */}
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md border border-slate-200/80 flex items-center gap-1.5 ml-auto">
            {occupancyStatus === "OCCUPIED" ? (
              <>
                <Building className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-900">Ground: Structure / Occupied</span>
              </>
            ) : occupancyStatus === "BARE" || occupancyStatus === "EMPTY" ? (
              <>
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-900">Ground: Bare / Undeveloped Land</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-900">Ground: Verification Pending</span>
              </>
            )}
          </div>
        </div>

        <Map
          defaultZoom={Math.min(zoom, 16)}
          maxZoom={18}
          minZoom={3}
          defaultCenter={mapCenter}
          mapTypeId={showSatellite ? "hybrid" : "roadmap"}
          mapTypeControl={true}
          streetViewControl={false}
          fullscreenControl={true}
          zoomControl={true}
          gestureHandling="cooperative"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Single property location marker when no specific polygon beacons are available */}
          {coordinates.length === 0 && center && isLocated && (
            <Marker
              position={center}
              title={address || "Identified Property Coordinates"}
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
          <MapController center={isLocated ? center : undefined} coordinates={coordinates} zoom={zoom} />
        </Map>
      </div>
    </MapProvider>
  );
};

/**
 * Keeps map centered on active bounds or center point dynamically.
 * Limits single-point zoom to max 16 to avoid "Sorry, we have no imagery here" tile dropouts.
 */
function MapController({
  center,
  coordinates,
  zoom = 15,
}: {
  center?: { lat: number; lng: number };
  coordinates: Coordinate[];
  zoom?: number;
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
      map.setZoom(Math.min(zoom, 16));
    }
  }, [map, center, coordinates, zoom]);

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
      fillOpacity: 0.14,
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
