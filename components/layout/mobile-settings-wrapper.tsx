'use client';

import { useMobileView } from '@/contexts/mobile-view-context';
import { MobileSettingsPanel } from '@/components/settings/settings-panel';

export function MobileSettingsWrapper() {
  const { isMobile, activeTab } = useMobileView();

  if (!isMobile || activeTab !== 'settings') return null;

  return <MobileSettingsPanel />;
}
