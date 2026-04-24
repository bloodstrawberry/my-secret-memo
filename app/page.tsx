"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled — dockview uses browser-only DOM APIs
const DockviewMemo = dynamic(() => import("./dockview-memo"), { ssr: false });

export default function Page() {
  return <DockviewMemo />;
}
