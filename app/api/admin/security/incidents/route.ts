import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { securityStore } from "@/lib/security/store";
import { IncidentStatus, SecuritySeverity } from "@/lib/security/types";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") as IncidentStatus) || undefined;

    const incidents = await securityStore.getIncidents(status);
    return NextResponse.json({ incidents });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    if (body.action === "UPDATE_STATUS") {
      const { id, status, resolution } = body;
      if (!id || !status) {
        return NextResponse.json({ error: "id and status are required" }, { status: 400 });
      }

      const updated = await securityStore.updateIncidentStatus(
        id,
        status as IncidentStatus,
        resolution,
        admin.email
      );

      if (!updated) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      }

      return NextResponse.json({ incident: updated });
    }

    // Otherwise, create incident
    const { title, description, severity, affectedUsers, affectedIps, affectedResources } = body;
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const created = await securityStore.createIncident({
      title,
      description,
      severity: (severity as SecuritySeverity) || "MEDIUM",
      status: "OPEN",
      affectedUsers: affectedUsers || [],
      affectedOrganizations: [],
      affectedIps: affectedIps || [],
      affectedResources: affectedResources || [],
      detectionSource: "ADMIN_MANUAL_CREATION",
      assignedAdmin: admin.email,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          description: "Incident manually created by administrator",
          actor: admin.email,
        },
      ],
      actionsTaken: ["MANUAL_INCIDENT_OPENED"],
    });

    return NextResponse.json({ incident: created }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status });
  }
}
