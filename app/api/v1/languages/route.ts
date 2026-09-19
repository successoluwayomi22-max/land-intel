import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const GLOBAL_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", direction: "LTR", active: true, region: "Global" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "中文 (简体)", direction: "LTR", active: true, region: "Asia" },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "LTR", active: true, region: "Global" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "LTR", active: true, region: "Asia" },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "RTL", active: true, region: "Middle East" },
  { code: "fr", name: "French", nativeName: "Français", direction: "LTR", active: true, region: "Global" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", direction: "LTR", active: true, region: "Asia" },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "LTR", active: true, region: "Americas" },
  { code: "ru", name: "Russian", nativeName: "Русский", direction: "LTR", active: true, region: "Europe" },
  { code: "ur", name: "Urdu", nativeName: "اردو", direction: "RTL", active: true, region: "Asia" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", direction: "LTR", active: true, region: "Asia" },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "LTR", active: true, region: "Europe" },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "LTR", active: true, region: "Asia" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", direction: "LTR", active: true, region: "Africa" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "LTR", active: true, region: "Middle East" },
  { code: "it", name: "Italian", nativeName: "Italiano", direction: "LTR", active: true, region: "Europe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", direction: "LTR", active: true, region: "Europe" },
  { code: "ko", name: "Korean", nativeName: "한국어", direction: "LTR", active: true, region: "Asia" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", direction: "LTR", active: true, region: "Asia" },
  { code: "pl", name: "Polish", nativeName: "Polski", direction: "LTR", active: true, region: "Europe" },
  { code: "pcm", name: "Nigerian Pidgin", nativeName: "Naija Pidgin", direction: "LTR", active: true, region: "Africa" },
  { code: "yo", name: "Yoruba", nativeName: "Èdè Yorùbá", direction: "LTR", active: true, region: "Africa" },
  { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo", direction: "LTR", active: true, region: "Africa" },
  { code: "ha", name: "Hausa", nativeName: "Harshen Hausa", direction: "LTR", active: true, region: "Africa" },
];

export async function GET() {
  const requestId = randomUUID();
  return NextResponse.json({
    data: GLOBAL_LANGUAGES,
    meta: {
      requestId,
      total: GLOBAL_LANGUAGES.length,
    },
  });
}
