import { beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import { PreferencesProvider } from "@/components/preferences";
import { ReportLanguageBridge } from "@/lib/contexts/language-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisitorBanner } from "@/components/visitor-banner";
import { DailyAgenda } from "@/components/ceremony/daily-agenda";
import { NeedsSnapshot } from "@/components/ceremony/needs-snapshot";
import { ManualEditor } from "@/components/manual-editor";
import type { AnalyzedItem } from "@/lib/analytics/engine";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/evidence",
}));

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider initialTheme="light" initialLanguage="pt">
      <ReportLanguageBridge>{children}</ReportLanguageBridge>
    </PreferencesProvider>
  );
}

async function expectNoA11yViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      region: { enabled: false },
    },
  });
  expect(results.violations).toEqual([]);
}

const sampleItem: AnalyzedItem = {
  title: "Fix queue stall in checkout",
  assignee: "Davi",
  estimate: 3,
  status: "Aberta",
  board: "Em revisão",
  project: "Core",
  sprints: "S1 | S2",
  link: "-",
  completedAt: "-",
  milestone: "01-03-2026 - 14-03-2026",
  milestoneOrder: 1,
  milestoneStart: null,
  milestoneEnd: null,
  sourceFile: "sprint-2.csv",
  isDone: false,
  isQa: false,
  carryoverSprints: 2,
  firstMilestone: "15-02-2026 - 28-02-2026",
  lastMilestone: "01-03-2026 - 14-03-2026",
  sprintHistoryCount: 2,
  agingSprints: 2,
  isBottleneck: true,
};

describe("Riteflow UI accessibility (WCAG 2.2 AA)", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders SiteHeader without axe violations", async () => {
    const { container } = render(
      <Providers>
        <SiteHeader user={null} />
      </Providers>,
    );
    await expectNoA11yViolations(container);
  });

  it("renders SiteFooter and VisitorBanner without axe violations", async () => {
    const { container } = render(
      <Providers>
        <VisitorBanner />
        <SiteFooter />
      </Providers>,
    );
    await expectNoA11yViolations(container);
  });

  it("renders DailyAgenda, NeedsSnapshot, and ManualEditor without axe violations", async () => {
    const { container } = render(
      <Providers>
        <DailyAgenda items={[sampleItem]} discussedKeys={new Set()} onToggleDiscussed={vi.fn()} />
        <NeedsSnapshot />
        <ManualEditor onApply={vi.fn()} />
      </Providers>,
    );
    await expectNoA11yViolations(container);
  });
});
