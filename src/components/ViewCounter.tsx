"use client";

import { useEffect, useRef } from "react";

export default function ViewCounter({ slug }: { slug: string }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    fetch("/api/blog/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => {
      // silently fail
    });
  }, [slug]);

  return null;
}
