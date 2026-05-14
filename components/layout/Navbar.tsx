"use client";

import { useState } from "react";
import { Header } from "./Header";
import { HelpModal } from "@/components/modals/HelpModal";
import { StatsModal } from "@/components/modals/StatsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

interface NavbarApi {
  modalsOpen: boolean;
  /** Header to render at the top of the page. */
  header: React.ReactNode;
  /** Modal portal markup to render anywhere in the tree. */
  modals: React.ReactNode;
  /** Open the stats modal — useful to show automatically after game finishes. */
  openStats: () => void;
}

/**
 * Owns help/stats/settings modal state and renders the header that toggles
 * them. Returns the JSX nodes to mount and a flag the page uses to disable
 * physical-keyboard input while a modal is open.
 */
export function useNavbar(): NavbarApi {
  const [help, setHelp] = useState(false);
  const [stats, setStats] = useState(false);
  const [settings, setSettings] = useState(false);

  const modalsOpen = help || stats || settings;

  const header = (
    <Header
      onOpenHelp={() => setHelp(true)}
      onOpenStats={() => setStats(true)}
      onOpenSettings={() => setSettings(true)}
    />
  );

  const modals = (
    <>
      <HelpModal open={help} onClose={() => setHelp(false)} />
      <StatsModal open={stats} onClose={() => setStats(false)} />
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </>
  );

  return { modalsOpen, header, modals, openStats: () => setStats(true) };
}
