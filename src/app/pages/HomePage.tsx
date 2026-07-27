import { useState } from "react";
import { LeftSidebar } from "../components/LeftSidebar";
import { RightSidebar } from "../components/RightSidebar";
import { PriceDrops } from "../components/PriceDrops";
import { RecentReleases } from "../components/RecentReleases";
import { ActivityFeed } from "../components/ActivityFeed";

type NavKey = "collection" | "wishlist" | "following" | "followers";

export function HomePage() {
  const [nav, setNav] = useState<NavKey>("collection");

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-[88px] md:px-8 md:pb-8 lg:px-16">
      {/* Responsive grid: mobile 1 col · tablet left + feed · desktop 3 columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        {/* Left sidebar — hidden on mobile (replaced by bottom tab bar) */}
        <aside className="hidden md:block">
          <div className="sticky top-[88px]">
            <LeftSidebar active={nav} onNavigate={setNav} />
          </div>
        </aside>

        {/* Center feed */}
        <main className="flex min-w-0 flex-col gap-8">
          <PriceDrops />
          <RecentReleases />
          <ActivityFeed />
        </main>

        {/* Right sidebar — inline on desktop only */}
        <div className="hidden lg:block">
          <div className="sticky top-[88px]">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
