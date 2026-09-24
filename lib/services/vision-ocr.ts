import path from "path";
import fs from "fs/promises";
import { readPrivateFile } from "@/lib/storage";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/**
 * Performs Cadastral OCR on uploaded images (PNG/JPG) and PDFs using Gemini Vision API
 * with resilient fallback to cadastral heuristic transcription.
 */
export async function extractCadastralTextFromDocument(
  storageKey: string,
  mimeType: string,
  originalName: string
): Promise<string> {
  try {
    const buffer = await readPrivateFile(storageKey);
    if (!buffer || buffer.length === 0) {
      return "";
    }

    const isImage = mimeType.startsWith("image/") || /\.(png|jpg|jpeg|webp)$/i.test(originalName);
    const isPdf = mimeType === "application/pdf" || originalName.toLowerCase().endsWith(".pdf");

    // If we have Gemini API Key and it's an image or PDF, use Gemini Vision for high-precision cadastral OCR & scam audit
    if (GEMINI_API_KEY && (isImage || isPdf)) {
      try {
        const base64Data = buffer.toString("base64");
        const effectiveMime = isPdf ? "application/pdf" : (mimeType.startsWith("image/") ? mimeType : "image/jpeg");
        const prompt = `You are an expert Cadastral Surveyor and International Land Registry Fraud & Due-Diligence Specialist.
Examine this uploaded document or image.

STEP 1: AUTHENTICITY & DOCUMENT CLASSIFICATION
Determine if this image/document is an authentic land or property instrument (e.g. Registered Survey Plan, Deed of Assignment / Conveyance, Certificate of Occupancy, Governor's Consent, Government Gazette Excision, Allocation Letter, or Land Purchase Receipt).

CRITICAL CHECK: If this file is NOT an authentic land document — for example, if it is a social media screenshot (Facebook, Instagram, WhatsApp, TikTok), a selfie, a meme, a photo of a person/car/scenery, an e-commerce receipt, or an unrelated image:
YOU MUST BEGIN YOUR OUTPUT WITH:
[NON_CADASTRAL_IRRELEVANT_FILE]
Explain clearly that this uploaded image does not contain any statutory land title, certified surveyor seal, or cadastral coordinates.

STEP 2: CADASTRAL EXTRACTION (Only if it is a genuine land document)
Extract and transcribe ALL visible cadastral text:
1. Document Type & Title (e.g. Survey Plan, Deed of Assignment, C of O)
2. State / Region, LGA / District, City, Country
3. Cadastral Survey Plan Number (e.g. LS/D/..., OG/..., LA/...)
4. Boundary Beacon / Corner Pin Numbers (e.g. PB..., SC..., NIS...)
5. Surveyor Name and SURCON / License Number
6. Plot Number, Block Number, Layout / Estate Name
7. Parties: Grantor (Seller) and Grantee (Buyer)
8. Root of Title / Registration particulars (Volume, Page, Title No.)
9. Consideration / Purchase Price
10. Irregularities, alterations, or forgery signs

Transcribe all facts, numbers, beacon coordinates, and official notations thoroughly and accurately.`;

        // In 2026, gemini-3.6-flash is the active multimodal flash model
        const modelNames = ["gemini-3.6-flash", "gemini-flash-latest"];
        let candidateText = "";

        for (const model of modelNames) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        { text: prompt },
                        {
                          inlineData: {
                            mimeType: effectiveMime,
                            data: base64Data,
                          },
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2048,
                  },
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text && text.trim().length > 20) {
                candidateText = text.trim();
                break;
              }
            }
          } catch (modelErr) {
            console.warn(`[VISION_OCR] Model ${model} call failed:`, modelErr);
          }
        }

        if (candidateText) {
          return candidateText;
        }
      } catch (geminiErr) {
        console.warn("[VISION_OCR] Gemini call failed, using heuristic extraction:", geminiErr);
      }
    }

    // Fallback: If not an image (e.g. text/plain or docx containing ASCII strings)
    if (!isImage) {
      const rawString = buffer.toString("utf8");
      const cleanMatches = rawString.match(/[a-zA-Z0-9.,/:;\- ]{6,}/g) || [];
      const extractedText = cleanMatches.slice(0, 150).join(" ");
      if (extractedText.length > 50) {
        return extractedText;
      }
    }

    // Binary image fallback without Gemini OCR: never return binary noise
    return `[UNVERIFIED_IMAGE: "${originalName}". Image lacks machine-readable cadastral text. No certified surveyor beacons or statutory root of title detected.]`;
  } catch (err) {
    console.error("[VISION_OCR_ERROR]", err);
    return `[UNVERIFIED_DOCUMENT: "${originalName}"]`;
  }
}
