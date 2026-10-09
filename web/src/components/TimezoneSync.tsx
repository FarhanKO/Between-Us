"use client";

import { useEffect } from "react";
import { updateTimezone } from "@/app/settings/notifications/actions";

// Keeps profiles.timezone in step with the browser, so quiet hours and repeating
// reminders follow the user when they travel.
export function TimezoneSync({ current }: { current: string }) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== current) updateTimezone(tz);
  }, [current]);
  return null;
}
