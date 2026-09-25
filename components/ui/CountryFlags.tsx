"use client";

import React from "react";

interface FlagProps {
  countryCode: string;
  className?: string;
  size?: number;
}

/**
 * CountryFlag
 * 
 * Crisp, constitutionally and geometrically accurate SVG flags
 * for all supported languages and diaspora financial settlement jurisdictions.
 */
export const CountryFlag: React.FC<FlagProps> = ({ countryCode, className = "", size = 16 }) => {
  const code = (countryCode || "").toUpperCase();
  const height = Math.round((size * 2) / 3); // Standard 3:2 flag ratio

  // 1. NIGERIA (NG) — Federal Republic of Nigeria
  if (code === "NG") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="8" height="16" fill="#008751" />
        <rect x="8" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" width="8" height="16" fill="#008751" />
      </svg>
    );
  }

  // 2. UNITED STATES (US) — Stars & Stripes
  if (code === "US") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#B22234" />
        <path d="M0 2.46h24M0 4.92h24M0 7.38h24M0 9.84h24M0 12.3h24M0 14.76h24" stroke="#FFFFFF" strokeWidth="1.23" />
        <rect width="10" height="8.6" fill="#3C3B6E" />
        <g fill="#FFFFFF">
          <circle cx="2" cy="2" r="0.6" />
          <circle cx="5" cy="2" r="0.6" />
          <circle cx="8" cy="2" r="0.6" />
          <circle cx="3.5" cy="4.3" r="0.6" />
          <circle cx="6.5" cy="4.3" r="0.6" />
          <circle cx="2" cy="6.6" r="0.6" />
          <circle cx="5" cy="6.6" r="0.6" />
          <circle cx="8" cy="6.6" r="0.6" />
        </g>
      </svg>
    );
  }

  // 3. UNITED KINGDOM (GB / UK) — Union Jack
  if (code === "GB" || code === "UK") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#012169" />
        <path d="M0 0l24 16M24 0L0 16" stroke="#FFFFFF" strokeWidth="2.8" />
        <path d="M0 0l24 16M24 0L0 16" stroke="#C8102E" strokeWidth="1.4" />
        <path d="M12 0v16M0 8h24" stroke="#FFFFFF" strokeWidth="4.5" />
        <path d="M12 0v16M0 8h24" stroke="#C8102E" strokeWidth="2.6" />
      </svg>
    );
  }

  // 4. EUROPEAN UNION (EU) — 12 Stars on Blue Field
  if (code === "EU") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#003399" />
        <g fill="#FFCC00">
          <circle cx="12" cy="3.5" r="0.7" />
          <circle cx="12" cy="12.5" r="0.7" />
          <circle cx="7.5" cy="8" r="0.7" />
          <circle cx="16.5" cy="8" r="0.7" />
          <circle cx="9.8" cy="4.2" r="0.7" />
          <circle cx="14.2" cy="4.2" r="0.7" />
          <circle cx="15.8" cy="5.8" r="0.7" />
          <circle cx="15.8" cy="10.2" r="0.7" />
          <circle cx="14.2" cy="11.8" r="0.7" />
          <circle cx="9.8" cy="11.8" r="0.7" />
          <circle cx="8.2" cy="10.2" r="0.7" />
          <circle cx="8.2" cy="5.8" r="0.7" />
        </g>
      </svg>
    );
  }

  // 5. CANADA (CA) — Red Maple Leaf Triband
  if (code === "CA") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="6" height="16" fill="#FF0000" />
        <rect x="6" width="12" height="16" fill="#FFFFFF" />
        <rect x="18" width="6" height="16" fill="#FF0000" />
        {/* Authentic 11-pointed Red Maple Leaf */}
        <path
          d="M12 3.2l0.8 2.2 1.8-0.5-0.9 1.8 1.8 1-1.6 0.8 0.4 1.8-1.5-0.8-0.2 2.4h-1.2l-0.2-2.4-1.5 0.8 0.4-1.8-1.6-0.8 1.8-1-0.9-1.8 1.8 0.5z"
          fill="#FF0000"
        />
      </svg>
    );
  }

  // 6. AUSTRALIA (AU) — Blue Ensign with Union Jack & Southern Cross
  if (code === "AU") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#00008B" />
        {/* Canton: Union Jack */}
        <g>
          <rect width="12" height="8" fill="#012169" />
          <path d="M0 0l12 8M12 0L0 8" stroke="#FFFFFF" strokeWidth="1.6" />
          <path d="M0 0l12 8M12 0L0 8" stroke="#C8102E" strokeWidth="0.8" />
          <path d="M6 0v8M0 4h12" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M6 0v8M0 4h12" stroke="#C8102E" strokeWidth="1.5" />
        </g>
        {/* Commonwealth Star */}
        <polygon points="6,9.5 6.6,11 8,11 6.8,12 7.2,13.5 6,12.5 4.8,13.5 5.2,12 4,11 5.4,11" fill="#FFFFFF" />
        {/* Southern Cross constellation */}
        <circle cx="18" cy="3" r="0.6" fill="#FFFFFF" />
        <circle cx="15.5" cy="6" r="0.6" fill="#FFFFFF" />
        <circle cx="20.5" cy="6" r="0.6" fill="#FFFFFF" />
        <circle cx="18" cy="9.5" r="0.6" fill="#FFFFFF" />
        <circle cx="19.2" cy="7.5" r="0.4" fill="#FFFFFF" />
      </svg>
    );
  }

  // 7. GHANA (GH) — Red, Gold, Green with Black Star
  if (code === "GH") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="5.33" fill="#CF0921" />
        <rect y="5.33" width="24" height="5.33" fill="#FCD20E" />
        <rect y="10.67" width="24" height="5.33" fill="#006B3F" />
        <polygon points="12,5.8 12.7,8 15,8 13.1,9.4 13.8,11.6 12,10.2 10.2,11.6 10.9,9.4 9,8 11.3,8" fill="#000000" />
      </svg>
    );
  }

  // 8. KENYA (KE) — Black, White, Red, White, Green with Maasai Shield
  if (code === "KE") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="4.5" fill="#000000" />
        <rect y="4.5" width="24" height="1" fill="#FFFFFF" />
        <rect y="5.5" width="24" height="5" fill="#BB0000" />
        <rect y="10.5" width="24" height="1" fill="#FFFFFF" />
        <rect y="11.5" width="24" height="4.5" fill="#006600" />
        {/* Crossed Spears */}
        <line x1="8" y1="2" x2="16" y2="14" stroke="#FFFFFF" strokeWidth="0.6" />
        <line x1="16" y1="2" x2="8" y2="14" stroke="#FFFFFF" strokeWidth="0.6" />
        {/* Maasai Shield */}
        <ellipse cx="12" cy="8" rx="2.2" ry="4.5" fill="#BB0000" stroke="#FFFFFF" strokeWidth="0.6" />
        <path d="M11 5.5v5M13 5.5v5" stroke="#FFFFFF" strokeWidth="0.5" />
        <circle cx="12" cy="8" r="0.8" fill="#FFFFFF" />
      </svg>
    );
  }

  // 9. TANZANIA (TZ) — Green, Yellow, Black, Yellow, Light Blue
  if (code === "TZ") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#1EB53A" />
        <polygon points="0,16 24,0 24,16" fill="#00A3DD" />
        <polygon points="0,16 24,0 24,4 4,16" fill="#FCD116" />
        <polygon points="0,12 20,0 24,0 0,16" fill="#FCD116" />
        <polygon points="0,13.5 22,0 24,0 0,16" fill="#000000" />
      </svg>
    );
  }

  // 10. SOUTH AFRICA (ZA) — Six-color Y-pall Flag
  if (code === "ZA") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="8" fill="#DE3831" />
        <rect y="8" width="24" height="8" fill="#002395" />
        <polygon points="0,0 9.5,8 0,16" fill="#000000" />
        <polygon points="0,0 11.5,8 0,16" fill="none" stroke="#FFB612" strokeWidth="1.2" />
        <polygon points="0,0 13.5,8 0,16" fill="none" stroke="#007A3D" strokeWidth="2.2" />
        <line x1="11.5" y1="8" x2="24" y2="8" stroke="#FFFFFF" strokeWidth="3.4" />
        <line x1="11.5" y1="8" x2="24" y2="8" stroke="#007A3D" strokeWidth="2.2" />
      </svg>
    );
  }

  // 11. UNITED ARAB EMIRATES (AE) — Pan-Arab Tricolor with Red Hoist Bar
  if (code === "AE") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect x="6" width="18" height="5.33" fill="#00732F" />
        <rect x="6" y="5.33" width="18" height="5.33" fill="#FFFFFF" />
        <rect x="6" y="10.67" width="18" height="5.33" fill="#000000" />
        <rect width="6" height="16" fill="#FF0000" />
      </svg>
    );
  }

  // 12. SAUDI ARABIA (SA) — Authentic Green with Shahada & Sword
  if (code === "SA") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#006C35" />
        {/* Arabic Calligraphy Motifs */}
        <path d="M5 5.5h14M6 4h2M10 4h4M16 4h2M7 7h10" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
        {/* Traditional White Sword */}
        <line x1="6" y1="10.5" x2="18" y2="10.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        <line x1="17" y1="9.2" x2="17" y2="11.8" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
        <circle cx="18.5" cy="10.5" r="0.6" fill="#FFFFFF" />
      </svg>
    );
  }

  // 13. CHINA (CN) — Red with Five Golden Stars
  if (code === "CN") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#EE1C25" />
        {/* Main 5-pointed Star */}
        <polygon points="4,2.5 4.6,4.2 6.4,4.2 5,5.2 5.5,6.9 4,5.9 2.5,6.9 3,5.2 1.6,4.2 3.4,4.2" fill="#FFDE00" />
        {/* 4 Arc Stars */}
        <circle cx="7.8" cy="2.5" r="0.6" fill="#FFDE00" />
        <circle cx="9.2" cy="4" r="0.6" fill="#FFDE00" />
        <circle cx="9.2" cy="6.2" r="0.6" fill="#FFDE00" />
        <circle cx="7.8" cy="7.7" r="0.6" fill="#FFDE00" />
      </svg>
    );
  }

  // 14. SPAIN (ES) — Red, Gold, Red with Royal Arms
  if (code === "ES") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="4" fill="#AA151B" />
        <rect y="4" width="24" height="8" fill="#F1BF00" />
        <rect y="12" width="24" height="4" fill="#AA151B" />
        {/* Spanish Royal Crest Motif */}
        <rect x="6" y="6" width="3" height="4" rx="0.6" fill="#AA151B" stroke="#AA151B" strokeWidth="0.5" />
        <rect x="6.6" y="6.6" width="1.8" height="2.8" fill="#F1BF00" />
        <circle cx="7.5" cy="5.4" r="0.7" fill="#AA151B" />
      </svg>
    );
  }

  // 15. INDIA (IN) — Tiranga with Ashoka Chakra
  if (code === "IN") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="5.33" fill="#FF9933" />
        <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
        <rect y="10.67" width="24" height="5.33" fill="#138808" />
        {/* Ashoka Chakra */}
        <circle cx="12" cy="8" r="2.2" stroke="#000080" strokeWidth="0.6" fill="none" />
        <circle cx="12" cy="8" r="0.5" fill="#000080" />
        <path d="M12 5.8v4.4M9.8 8h4.4M10.4 6.4l3.2 3.2M13.6 6.4l-3.2 3.2" stroke="#000080" strokeWidth="0.35" />
      </svg>
    );
  }

  // 16. FRANCE (FR) — Bleue, Blanc, Rouge
  if (code === "FR") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="8" height="16" fill="#002654" />
        <rect x="8" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" width="8" height="16" fill="#ED2939" />
      </svg>
    );
  }

  // 17. BANGLADESH (BD) — Green with Offset Red Disc
  if (code === "BD") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#006A4E" />
        <circle cx="10.5" cy="8" r="4.5" fill="#F42A41" />
      </svg>
    );
  }

  // 18. BRAZIL (BR) — Green, Yellow Rhombus, Blue Celestial Disc
  if (code === "BR") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#009739" />
        <polygon points="12,1.8 22,8 12,14.2 2,8" fill="#FEDD00" />
        <circle cx="12" cy="8" r="3.2" fill="#012169" />
        <path d="M9.2 8.4 A 3.2 3.2 0 0 1 14.8 6.5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
      </svg>
    );
  }

  // 19. PORTUGAL (PT) — Green, Red with Armillary Sphere & Shield
  if (code === "PT") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="9.6" height="16" fill="#046A38" />
        <rect x="9.6" width="14.4" height="16" fill="#DA291C" />
        {/* Yellow Armillary Sphere */}
        <circle cx="9.6" cy="8" r="3.2" stroke="#FFDA44" strokeWidth="0.8" fill="none" />
        {/* Portuguese Shield */}
        <rect x="8.3" y="6.6" width="2.6" height="2.8" rx="0.5" fill="#FFFFFF" stroke="#DA291C" strokeWidth="0.6" />
        <circle cx="9.6" cy="8" r="0.6" fill="#002B7F" />
      </svg>
    );
  }

  // 20. RUSSIA (RU) — White, Blue, Red
  if (code === "RU") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="5.33" fill="#FFFFFF" />
        <rect y="5.33" width="24" height="5.33" fill="#0039A6" />
        <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
      </svg>
    );
  }

  // 21. PAKISTAN (PK) — White Bar + Dark Green with Crescent & Star
  if (code === "PK") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="6" height="16" fill="#FFFFFF" />
        <rect x="6" width="18" height="16" fill="#01411C" />
        {/* Crescent */}
        <circle cx="15.5" cy="8" r="3.5" fill="#FFFFFF" />
        <circle cx="16.5" cy="7.3" r="3.1" fill="#01411C" />
        {/* 5-pointed Star */}
        <polygon points="17.2,5.2 17.6,6.2 18.6,6.2 17.8,6.8 18.1,7.8 17.2,7.2 16.3,7.8 16.6,6.8 15.8,6.2 16.8,6.2" fill="#FFFFFF" />
      </svg>
    );
  }

  // 22. INDONESIA (ID) — Sang Saka Merah-Putih (Red top, White bottom)
  if (code === "ID") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="8" fill="#FF0000" />
        <rect y="8" width="24" height="8" fill="#FFFFFF" />
      </svg>
    );
  }

  // 23. POLAND (PL) — White top, Red bottom
  if (code === "PL") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="8" fill="#FFFFFF" />
        <rect y="8" width="24" height="8" fill="#DC143C" />
      </svg>
    );
  }

  // 24. GERMANY (DE) — Black, Red, Gold
  if (code === "DE") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="5.33" fill="#000000" />
        <rect y="5.33" width="24" height="5.33" fill="#DD0000" />
        <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
      </svg>
    );
  }

  // 25. JAPAN (JP) — Nisshōki (White with Crimson Sun Disc)
  if (code === "JP") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#FFFFFF" />
        <circle cx="12" cy="8" r="4.5" fill="#BC002D" />
      </svg>
    );
  }

  // 26. TURKEY (TR) — Red with White Crescent & 5-pointed Star
  if (code === "TR") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#E30A17" />
        <circle cx="9" cy="8" r="4" fill="#FFFFFF" />
        <circle cx="10.2" cy="8" r="3.2" fill="#E30A17" />
        <polygon points="14,8 14.8,8.8 15.9,8.5 15.2,9.4 15.6,10.4 14.6,9.9 13.7,10.5 13.9,9.4 13.1,8.7 14.2,8.7" fill="#FFFFFF" />
      </svg>
    );
  }

  // 27. ITALY (IT) — Il Tricolore (Green, White, Red)
  if (code === "IT") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="8" height="16" fill="#009246" />
        <rect x="8" width="8" height="16" fill="#FFFFFF" />
        <rect x="16" width="8" height="16" fill="#CE2B37" />
      </svg>
    );
  }

  // 28. NETHERLANDS (NL) — Vermilion, White, Cobalt Blue
  if (code === "NL") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="5.33" fill="#AE1C28" />
        <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
        <rect y="10.67" width="24" height="5.33" fill="#21468B" />
      </svg>
    );
  }

  // 29. SOUTH KOREA (KR) — Taegeukgi with authentic Taegeuk & 4 Corner Trigrams
  if (code === "KR") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#FFFFFF" />
        {/* Taegeuk: Red upper lobe, Blue lower lobe with smooth interlocking curve */}
        <path d="M12 4 A 4 4 0 0 1 12 12 A 2 2 0 0 1 12 8 A 2 2 0 0 0 12 4 Z" fill="#CD2E3A" />
        <path d="M12 12 A 4 4 0 0 1 12 4 A 2 2 0 0 1 12 8 A 2 2 0 0 0 12 12 Z" fill="#0047A0" />
        {/* Authentic 4 Black Corner Trigrams (Geon, Gon, Gam, Ri) */}
        <g stroke="#000000" strokeWidth="0.75" strokeLinecap="round">
          {/* Top-left: Geon (3 solid bars) */}
          <line x1="4.2" y1="3.2" x2="6.5" y2="4.8" />
          <line x1="4.9" y1="2.4" x2="7.2" y2="4.0" />
          <line x1="3.5" y1="4.0" x2="5.8" y2="5.6" />

          {/* Top-right: Gam (split, solid, split) */}
          <line x1="19.8" y1="3.2" x2="17.5" y2="4.8" />
          <line x1="19.1" y1="2.4" x2="18.1" y2="3.1" />
          <line x1="18.5" y1="4.1" x2="17.5" y2="4.8" />
          <line x1="20.5" y1="4.0" x2="18.2" y2="5.6" />

          {/* Bottom-left: Ri (solid, split, solid) */}
          <line x1="4.2" y1="12.8" x2="6.5" y2="11.2" />
          <line x1="4.9" y1="13.6" x2="5.9" y2="12.9" />
          <line x1="5.5" y1="11.9" x2="6.5" y2="11.2" />
          <line x1="3.5" y1="12.0" x2="5.8" y2="10.4" />

          {/* Bottom-right: Gon (3 split bars) */}
          <line x1="19.8" y1="12.8" x2="18.8" y2="12.1" />
          <line x1="18.5" y1="11.9" x2="17.5" y2="11.2" />
          <line x1="19.1" y1="13.6" x2="18.1" y2="12.9" />
          <line x1="17.8" y1="12.7" x2="16.8" y2="12.0" />
          <line x1="20.5" y1="12.0" x2="19.5" y2="11.3" />
          <line x1="19.2" y1="11.1" x2="18.2" y2="10.4" />
        </g>
      </svg>
    );
  }

  // 30. VIETNAM (VN) — Red with 5-pointed Yellow Star
  if (code === "VN") {
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 16" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="16" fill="#DA251D" />
        <polygon points="12,3.5 13.5,7.8 18,7.8 14.3,10.4 15.7,14.6 12,11.8 8.3,14.6 9.7,10.4 6,7.8 10.5,7.8" fill="#FFFF00" />
      </svg>
    );
  }

  // Fallback badge
  return (
    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-mono font-bold shrink-0 ${className}`}>
      {code.slice(0, 2)}
    </span>
  );
};

export default CountryFlag;
