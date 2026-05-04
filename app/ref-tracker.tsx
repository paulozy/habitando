"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

export function RefTracker() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) track("ref_visit", { ref });
  }, []);
  return null;
}
