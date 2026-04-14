"use client";

import { useEffect } from "react";
import { useNinetailed } from "@ninetailed/experience.js-react";

export default function NinetailedIdentify() {
  const { identify } = useNinetailed();

  useEffect(() => {
    let userId = localStorage.getItem("nt-user-id");

    if (!userId) {
      userId = "user-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("nt-user-id", userId);
    }

    identify(userId);
    console.log("🔥 Identified user:", userId);
  }, []);

  return null;
}
