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
Examine this uploaded document (Survey Plan, Deed of Conveyance/Assignment, Certificate of Occupancy / Title, or Official Land Instrument).
Extract and transcribe ALL visible cadastral text, with special focus on authentic verification, scam/fraud detection, and physical ground status:
1. Document Type & Title (e.g. Survey Plan, Deed of Conveyance, Certificate of Occupancy, Gazette Excision, Contract of Sale)
2. Country, Jurisdiction, State / Region, LGA / County, District / City
3. Cadastral Survey / Parcel Plan Number (e.g., LS/D/..., OG/..., LA/..., CAD/...)
4. Boundary Beacon / Corner Pin Numbers (e.g. PB 1234, SC/..., NIS/..., LA/...)
5. Surveyor Name and Professional Accreditation / SURCON License Number (and whether official seal/stamp is present or missing)
6. Parcel / Plot Number, Block Number, Layout / Estate Name
7. Parties Involved: Grantor / Assignor (Seller/Vendor) and Grantee / Assignee (Buyer/Purchaser)
8. Consideration / Purchase Price and Currency
9. Root of Title: Certificate of Occupancy number, Governor's Consent endorsement, Gazette Excision number, or Court Judgment reference
10. Ground Occupancy / Physical Description: Does the document describe bare land / undeveloped plot, or an existing building / structure / fenced compound (occupied vs bare)?
11. Discrepancies, Alterations, or Forgery Signs: Any erased numbers, altered dates, missing statutory signatures, or unverified stamps.

Transcribe all facts, numbers, beacon coordinates, and official notations thoroughly and accurately as raw searchable text.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim().length > 20) {
            return candidateText.trim();
          }
        }
      } catch (geminiErr) {
        console.warn("[VISION_OCR] Gemini call failed, using heuristic extraction:", geminiErr);
      }
    }

    // Fallback: If raw binary contains extractable UTF-8 text strings
    const rawString = buffer.toString("utf8");
    const cleanMatches = rawString.match(/[a-zA-Z0-9.,/:;\- ]{6,}/g) || [];
    const extractedText = cleanMatches.slice(0, 150).join(" ");

    if (extractedText.length > 50) {
      return extractedText;
    }

    return `Document: ${originalName}. Uploaded cadastral record under inspection.`;
  } catch (err) {
    console.error("[VISION_OCR_ERROR]", err);
    return `Document: ${originalName}`;
  }
}
