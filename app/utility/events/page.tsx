// app/utility/events/page.tsx — Flex events (owner: A, BUILD.md A10; DESIGN.md §6.3)
// Form on the left, live list on the right. Built only from C's components/ui.
"use client";

import { useCallback } from "react";
import { PageHeader, useToast } from "@/components/ui";
import { usePolling } from "@/components/utility/usePolling";
import { EventForm } from "@/components/utility/events/EventForm";
import { EventList } from "@/components/utility/events/EventList";
import { loadEventsView } from "@/components/utility/events/api";

export default function FlexEventsPage() {
  const load = useCallback(loadEventsView, []);
  const { data } = usePolling(load);
  const { showToast, toast } = useToast();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AEP · Residential flexibility"
        title="Flex events"
        lead="Ask enrolled homes to keep load out of a window. Customers see the event within 5 seconds."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <EventForm onCreated={(label) => showToast(`Event created · ${label} · customers see it within 5 s`)} />
        <EventList view={data} />
      </div>
      {toast}
    </div>
  );
}
