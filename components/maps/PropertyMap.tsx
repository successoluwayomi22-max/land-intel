"use client";

import React, { useMemo } from "react";
import { Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { MapProvider } from "./MapProvider";
import { MapPin, AlertCircle, CheckCircle2, Building, Trees, Lock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

export interface PropertyMapProps {
  center?: { lat: number; lng: number };
  coordinates?: Coordinate[];
  zoom?: number;
  height?: string;
  showSatellite?: boolean;
  className?: string;
  locationFound?: boolean;
  address?: string;
  occupancyStatus?: "OCCUPIED" | "BARE" | "EMPTY" | "PENDING_VERIFICATION" | string;
  isLocked?: boolean;
  onUnlock?: () => void;
}

/**
 * Interactive property cadastral map with boundary polygon overlay and ground reconnaissance status.
 * Renders beacon markers and boundary polygon when coordinates are provided.
 * Provides paid-only locked barrier for free users and displays accurate "Location Not Found" when unverified.
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
  isLocked = false,
  onUnlock,
}) => {
  const isLocated = Boolean(center && locationFound !== false);

  // Calculate center from coordinates or default to Nigerian Cadastral Region overview
  const mapCenter = useMemo(() => {
    if (center && isLocated) return center;
    if (coordinates.length > 0) {
      const avgLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
      const avgLng = coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 6.5244, lng: 3.3792 }; // Regional anchor overview
  }, [center, isLocated, coordinates]);

  return (
    <MapProvider>
      <div
        className={`relative rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`}
        style={{ height }}
      >
        {/* Status Overlay Header (Visible only when unlocked) */}
        {!isLocked && (
          <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Location Verification Tag */}
            {isLocated ? (
              <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-md border border-slate-700/50 flex items-center gap-1.5 max-w-sm sm:max-w-md truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {center ? `📍 Coordinated (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})` : "Location Verified"}
                  {address ? ` • ${address}` : ""}
                </span>
              </div>
            ) : (
              <div className="pointer-events-auto bg-rose-950/90 backdrop-blur-md text-rose-200 text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-md border border-rose-800/60 flex items-center gap-1.5 max-w-md">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  Location Not Found • Coordinates Unverified ({address || "Address not found"})
                </span>
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
        )}

        {/* The Google Map Container */}
        <div className={`w-full h-full ${isLocked ? "filter blur-[2px] opacity-40 pointer-events-none select-none" : ""}`}>
          <Map
            defaultZoom={isLocated ? Math.min(zoom, 16) : 10}
            maxZoom={18}
            minZoom={3}
            defaultCenter={mapCenter}
            mapTypeId={showSatellite ? "hybrid" : "roadmap"}
            mapTypeControl={!isLocked}
            streetViewControl={false}
            fullscreenControl={!isLocked}
            zoomControl={!isLocked}
            gestureHandling={isLocked ? "none" : "cooperative"}
            style={{ width: "100%", height: "100%" }}
          >
            {/* Single property location marker: ONLY dropped if location is genuinely found and verified */}
            {!isLocked && coordinates.length === 0 && center && isLocated && (
              <Marker position={center} title={address || "Identified Property Coordinates"} />
            )}

            {/* Beacon markers */}
            {!isLocked &&
              coordinates.map((coord, i) => (
                <Marker
                  key={i}
                  position={{ lat: coord.lat, lng: coord.lng }}
                  title={coord.label || `Beacon ${i + 1}`}
                />
              ))}

            {/* Boundary polygon */}
            {!isLocked && coordinates.length >= 3 && <BoundaryPolygon coordinates={coordinates} />}

            {/* Dynamic map re-centering controller */}
            {!isLocked && (
              <MapController center={isLocated ? center : undefined} coordinates={coordinates} zoom={zoom} />
            )}
          </Map>
        </div>

        {/* ─── Paid-Only Locked Overlay Barrier ─── */}
        {isLocked && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center mb-3 shadow-lg shadow-amber-950/40">
              <Lock className="w-7 h-7 text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Paid Feature • Premium Cadastre Reconnaissance
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mb-2">
              Satellite Ground Reconnaissance & Cadastral Overlay Locked
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mb-6 leading-relaxed">
              Interactive high-resolution aerial satellite imagery, beacon boundary overlays, ground occupancy
              inspection, and encroachment detection are exclusively available on Paid Plans or Unlocked Audit Reports.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {onUnlock ? (
                <button
                  type="button"
                  onClick={onUnlock}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
                >
                  Unlock Single Case Audit ($50.00 / ₦72,500)
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href={`/properties`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
                >
                  Unlock Cadastral Audit Report
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
              >
                Upgrade to Professional ($150 / mo)
              </Link>
            </div>
          </div>
        )}
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
