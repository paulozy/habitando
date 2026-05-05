"use client";

import { useEffect } from "react";
import { trackRefVisit } from "@/lib/analytics/ref-tracker";

export function RefTracker() {
  useEffect(() => {
    void trackRefVisit(window.location.search);
  }, []);
  return null;
}
