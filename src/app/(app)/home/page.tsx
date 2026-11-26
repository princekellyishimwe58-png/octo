"use client";

import * as React from "react";
import {
  CalendarPlus,
  MessageSquare,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useOcto } from "@/lib/store";
import { todayStats } from "@/lib/analytics";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { WeeklyChart } from "@/components/weekly-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssistantTestDialog } from "@/components/assistant-tester";

export default function HomePage() {
  const { workspace } = useOcto();
  const [testOpen, setTestOpen] = React.useState(false);
  const stats = todayStats(workspace);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <PageHeader
        title={`Today at ${workspace.business.name || "your business"}`}
        description={today}
        action={
          <Button size="lg" className="w-full sm:w-auto" onClick={() => setTestOpen(true)}>
            <Sparkles />
            Test my assistant
          </Button>
        }
      />

      {/* The four numbers that matter to a busy owner */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Messages today"
          value={stats.messagesToday}
          icon={MessageSquare}
          hint="From your customers"
        />
        <StatCard
          label="Bookings today"
          value={stats.bookingsToday}
          icon={CalendarPlus}
          hint="Confirmed appointments"
        />
        <StatCard
          label="Answered by AI"
          value={stats.aiAnswersToday}
          icon={Sparkles}
          hint="No waiting for you"
        />
        <StatCard
          label="Need your reply"
          value={stats.needsAttention}
          icon={TriangleAlert}
          tone={stats.needsAttention > 0 ? "alert" : "neutral"}
          hint={stats.needsAttention > 0 ? "Open Conversations to help" : "All caught up"}
        />
      </div>

      {/* One simple weekly trend */}
      <Card className="mt-6">
        <CardContent className="p-5 sm:p-6">
          <WeeklyChart />
        </CardContent>
      </Card>

      <AssistantTestDialog open={testOpen} onOpenChange={setTestOpen} />
    </>
  );
}
