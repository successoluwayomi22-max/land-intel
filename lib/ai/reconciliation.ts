export interface ReconciledDifference {
  id: string;
  field: string;
  fieldLabel: string;
  docAName: string;
  docAId: string;
  docAPage: number;
  docAValue: string;
  docBName: string;
  docBId: string;
  docBPage: number;
  docBValue: string;
  differenceDescription: string;
  severity: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  confidence: number;
  whyItMatters: string;
  recommendedAction: string;
  requiresProfessional: boolean;
}

export interface DocumentItem {
  id: string;
  originalName: string;
  category: string;
  extractions: Array<{
    fieldName: string;
    fieldValue: string;
    pageNumber: number;
  }>;
}

/**
 * Normalizes text for comparison by removing whitespace and punctuation
 */
function normalize(val: string): string {
  return (val || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Compares documents pairwise across extracted cadastral and legal fields
 */
export function reconcileCaseDocuments(documents: DocumentItem[]): ReconciledDifference[] {
  const differences: ReconciledDifference[] = [];

  interface FieldCheck {
    key: string;
    label: string;
    severity: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
    why: string;
    action: string;
  }

  const fieldsToCheck: FieldCheck[] = [
    {
      key: "plot_number",
      label: "Plot / Parcel Identifier",
      severity: "HIGH",
      why: "Different plot references indicate that the documents describe two distinct plots or contain a severe conveyancing error, creating high risk of double-allocation or boundary dispute.",
      action: "Halt transaction immediately and require the vendor to produce the approved layout plan and letter of allocation from the Ministry of Physical Planning / Lands Bureau.",
    },
    {
      key: "survey_number",
      label: "Survey Plan Reference",
      severity: "HIGH",
      why: "A survey plan reference mismatch between the Deed of Assignment and the attached Survey Plan means the legal covenants do not legally attach to the charted land parcel.",
      action: "Demand vendor and licensed surveyor reconcile survey plan numbers with the Record Copy lodged at the Office of the State Surveyor General.",
    },
    {
      key: "land_area",
      label: "Property Area & Dimensions",
      severity: "MODERATE",
      why: "Stated area discrepancies between instruments can result in purchasing significantly less square meterage on ground than contracted or overlapping with compulsory setbacks.",
      action: "Commission a practicing surveyor to perform boundary closure calculations and confirm physical perimeter dimensions on ground.",
    },
    {
      key: "seller_name",
      label: "Vendor / Grantor Name",
      severity: "ELEVATED",
      why: "Seller name variances may indicate unauthorized proxy sales, undisclosed family members, or an unbroken root of title defect.",
      action: "Verify the seller's valid government-issued ID against the registered root of title or obtain a certified registered Power of Attorney.",
    },
    {
      key: "buyer_name",
      label: "Purchaser / Assignee Name",
      severity: "MODERATE",
      why: "Inconsistent purchaser spelling or corporate nomenclature can cause title registration rejection at the Lands Registry during Governor's consent processing.",
      action: "Ensure the purchaser's full legal name matching their passport/NIN or CAC corporate registration is used identically across all instruments.",
    },
    {
      key: "surcon_number",
      label: "SURCON Surveyor Accreditation",
      severity: "HIGH",
      why: "Differing surveyor credentials or missing SURCON registration numbers could indicate an unaccredited or forged survey plan inadmissible at the Surveyor General's office.",
      action: "Verify the surveyor's active license on the Surveyors Council of Nigeria (SURCON) register before accepting the survey plan.",
    },
    {
      key: "coo_number",
      label: "Certificate of Occupancy Reference",
      severity: "CRITICAL",
      why: "Conflicting C of O numbers between the recital and root of title means the title investigation may be anchored to the wrong statutory grant.",
      action: "Conduct an immediate official file search at the State Lands Bureau to pull the physical or digital Lands Registry file.",
    },
    {
      key: "cadastral_datum",
      label: "Geodetic Datum & Coordinate Grid",
      severity: "ELEVATED",
      why: "Mixing WGS84 GPS coordinates with official Minna Datum coordinates causes a physical 100-300m spatial shift, risking boundary misplacement.",
      action: "Instruct your surveyor to convert all field GPS readings into official Minna Datum (UTM Zone 31/32) before charting.",
    },
    {
      key: "registration_particulars",
      label: "Lands Registry Volume & Page",
      severity: "HIGH",
      why: "Conflicting registration volume and page particulars mean the deeds reference different registered deeds in the Lands Registry archive.",
      action: "Request your property lawyer to inspect the Register Book at the Lands Bureau to verify which volume contains the actual deed.",
    },
  ];

  for (const field of fieldsToCheck) {
    const matchingExtractions: Array<{
      docId: string;
      docName: string;
      page: number;
      value: string;
      normalized: string;
    }> = [];

    for (const doc of documents) {
      for (const ext of doc.extractions) {
        if (ext.fieldName === field.key && ext.fieldValue) {
          matchingExtractions.push({
            docId: doc.id,
            docName: doc.originalName,
            page: ext.pageNumber,
            value: ext.fieldValue,
            normalized: normalize(ext.fieldValue),
          });
        }
      }
    }

    if (matchingExtractions.length >= 2) {
      const base = matchingExtractions[0];
      for (let i = 1; i < matchingExtractions.length; i++) {
        const comp = matchingExtractions[i];
        if (base.normalized !== comp.normalized && base.docId !== comp.docId) {
          differences.push({
            id: `diff_${field.key}_${base.docId.slice(-4)}_${comp.docId.slice(-4)}`,
            field: field.key,
            fieldLabel: field.label,
            docAId: base.docId,
            docAName: base.docName,
            docAPage: base.page,
            docAValue: base.value,
            docBId: comp.docId,
            docBName: comp.docName,
            docBPage: comp.page,
            docBValue: comp.value,
            differenceDescription: `Variance detected in ${field.label}: "${base.value}" in ${base.docName} vs "${comp.value}" in ${comp.docName}.`,
            severity: field.severity,
            confidence: 0.93,
            whyItMatters: field.why,
            recommendedAction: field.action,
            requiresProfessional: field.severity === "HIGH" || field.severity === "CRITICAL",
          });
        }
      }
    }
  }

  return differences;
}
