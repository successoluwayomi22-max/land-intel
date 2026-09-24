"use client";

import React from "react";

interface FlagProps {
  countryCode: string;
  className?: string;
  size?: number;
}

export const CountryFlag: React.FC<FlagProps> = ({ countryCode, className = "", size = 16 }) => {
  const code = (countryCode || "").toUpperCase();
  const height = Math.round((size * 3) / 4);

  // Crisp SVG flags for all supported world languages & currencies
  if (code === "NG") {
    // Nigeria Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="8" height="18" fill="#008751" />
        <rect x="8" width="8" height="18" fill="#FFFFFF" />
        <rect x="16" width="8" height="18" fill="#008751" />
      </svg>
    );
  }

  if (code === "US") {
    // United States Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#B22234" />
        <path d="M0 2.77h24M0 5.54h24M0 8.31h24M0 11.08h24M0 13.85h24M0 16.62h24" stroke="#FFFFFF" strokeWidth="1.38" />
        <rect width="10" height="9.7" fill="#3C3B6E" />
        <circle cx="2.5" cy="2.5" r="0.8" fill="#FFFFFF" />
        <circle cx="5" cy="2.5" r="0.8" fill="#FFFFFF" />
        <circle cx="7.5" cy="2.5" r="0.8" fill="#FFFFFF" />
        <circle cx="3.75" cy="4.8" r="0.8" fill="#FFFFFF" />
        <circle cx="6.25" cy="4.8" r="0.8" fill="#FFFFFF" />
        <circle cx="2.5" cy="7.2" r="0.8" fill="#FFFFFF" />
        <circle cx="5" cy="7.2" r="0.8" fill="#FFFFFF" />
        <circle cx="7.5" cy="7.2" r="0.8" fill="#FFFFFF" />
      </svg>
    );
  }

  if (code === "GB" || code === "UK") {
    // United Kingdom Union Jack
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#012169" />
        <path d="M0 0l24 18M24 0L0 18" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M0 0l24 18M24 0L0 18" stroke="#C8102E" strokeWidth="1.5" />
        <path d="M12 0v18M0 9h24" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M12 0v18M0 9h24" stroke="#C8102E" strokeWidth="3" />
      </svg>
    );
  }

  if (code === "CN") {
    // China Flag (Red with Yellow Stars)
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#DE2910" />
        <polygon points="5,2.5 5.8,4.8 8,4.8 6.2,6.1 6.8,8.2 5,7 3.2,8.2 3.8,6.1 2,4.8 4.2,4.8" fill="#FFDE00" />
        <circle cx="10" cy="3" r="0.7" fill="#FFDE00" />
        <circle cx="11.5" cy="5" r="0.7" fill="#FFDE00" />
        <circle cx="11.5" cy="7.5" r="0.7" fill="#FFDE00" />
        <circle cx="10" cy="9.5" r="0.7" fill="#FFDE00" />
      </svg>
    );
  }

  if (code === "ES") {
    // Spain Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="4.5" fill="#AA151B" />
        <rect y="4.5" width="24" height="9" fill="#F1BF00" />
        <rect y="13.5" width="24" height="4.5" fill="#AA151B" />
        <circle cx="7" cy="9" r="2" fill="#AA151B" opacity="0.6" />
      </svg>
    );
  }

  if (code === "IN") {
    // India Flag (Saffron, White with Ashoka Chakra, Green)
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="6" fill="#FF9933" />
        <rect y="6" width="24" height="6" fill="#FFFFFF" />
        <rect y="12" width="24" height="6" fill="#138808" />
        <circle cx="12" cy="9" r="2" stroke="#000088" strokeWidth="0.8" fill="none" />
      </svg>
    );
  }

  if (code === "FR") {
    // France Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="8" height="18" fill="#0055A4" />
        <rect x="8" width="8" height="18" fill="#FFFFFF" />
        <rect x="16" width="8" height="18" fill="#EF4135" />
      </svg>
    );
  }

  if (code === "DE") {
    // Germany Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="6" fill="#000000" />
        <rect y="6" width="24" height="6" fill="#DD0000" />
        <rect y="12" width="24" height="6" fill="#FFCE00" />
      </svg>
    );
  }

  if (code === "SA" || code === "AE") {
    // Arab / UAE / Saudi
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect x="6" width="18" height="6" fill="#00732F" />
        <rect x="6" y="6" width="18" height="6" fill="#FFFFFF" />
        <rect x="6" y="12" width="18" height="6" fill="#000000" />
        <rect width="6" height="18" fill="#FF0000" />
      </svg>
    );
  }

  if (code === "BR" || code === "PT") {
    // Portugal / Brazil
    if (code === "BR") {
      return (
        <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
          <rect width="24" height="18" fill="#009739" />
          <polygon points="12,2 22,9 12,16 2,9" fill="#FEDD00" />
          <circle cx="12" cy="9" r="3.5" fill="#012169" />
        </svg>
      );
    }
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="9.6" height="18" fill="#046A38" />
        <rect x="9.6" width="14.4" height="18" fill="#DA291C" />
      </svg>
    );
  }

  if (code === "RU") {
    // Russia Flag (White, Blue, Red)
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="6" fill="#FFFFFF" />
        <rect y="6" width="24" height="6" fill="#0039A6" />
        <rect y="12" width="24" height="6" fill="#D52B1E" />
      </svg>
    );
  }

  if (code === "JP") {
    // Japan Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#FFFFFF" />
        <circle cx="12" cy="9" r="4.5" fill="#BC002D" />
      </svg>
    );
  }

  if (code === "IT") {
    // Italy Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="8" height="18" fill="#009246" />
        <rect x="8" width="8" height="18" fill="#FFFFFF" />
        <rect x="16" width="8" height="18" fill="#CE2B37" />
      </svg>
    );
  }

  if (code === "NL") {
    // Netherlands Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="6" fill="#AE1C28" />
        <rect y="6" width="24" height="6" fill="#FFFFFF" />
        <rect y="12" width="24" height="6" fill="#21468B" />
      </svg>
    );
  }

  if (code === "KR") {
    // South Korea Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#FFFFFF" />
        <circle cx="12" cy="9" r="4" fill="#CD2E3A" />
        <path d="M12 9 A 2 2 0 0 0 12 13 A 2 2 0 0 1 12 5 A 4 4 0 0 0 12 13 Z" fill="#0047A0" />
      </svg>
    );
  }

  if (code === "TR") {
    // Turkey Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#E30A17" />
        <circle cx="10" cy="9" r="4.2" fill="#FFFFFF" />
        <circle cx="11.2" cy="9" r="3.3" fill="#E30A17" />
        <polygon points="14,9 15.5,9.5 17,9 16,10 16.5,11.5 15,10.5 13.5,11.5 14,10" fill="#FFFFFF" />
      </svg>
    );
  }

  if (code === "ID" || code === "PL") {
    // Indonesia (Red top, White bottom) or Poland (White top, Red bottom)
    const topFill = code === "ID" ? "#FF0000" : "#FFFFFF";
    const bottomFill = code === "ID" ? "#FFFFFF" : "#DC143C";
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="9" fill={topFill} />
        <rect y="9" width="24" height="9" fill={bottomFill} />
      </svg>
    );
  }

  if (code === "VN") {
    // Vietnam Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#DA251D" />
        <polygon points="12,4 13.5,8.5 18,8.5 14.5,11.2 15.8,15.5 12,12.8 8.2,15.5 9.5,11.2 6,8.5 10.5,8.5" fill="#FFFF00" />
      </svg>
    );
  }

  if (code === "BD") {
    // Bangladesh Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#006A4E" />
        <circle cx="10.5" cy="9" r="4.5" fill="#F42A41" />
      </svg>
    );
  }

  if (code === "PK") {
    // Pakistan Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="6" height="18" fill="#FFFFFF" />
        <rect x="6" width="18" height="18" fill="#115E38" />
        <circle cx="15" cy="9" r="3.5" fill="#FFFFFF" />
        <circle cx="16" cy="8.5" r="3" fill="#115E38" />
      </svg>
    );
  }

  if (code === "CA") {
    // Canada Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="6" height="18" fill="#FF0000" />
        <rect x="6" width="12" height="18" fill="#FFFFFF" />
        <rect x="18" width="6" height="18" fill="#FF0000" />
        <path d="M12 4l1 3 2.5-.5-1.5 2 2 1.5-2.5.5.5 2.5-1.5-1.5V14h-1v-2.5l-1.5 1.5.5-2.5-2.5-.5 2-1.5-1.5-2 2.5.5z" fill="#FF0000" />
      </svg>
    );
  }

  if (code === "EU") {
    // European Union Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="18" fill="#003399" />
        <circle cx="12" cy="4" r="0.9" fill="#FFCC00" />
        <circle cx="12" cy="14" r="0.9" fill="#FFCC00" />
        <circle cx="7" cy="9" r="0.9" fill="#FFCC00" />
        <circle cx="17" cy="9" r="0.9" fill="#FFCC00" />
        <circle cx="8.5" cy="5.5" r="0.9" fill="#FFCC00" />
        <circle cx="15.5" cy="5.5" r="0.9" fill="#FFCC00" />
        <circle cx="8.5" cy="12.5" r="0.9" fill="#FFCC00" />
        <circle cx="15.5" cy="12.5" r="0.9" fill="#FFCC00" />
      </svg>
    );
  }

  if (code === "GH") {
    // Ghana Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="6" fill="#CF0921" />
        <rect y="6" width="24" height="6" fill="#FCD20E" />
        <rect y="12" width="24" height="6" fill="#006B3F" />
        <polygon points="12,7 13.2,10.5 16.5,10.5 13.8,12.5 14.8,16 12,14 9.2,16 10.2,12.5 7.5,10.5 10.8,10.5" fill="#000000" />
      </svg>
    );
  }

  if (code === "KE" || code === "TZ") {
    // Kenya / Tanzania (East Africa / Swahili)
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="5" fill="#000000" />
        <rect y="5" width="24" height="1" fill="#FFFFFF" />
        <rect y="6" width="24" height="6" fill="#BB0000" />
        <rect y="12" width="24" height="1" fill="#FFFFFF" />
        <rect y="13" width="24" height="5" fill="#006600" />
      </svg>
    );
  }

  if (code === "ZA") {
    // South Africa Flag
    return (
      <svg aria-hidden="true" focusable="false" width={size} height={height} viewBox="0 0 24 18" fill="none" className={`inline-block rounded-xs shadow-2xs shrink-0 ${className}`}>
        <rect width="24" height="9" fill="#DE3831" />
        <rect y="9" width="24" height="9" fill="#002395" />
        <polygon points="0,0 10,9 0,18" fill="#000000" />
        <polygon points="0,0 12,9 0,18" fill="none" stroke="#FFB612" strokeWidth="1.5" />
        <polygon points="2,0 14,9 2,18" fill="none" stroke="#007A3D" strokeWidth="2.5" />
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
