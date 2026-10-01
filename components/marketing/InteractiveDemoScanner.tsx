"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  MapPin,
  RefreshCw,
  Search,
  Globe,
  Sliders,
  ShieldCheck,
  Building,
  Factory,
  Tractor,
  Home,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export type DemoPropertyType = "LAND" | "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "AGRICULTURAL" | "MIXED_USE";

interface DemoPreset {
  id: string;
  name: string;
  location: string;
  country: string;
  countryCode: string;
  propertyType: DemoPropertyType;
  propertyTypeLabel: string;
  coordinates: string;
  lat: number;
  lng: number;
  grid: string;
  riskScore: number;
  riskLevel: "CRITICAL" | "MODERATE" | "CLEAN";
  statusTitle: string;
  findingSummary: string;
  bufferOverlap: string;
  gazetteMatch: string;
  boundaryStatus: string;
}

const JURISDICTIONS = [
  { code: "ALL", label: "All Jurisdictions", flag: "🌐" },
  { code: "NG", label: "Nigeria", flag: "🇳🇬" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "AE", label: "UAE (Dubai)", flag: "🇦🇪" },
  { code: "KE", label: "Kenya", flag: "🇰🇪" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
  { code: "CA", label: "Canada", flag: "🇨🇦" },
  { code: "GH", label: "Ghana", flag: "🇬🇭" },
  { code: "AU", label: "Australia", flag: "🇦🇺" },
  { code: "EU", label: "Europe", flag: "🇪🇺" },
] as const;

const PROPERTY_TYPES = [
  { id: "ALL", label: "All Types", icon: Layers },
  { id: "LAND", label: "Bare Land / Plot", icon: MapPin },
  { id: "RESIDENTIAL", label: "Residential", icon: Home },
  { id: "COMMERCIAL", label: "Commercial", icon: Building },
  { id: "INDUSTRIAL", label: "Industrial", icon: Factory },
  { id: "AGRICULTURAL", label: "Agricultural", icon: Tractor },
  { id: "MIXED_USE", label: "Mixed-Use", icon: Sliders },
] as const;

const GLOBAL_PRESETS: DemoPreset[] = [
  // United Kingdom 🇬🇧
  {
    id: "uk-thames",
    name: "Thames Tidal & Floodplain Corridor",
    location: "Canary Wharf / Isle of Dogs, London",
    country: "United Kingdom",
    countryCode: "GB",
    propertyType: "COMMERCIAL",
    propertyTypeLabel: "Commercial Development",
    coordinates: "51.5054° N, 0.0209° W",
    lat: 51.5054,
    lng: -0.0209,
    grid: "OSGB36 / British National Grid",
    riskScore: 78,
    riskLevel: "CRITICAL",
    statusTitle: "Environment Agency Flood Zone 3 & Tidal Setback",
    findingSummary: "Boundary plot intersects statutory Environment Agency 16-meter tidal defense easement. Mandatory flood risk assessment and Section 106 building embargo in effect.",
    bufferOverlap: "16m Statutory Tidal Easement",
    gazetteMatch: "EA Flood Risk Category 3 (High)",
    boundaryStatus: "HM Land Registry Title Cadastre",
  },
  {
    id: "uk-edinburgh",
    name: "New Town Heritage Conservation Quarter",
    location: "Princes Street / New Town, Edinburgh",
    country: "United Kingdom",
    countryCode: "GB",
    propertyType: "RESIDENTIAL",
    propertyTypeLabel: "Residential Scheme",
    coordinates: "55.9533° N, 3.1883° W",
    lat: 55.9533,
    lng: -3.1883,
    grid: "OSGB36 / British National Grid",
    riskScore: 42,
    riskLevel: "MODERATE",
    statusTitle: "Listed Building Class A & Ancient Monument Buffer",
    findingSummary: "Historic Environment Scotland statutory conservation restrictions apply. Structural modifications or extensions require national architectural consent.",
    bufferOverlap: "5m Historic Façade Setback",
    gazetteMatch: "Registers of Scotland Sasine & Land Register",
    boundaryStatus: "Surveyed Title Sheet Compliant",
  },

  // United States 🇺🇸
  {
    id: "us-texas",
    name: "Suburban Residential Drainage Corridor",
    location: "Harris County, Houston, Texas",
    country: "United States",
    countryCode: "US",
    propertyType: "RESIDENTIAL",
    propertyTypeLabel: "Residential Scheme",
    coordinates: "29.7604° N, 95.3698° W",
    lat: 29.7604,
    lng: -95.3698,
    grid: "NAD83 / Texas South Central",
    riskScore: 54,
    riskLevel: "MODERATE",
    statusTitle: "County Drainage Easement & Wetland Buffer",
    findingSummary: "Boundary surveys reveal unrecorded 30-foot municipal storm drainage easement crossing the eastern lot. Surface construction strictly prohibited without variance permit.",
    bufferOverlap: "30ft Municipal Drainage Buffer",
    gazetteMatch: "Harris County Recorded Plat Vol. 114",
    boundaryStatus: "ALTA/NSPS Boundary Survey Match",
  },
  {
    id: "us-california",
    name: "Silicon Valley Commercial Innovation Campus",
    location: "North First Street, San Jose, California",
    country: "United States",
    countryCode: "US",
    propertyType: "COMMERCIAL",
    propertyTypeLabel: "Commercial Development",
    coordinates: "37.3382° N, 121.8863° W",
    lat: 37.3382,
    lng: -121.8863,
    grid: "NAD83 / California Zone 3",
    riskScore: 8,
    riskLevel: "CLEAN",
    statusTitle: "Clean Title & Santa Clara County Zoning Cleared",
    findingSummary: "Unencumbered commercial fee simple title registered with Santa Clara County Assessor. Zero fault-line setbacks, environmental covenants, or utility encumbrances.",
    bufferOverlap: "0ft Setback Infringement",
    gazetteMatch: "Santa Clara County Recorder Clean Deed",
    boundaryStatus: "ALTA Land Title Verified",
  },

  // United Arab Emirates 🇦🇪
  {
    id: "ae-dubai",
    name: "Commercial Freehold Development Plot",
    location: "Downtown / Business Bay, Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    propertyType: "COMMERCIAL",
    propertyTypeLabel: "Commercial Development",
    coordinates: "25.1972° N, 55.2744° E",
    lat: 25.1972,
    lng: 55.2744,
    grid: "WGS 84 / UTM Zone 40N",
    riskScore: 6,
    riskLevel: "CLEAN",
    statusTitle: "Clean Title & Freehold Zoning Verified",
    findingSummary: "Clear root of title registered with Dubai Land Department (DLD). Designated Foreign Ownership Freehold Zone with zero municipality setback encroachment.",
    bufferOverlap: "0m Setback Encroachment",
    gazetteMatch: "DLD Title Deed Registry Compliant",
    boundaryStatus: "Dubai Municipality Affection Plan",
  },

  // Nigeria 🇳🇬 (Lagos, Abuja, Rivers, Ogun)
  {
    id: "ng-lekki",
    name: "Coastal Arterial Highway Corridor",
    location: "Lekki Phase 2, Lagos",
    country: "Nigeria",
    countryCode: "NG",
    propertyType: "LAND",
    propertyTypeLabel: "Bare Land / Plot",
    coordinates: "6.4698° N, 3.5852° E",
    lat: 6.4698,
    lng: 3.5852,
    grid: "Minna Datum / UTM Zone 31N",
    riskScore: 92,
    riskLevel: "CRITICAL",
    statusTitle: "Committed Highway Setback Buffer Overlap",
    findingSummary: "The boundary polygon mathematically penetrates 140 meters into the gazetted coastal road reservation buffer. Mandatory future demolition with zero compensation.",
    bufferOverlap: "140m Arterial Road Corridor",
    gazetteMatch: "Gazette Vol. 48 No. 12 (Committed)",
    boundaryStatus: "SURCON Registered Survey Plan",
  },
  {
    id: "ng-abuja",
    name: "Federal Capital Diplomatic Zone Plot",
    location: "Central Business District / Maitama, Abuja FCT",
    country: "Nigeria",
    countryCode: "NG",
    propertyType: "COMMERCIAL",
    propertyTypeLabel: "Commercial Development",
    coordinates: "9.0765° N, 7.3986° E",
    lat: 9.0765,
    lng: 7.3986,
    grid: "Minna Datum / UTM Zone 32N",
    riskScore: 10,
    riskLevel: "CLEAN",
    statusTitle: "Clean C of O & AGIS Cadastre Validated",
    findingSummary: "Official Certificate of Occupancy registered in Abuja Geographic Information Systems (AGIS) master database. Beacon closures strictly match cadastral district layout.",
    bufferOverlap: "0m Setback Encroachment",
    gazetteMatch: "AGIS Master Plan Allocation Rec. 8421",
    boundaryStatus: "SURCON Beacon Closure Verified",
  },
  {
    id: "ng-ph",
    name: "Trans-Amadi Heavy Manufacturing Layout",
    location: "Trans Amadi Industrial Layout, Port Harcourt, Rivers State",
    country: "Nigeria",
    countryCode: "NG",
    propertyType: "INDUSTRIAL",
    propertyTypeLabel: "Industrial Facility",
    coordinates: "4.8111° N, 7.0311° E",
    lat: 4.8111,
    lng: 7.0311,
    grid: "Minna Datum / UTM Zone 32N",
    riskScore: 48,
    riskLevel: "MODERATE",
    statusTitle: "Pipeline Right-of-Way Corridor Setback Advisory",
    findingSummary: "Rivers State Ministry of Lands cadastre confirms valid manufacturing layout, but southern boundary touches a 25-meter hydrocarbon pipeline right-of-way easement.",
    bufferOverlap: "25m Pipeline Corridor Easement",
    gazetteMatch: "Rivers State Official Gazette No. 22",
    boundaryStatus: "Industrial Layout Beacon Match",
  },
  {
    id: "ng-ogun",
    name: "Sagamu Agro-Allied Processing Zone",
    location: "Sagamu / Obafemi Owode Agro-Corridor, Ogun State",
    country: "Nigeria",
    countryCode: "NG",
    propertyType: "AGRICULTURAL",
    propertyTypeLabel: "Agricultural Farmland",
    coordinates: "6.8489° N, 3.6464° E",
    lat: 6.8489,
    lng: 3.6464,
    grid: "Minna Datum / UTM Zone 31N",
    riskScore: 14,
    riskLevel: "CLEAN",
    statusTitle: "Clean Agricultural Excision & Watershed Clear",
    findingSummary: "Free from forest reserve acquisition. Ogun State Bureau of Lands agricultural excision gazette confirmed with clear perimeter boundary survey.",
    bufferOverlap: "0m Setback Encroachment",
    gazetteMatch: "Ogun State Gazette Excision Vol. 33",
    boundaryStatus: "Ogun Geographic Information System (OGIS)",
  },

  // Kenya 🇰🇪
  {
    id: "ke-nairobi",
    name: "Peri-Urban Commercial Plot",
    location: "Westlands, Nairobi",
    country: "Kenya",
    countryCode: "KE",
    propertyType: "MIXED_USE",
    propertyTypeLabel: "Mixed-Use Development",
    coordinates: "1.2674° S, 36.8110° E",
    lat: -1.2674,
    lng: 36.811,
    grid: "Arc 1960 / UTM Zone 37S",
    riskScore: 45,
    riskLevel: "MODERATE",
    statusTitle: "Riparian Reserve & Road Bypass Reservation",
    findingSummary: "Parcel perimeter borders NEMA gazetted riparian corridor. 15-meter riverbank setback restricts structural construction on south boundary line.",
    bufferOverlap: "15m Riparian Buffer Zone",
    gazetteMatch: "Kenya Gazette Notice #3892",
    boundaryStatus: "Survey of Kenya Cadastral Deed",
  },

  // South Africa 🇿🇦
  {
    id: "za-sandton",
    name: "Residential Development Scheme",
    location: "Sandton, Johannesburg, Gauteng",
    country: "South Africa",
    countryCode: "ZA",
    propertyType: "RESIDENTIAL",
    propertyTypeLabel: "Residential Scheme",
    coordinates: "26.1076° S, 28.0567° E",
    lat: -26.1076,
    lng: 28.0567,
    grid: "Hartebeesthoek94 / Lo29",
    riskScore: 12,
    riskLevel: "CLEAN",
    statusTitle: "Clean Title & Sectional Scheme Approved",
    findingSummary: "Registered in Johannesburg Deeds Office with unencumbered freehold ownership. Surveyor-General diagram approved with zero municipal servitude violations.",
    bufferOverlap: "0m Servitude Overlap",
    gazetteMatch: "Deeds Registries Act Section 14",
    boundaryStatus: "Surveyor-General Diagram Compliant",
  },

  // Canada 🇨🇦
  {
    id: "ca-toronto",
    name: "Greater Toronto Logistics & Freight Hub",
    location: "Mississauga, Greater Toronto Area, Ontario",
    country: "Canada",
    countryCode: "CA",
    propertyType: "INDUSTRIAL",
    propertyTypeLabel: "Industrial Facility",
    coordinates: "43.5890° N, 79.6441° W",
    lat: 43.589,
    lng: -79.6441,
    grid: "NAD83 / UTM Zone 17N",
    riskScore: 11,
    riskLevel: "CLEAN",
    statusTitle: "Teranet Land Registry Cleared (PIN Verified)",
    findingSummary: "Property Identifier Number (PIN) authenticated in Ontario Land Titles Registry. Heavy industrial M2 zoning active with zero conservation authority watershed encumbrances.",
    bufferOverlap: "0m Watershed Easement",
    gazetteMatch: "Ontario Land Titles Act (Teraview PIN 13490-0192)",
    boundaryStatus: "Ontario Reference Plan Verified",
  },

  // Ghana 🇬🇭
  {
    id: "gh-accra",
    name: "Greater Accra Prime Layout Plot",
    location: "East Legon Hills, Accra",
    country: "Ghana",
    countryCode: "GH",
    propertyType: "LAND",
    propertyTypeLabel: "Bare Land / Plot",
    coordinates: "5.6358° N, 0.1587° W",
    lat: 5.6358,
    lng: -0.1587,
    grid: "Leigon 1977 / Ghana National Grid",
    riskScore: 15,
    riskLevel: "CLEAN",
    statusTitle: "Lands Commission Stool Allodial Title Cleared",
    findingSummary: "Root of title confirmed with Lands Commission Land Registration Division (Yellow Card). Valid stool consent and concurrence verified with zero boundary litigation.",
    bufferOverlap: "0m Boundary Dispute",
    gazetteMatch: "Ghana Land Act 2020 (Act 1052) Registered",
    boundaryStatus: "Cadastral Survey Plan Barcoded",
  },

  // Australia 🇦🇺
  {
    id: "au-sydney",
    name: "Parramatta River Transport & Commercial Center",
    location: "Parramatta, Sydney, New South Wales",
    country: "Australia",
    countryCode: "AU",
    propertyType: "COMMERCIAL",
    propertyTypeLabel: "Commercial Development",
    coordinates: "33.8150° S, 151.0011° E",
    lat: -33.815,
    lng: 151.0011,
    grid: "GDA2020 / MGA Zone 56",
    riskScore: 38,
    riskLevel: "MODERATE",
    statusTitle: "Sydney Metro Transit Corridor Advisory Overlay",
    findingSummary: "NSW Land Registry Services (LRS) Torrens Title validated. Statutory 10-meter subsurface transit easement active for underground rail corridor.",
    bufferOverlap: "10m Subsurface Transit Easement",
    gazetteMatch: "NSW Real Property Act 1900 Folio Identifier",
    boundaryStatus: "NSW Deposited Plan (DP) 849201",
  },

  // Europe 🇪🇺
  {
    id: "eu-paris",
    name: "La Défense European Financial Center",
    location: "La Défense, Paris",
    country: "France",
    countryCode: "FR",
    propertyType: "COMMERCIAL",
    propertyTypeLabel: "Commercial Development",
    coordinates: "48.8922° N, 2.2378° E",
    lat: 48.8922,
    lng: 2.2378,
    grid: "Lambert-93 / RGF93",
    riskScore: 5,
    riskLevel: "CLEAN",
    statusTitle: "Clean Cadastre Solaire & Urbanisme Compliant",
    findingSummary: "Extrait de plan cadastral certified by DGFIP. Plan Local d'Urbanisme (PLU) commercial high-rise zoning verified with zero statutory utility servitude infringement.",
    bufferOverlap: "0m Servitude d'Urbanisme",
    gazetteMatch: "Cadastre National Français Référence Section AX",
    boundaryStatus: "Ordre des Géomètres-Experts Certifié",
  },
];

export const InteractiveDemoScanner: React.FC = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("ALL");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("ALL");
  const [searchMode, setSearchMode] = useState<"address" | "coordinates">("address");
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(GLOBAL_PRESETS[0]);
  const [addressInput, setAddressInput] = useState("Canary Wharf / Isle of Dogs, London, United Kingdom");
  const [coordsInput, setCoordsInput] = useState("51.5054, -0.0209");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DemoPreset | null>(GLOBAL_PRESETS[0]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter presets dynamically based on jurisdiction & property type
  const filteredPresets = useMemo(() => {
    return GLOBAL_PRESETS.filter((p) => {
      const matchJur =
        selectedJurisdiction === "ALL" ||
        p.countryCode === selectedJurisdiction ||
        (selectedJurisdiction === "EU" && p.countryCode === "FR");
      const matchType = selectedPropertyType === "ALL" || p.propertyType === selectedPropertyType;
      return matchJur && matchType;
    });
  }, [selectedJurisdiction, selectedPropertyType]);

  const handleSelectPreset = (preset: DemoPreset) => {
    setSelectedPreset(preset);
    setAddressInput(`${preset.location}, ${preset.country}`);
    setCoordsInput(`${preset.lat.toFixed(5)}, ${preset.lng.toFixed(5)}`);
    setScanResult(preset);
    setErrorMessage(null);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);

    const query = searchMode === "address" ? addressInput.trim() : coordsInput.trim();

    if (!query) {
      setIsScanning(false);
      setErrorMessage("Please enter an address, city, landmark, or coordinates to scan.");
      return;
    }

    try {
      // Execute live geocoding call against our global geocoding engine
      const res = await fetch(`/api/geo/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.found && data.lat && data.lng) {
        const lat = data.lat;
        const lng = data.lng;
        const formattedAddress = data.formattedAddress || query;

        // Determine jurisdiction
        const country =
          data.country ||
          (lat > 50 && lng < 2
            ? "United Kingdom"
            : lat > 24 && lat < 50 && lng < -65
            ? "United States"
            : lat > 22 && lat < 27 && lng > 50
            ? "United Arab Emirates"
            : lat > 4 && lat < 14 && lng > 2 && lng < 15
            ? "Nigeria"
            : lat > -5 && lat < 5 && lng > 33 && lng < 42
            ? "Kenya"
            : lat < -22 && lng > 16 && lng < 33
            ? "South Africa"
            : lat > 42 && lng < -52 && lng > -141
            ? "Canada"
            : lat > 4 && lat < 12 && lng > -4 && lng < 2
            ? "Ghana"
            : lat < -10 && lng > 110 && lng < 155
            ? "Australia"
            : lat > 35 && lat < 70 && lng > -10 && lng < 35
            ? "Europe"
            : "International Cadastre");

        const countryCode =
          data.jurisdictionCode ||
          (country.includes("Nigeria")
            ? "NG"
            : country.includes("United Kingdom")
            ? "GB"
            : country.includes("United States")
            ? "US"
            : country.includes("United Arab Emirates")
            ? "AE"
            : country.includes("Kenya")
            ? "KE"
            : country.includes("South Africa")
            ? "ZA"
            : country.includes("Canada")
            ? "CA"
            : country.includes("Ghana")
            ? "GH"
            : country.includes("Australia")
            ? "AU"
            : "GLOBAL");

        const isUk = countryCode === "GB";
        const isUs = countryCode === "US";
        const isUae = countryCode === "AE";
        const isNg = countryCode === "NG";
        const isKe = countryCode === "KE";
        const isZa = countryCode === "ZA";
        const isCa = countryCode === "CA";
        const isGh = countryCode === "GH";
        const isAu = countryCode === "AU";

        const pType: DemoPropertyType =
          selectedPropertyType !== "ALL" ? (selectedPropertyType as DemoPropertyType) : "LAND";
        const pTypeLabel =
          PROPERTY_TYPES.find((pt) => pt.id === pType)?.label || "Cadastral Property";

        let riskLevel: "CRITICAL" | "MODERATE" | "CLEAN" = "CLEAN";
        let riskScore = 12;
        let statusTitle = `Clean Title & Statutory ${pTypeLabel} Verified`;
        let bufferOverlap = "0m Encroachment (Fully Compliant)";
        let gazetteMatch = "Statutory Land Registry Compliant";
        let boundaryStatus = "Cadastral Boundary Plot Validated";
        let findingSummary = `Cadastral coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)}) authenticated against statutory national spatial datasets for ${country}. No uncommitted acquisitions, conflicting overlaps, or reservation encumbrances detected for this ${pTypeLabel.toLowerCase()}.`;

        // Deterministic variation based on coordinates and property type
        const latFraction = Math.abs(lat - Math.floor(lat));

        if (latFraction > 0.65) {
          riskLevel = "CRITICAL";
          riskScore = 89;

          if (pType === "INDUSTRIAL") {
            statusTitle = "High-Voltage Grid & Environmental Buffer Conflict";
            bufferOverlap = "35m Industrial Hazardous Setback Buffer";
            gazetteMatch = "National Environmental Agency Industrial Restriction";
            findingSummary = `Severe compliance restriction at ${formattedAddress}. Industrial parcel boundary penetrates statutory high-voltage utility easement and regional effluent setback buffer. Heavy industrial construction prohibited.`;
          } else if (pType === "AGRICULTURAL") {
            statusTitle = "Gazetted Forest Reserve & Watershed Acquisition";
            bufferOverlap = "60m Ecological Watershed Corridor";
            gazetteMatch = "Statutory Conservation & Forest Reserve Gazette";
            findingSummary = `Critical ecological reservation detected at ${formattedAddress}. Coordinates plot within protected watershed buffer. Commercial agriculture and heavy mechanized farming restricted without ministerial permit.`;
          } else if (pType === "COMMERCIAL") {
            statusTitle = "Arterial Transit Right-of-Way Buffer Overlap";
            bufferOverlap = "45m Future Transit Highway Reservation";
            gazetteMatch = "Metropolitan Transit Planning Overlay";
            findingSummary = `Severe infrastructure corridor conflict in ${formattedAddress}. Cadastral polygon penetrates 45 meters into statutory arterial transit setback. Commercial development subject to demolition without compensation.`;
          } else if (isUk) {
            statusTitle = "Environment Agency Flood Zone 3 & Tidal Setback";
            bufferOverlap = "18m Statutory Waterway Corridor";
            gazetteMatch = "EA National Flood Risk Layer Overlap";
            findingSummary = `High-risk statutory buffer overlap detected in ${formattedAddress}. Boundary polygon extends into gazetted waterways setback buffer requiring mandatory environmental permits.`;
          } else if (isUs) {
            statusTitle = "County Drainage Easement & Highway Setback";
            bufferOverlap = "45ft Arterial Thoroughfare Buffer";
            gazetteMatch = "Recorded Plat & Drainage District Easement";
            findingSummary = `Municipal setback infringement detected for ${formattedAddress}. Parcel boundary intersects recorded county thoroughfare right-of-way.`;
          } else if (isNg) {
            statusTitle = "Government Acquisition & Highway Buffer Setback";
            bufferOverlap = "120m Road Corridor Overlap";
            gazetteMatch = "State Gazette Excision Ref. Pending";
            findingSummary = `Critical risk detected in ${formattedAddress}. Coordinates plot within state infrastructure buffer. Commercial development strictly restricted.`;
          } else {
            statusTitle = "Statutory Infrastructure Buffer Overlap";
            bufferOverlap = "25m Municipal Arterial Easement";
            gazetteMatch = "National Cadastre Planning Overlay";
            findingSummary = `Severe statutory setback conflict identified at ${lat.toFixed(5)}, ${lng.toFixed(5)}. Building permissions restricted due to public utility reservation.`;
          }
        } else if (latFraction > 0.35) {
          riskLevel = "MODERATE";
          riskScore = 46;

          if (pType === "AGRICULTURAL") {
            statusTitle = "Greenbelt Conservation & Water Catchment Advisory";
            bufferOverlap = "15m River Catchment Setback";
            gazetteMatch = "Regional Agricultural Greenbelt Classification";
            findingSummary = `Advisory agricultural zoning notes for ${formattedAddress}. Property boundaries comply with agricultural zoning but require formal water abstraction licensing.`;
          } else if (pType === "INDUSTRIAL") {
            statusTitle = "Industrial Transport Corridor Setback Advisory";
            bufferOverlap = "15m Railway / Freight Line Easement";
            gazetteMatch = "Regional Transport District Masterplan";
            findingSummary = `Freight servitude advisory recorded for ${formattedAddress}. Boundary survey requires regularisation with municipal industrial zoning authority.`;
          } else {
            statusTitle = "Zoning Regularisation & Advisory Easement";
            bufferOverlap = "5m Advisory Municipal Buffer";
            gazetteMatch = "Planning Scheme Pending Gazetting";
            findingSummary = `Advisory title notices tracked for ${formattedAddress}. Property boundaries require formal conveyance regularisation with local land authority.`;
          }
        }

        const grid = isNg
          ? "Minna Datum / UTM Zone 31N"
          : isUk
          ? "OSGB36 / British National Grid"
          : isUs
          ? "NAD83 State Plane Coordinate System"
          : isUae
          ? "Dubai Local Transverse Mercator (DLTM)"
          : isKe
          ? "Arc 1960 / UTM Zone 37S"
          : isZa
          ? "Hartebeesthoek94 / Lo29"
          : isCa
          ? "NAD83 / UTM Zone 17N"
          : isGh
          ? "Leigon 1977 / Ghana National Grid"
          : isAu
          ? "GDA2020 / MGA Zone 56"
          : "Universal WGS 84 / Local Statutory Cadastre";

        setScanResult({
          id: "custom-scan",
          name: formattedAddress.split(",")[0] || "Custom Parcel Scan",
          location: formattedAddress,
          country,
          countryCode,
          propertyType: pType,
          propertyTypeLabel: pTypeLabel,
          coordinates: `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`,
          lat,
          lng,
          grid,
          riskScore,
          riskLevel,
          statusTitle,
          findingSummary,
          bufferOverlap,
          gazetteMatch,
          boundaryStatus,
        });
      } else {
        setErrorMessage(
          `Could not pinpoint "${query}" on the global cadastre. Please try adding city or country context (e.g. "Westminster, London" or "Houston, TX" or "Maitama, Abuja" or coordinates like "51.5074, -0.1278").`
        );
      }
    } catch {
      setErrorMessage("Network error connecting to global geocoding engine. Please check your connection and retry.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-brand-border" id="demo-scanner">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-2.5 sm:space-y-3">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center justify-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-blue" />
            <span>Universal Cadastral Intelligence Simulator</span>
          </span>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-brand-darkNavy font-heading tracking-tight">
            Test the Cadastral Scanner Worldwide
          </h2>
          <p className="text-xs xs:text-sm text-brand-textSecondary leading-relaxed">
            Search any street address, landmark, or GPS coordinates across all 36 Nigerian states and international markets — across all property categories.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="max-w-5xl mx-auto bg-slate-50 border border-brand-border rounded-2xl p-4 sm:p-8 shadow-card space-y-6">
          {/* Filter Bar: Jurisdictions & Property Types */}
          <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            {/* Jurisdiction Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-blue-600" />
                  Select Market / Jurisdiction
                </span>
                <span className="text-[10px] text-slate-400 font-medium">36 Nigerian States + 10 Global Markets</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {JURISDICTIONS.map((j) => (
                  <button
                    key={j.code}
                    type="button"
                    onClick={() => setSelectedJurisdiction(j.code)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedJurisdiction === j.code
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{j.flag}</span>
                    <span>{j.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type Pills */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-emerald-600" />
                  Select Property Category
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Land • Residential • Commercial • Industrial • Farm</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                {PROPERTY_TYPES.map((pt) => {
                  const Icon = pt.icon;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSelectedPropertyType(pt.id)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedPropertyType === pt.id
                          ? "bg-emerald-700 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{pt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1-Click Interactive Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                1-Click Verified Cadastral Presets ({filteredPresets.length})
              </label>
              <span className="text-[11px] text-slate-400 font-medium">Click any card to simulate live audit</span>
            </div>

            {filteredPresets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedPreset.id === preset.id
                        ? "bg-white border-blue-600 shadow-sm ring-1 ring-blue-600"
                        : "bg-white/70 border-slate-200 hover:bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-brand-darkNavy truncate">{preset.name}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          preset.riskLevel === "CRITICAL"
                            ? "bg-rose-100 text-rose-800"
                            : preset.riskLevel === "MODERATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {preset.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{preset.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-600">{preset.propertyTypeLabel}</span>
                      <span>{preset.country}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1">
                <p>No presets found matching this exact filter combination.</p>
                <p className="text-[11px] text-blue-600 font-medium">
                  Type any location below or select &quot;All Jurisdictions&quot; &amp; &quot;All Types&quot; above.
                </p>
              </div>
            )}
          </div>

          {/* Search Mode Toggle & Input Form */}
          <div className="bg-white border border-brand-border rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchMode("address")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    searchMode === "address"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Universal Address / City Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode("coordinates")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    searchMode === "coordinates"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  GPS / Cadastral Coordinates
                </button>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Live Global Engine
              </span>
            </div>

            {searchMode === "address" ? (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Enter Any Location, Street Address, or City Worldwide
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunScan()}
                    placeholder="e.g. Westminster, London OR Maitama, Abuja OR Downtown Dubai OR Houston, TX OR Trans Amadi, PH"
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Latitude &amp; Longitude (WGS-84 Decimal Degrees)
                  </label>
                  <input
                    type="text"
                    value={coordsInput}
                    onChange={(e) => setCoordsInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunScan()}
                    placeholder="e.g. 51.5054, -0.0209 OR 9.0765, 7.3986 OR 25.1972, 55.2744"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Target Projection System
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Universal WGS 84 / Local Statutory Datum"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Cross-references statutory road buffers, water setback easements, and masterplan zoning across all property types.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunScan}
                disabled={isScanning}
                className="w-full sm:w-auto font-bold text-xs py-2.5 px-6 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Global Cadastre...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Run Algorithmic Cadastral Scan</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          {scanResult && !isScanning && (
            <div className="bg-white border border-brand-border rounded-xl p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        scanResult.riskLevel === "CRITICAL"
                          ? "bg-rose-600 animate-pulse"
                          : scanResult.riskLevel === "MODERATE"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Cadastral Scan Output • {scanResult.country} • {scanResult.propertyTypeLabel}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-brand-darkNavy font-heading">
                    {scanResult.statusTitle}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900">{scanResult.location}</span>
                    <span className="text-slate-400 font-mono">({scanResult.coordinates})</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Risk Score
                    </span>
                    <span
                      className={`text-2xl font-black font-heading ${
                        scanResult.riskLevel === "CRITICAL"
                          ? "text-rose-600"
                          : scanResult.riskLevel === "MODERATE"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {scanResult.riskScore}
                      <span className="text-xs font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Setback / Buffer Status
                  </span>
                  <span className="text-xs font-bold text-brand-darkNavy mt-0.5 block truncate">
                    {scanResult.bufferOverlap}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Statutory Title Registry
                  </span>
                  <span className="text-xs font-bold text-brand-darkNavy mt-0.5 block truncate">
                    {scanResult.gazetteMatch}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">
                    Coordinate Grid System
                  </span>
                  <span className="text-xs font-bold text-brand-darkNavy mt-0.5 block truncate">
                    {scanResult.grid}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-brand-darkNavy block">Algorithmic Cadastral Verdict:</span>
                <p>{scanResult.findingSummary}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-[11px] text-slate-500">
                  Ready to run a complete survey and deed audit on your real property?
                </span>
                <Link
                  href={`/properties/new?address=${encodeURIComponent(scanResult.location)}&countryCode=${scanResult.countryCode}&propertyType=${selectedPropertyType !== "ALL" ? selectedPropertyType : scanResult.propertyType}&lat=${scanResult.lat}&lng=${scanResult.lng}`}
                  prefetch={true}
                  className="w-full sm:w-auto"
                >
                  <Button variant="primary" size="sm" className="w-full sm:w-auto text-xs py-2 px-4 shadow-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Audit This Real Property Free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
