"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./Header";
import { HelpModal } from "@/components/modals/HelpModal";
import { StatsModal } from "@/components/modals/StatsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

interface NavbarApi {
  modalsOpen: boolean;
  header: ReactNode;
  modals: ReactNode;
  openStats: () => void;
}

// Owns help/stats/settings modal state and exposes a flag the page uses
// to disable the physical keyboard listener while a modal is open.
export function useNavbar(): NavbarApi {
  const [help, setHelp] = useState(false);
  const [stats, setStats] = useState(false);
  const [settings, setSettings] = useState(false);

  return {
    modalsOpen: help || stats || settings,
    header: (
      <Header
        onOpenHelp={() => setHelp(true)}
        onOpenStats={() => setStats(true)}
        onOpenSettings={() => setSettings(true)}
      />
    ),
    modals: (
      <>
        <HelpModal open={help} onClose={() => setHelp(false)} />
        <StatsModal open={stats} onClose={() => setStats(false)} />
        <SettingsModal open={settings} onClose={() => setSettings(false)} />
      </>
    ),
    openStats: () => setStats(true),
  };
}
