// app/utility/events/page.tsx — Flex events (owner: A, BUILD.md A10; DESIGN.md §6.3)
// Form on the left, live list on the right. Built only from C's components/ui.
"use client";

import { useCallback } from "react";
import { useToast } from "@/components/ui";
import { usePolling } from "@/components/utility/usePolling";
import { EventForm } from "@/components/utility/events/EventForm";
import { EventList } from "@/components/utility/events/EventList";
import { loadEventsView } from "@/components/utility/events/api";

export default function FlexEventsPage() {
  const load = useCallback(loadEventsView, []);
  const { data } = usePolling(load);
  const { showToast, toast } = useToast();

  return (
    <div className="space-y-4">
      <h1 className="text-h1">Flex events</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <EventForm onCreated={(label) => showToast(`Event created · ${label} · customers see it within 5 s`)} />
        <EventList view={data} />
      </div>
      {toast}
    </div>
  );
}
