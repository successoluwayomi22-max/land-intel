"use client";

import React, { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught exception:", error);
  }, [error]);

  return (
    <div className="flex-1 p-6 md:p-12 flex items-center justify-center min-h-[60vh]">
      <ErrorState
        title="Dashboard Module Error"
        description={error.message || "Failed to load dashboard telemetry. You can retry the operation or return to your overview."}
        code={error.digest || "ERR_DASHBOARD_EXCEPTION"}
        onRetry={() => reset()}
        showHomeLink={true}
      />
    </div>
  );
}
