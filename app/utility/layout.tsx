// app/utility/layout.tsx — AEP dashboard shell: app switcher, sidebar, top bar (owner: C)
import type { ReactNode } from "react";
import { Nav } from "@/components/ui";
import { Sidebar } from "@/components/utility/Sidebar";
import { TopBar } from "@/components/utility/TopBar";

export default function UtilityLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
