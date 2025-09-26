// ============================================================================
// Proposals Layout - Wraps Proposal Pages with Navigation
// AURELIA Agent - Design System and UI Specialist
// MAESTRO Orchestrated - User Interface Enhancement Phase
// ============================================================================

import { DashboardLayout } from '@/components';

export default function ProposalsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}