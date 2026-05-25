"use client";

import { useState } from "react";
import InventoryDashboard from "@/components/InventoryDashboard";
import PinGate from "@/components/PinGate";

export default function Home() {
  const [actor, setActor] = useState<string | null>(null);

  if (!actor) {
    return <PinGate onSuccess={setActor} />;
  }

  return <InventoryDashboard actor={actor} onLogout={() => setActor(null)} />;
}
