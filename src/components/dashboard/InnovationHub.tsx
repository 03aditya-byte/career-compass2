import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Lightbulb, Rocket, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SessionSummary = {
  session: {
    goal: string;
    sessionDate: number;
    status: "scheduled" | "completed" | "cancelled";
  };
  counselor?: {
    name?: string;
  } | null;
};

type CareerSummary = {
  title: string;
  skillsToGrow: string[];
  growthOutlook: string;
  estimatedSalary: string;
  category: string;
};

type InnovationHubProps = {
  insightText: string;
  assessmentCallout: string;
  selectedCareer?: CareerSummary | null;
  sessions: SessionSummary[];
};

const ideaIcons = [Lightbulb, Rocket, Activity];

export function InnovationHub({
  insightText,
  assessmentCallout,
  selectedCareer,
  sessions,
}: InnovationHubProps) {
  const ideas = useMemo(() => {
    const focusSkill = selectedCareer?.skillsToGrow?.[0] ?? "a breakout skill";
    return [
      {
        title: "Opportunity Radar",
        body: selectedCareer
          ? `Prototype a 72-hour micro-project that highlights ${focusSkill} for ${selectedCareer.title}. Show the impact fast.`
          : "Select a career path to unlock targeted experiments that boost your portfolio.",
        tag: selectedCareer?.growthOutlook ?? "Pick a path",
      },
      {
        title: "Signal Boost",
        body: `Ship a short post or Loom story about ${focusSkill}. Teach one insight and attach a visual to attract feedback.`,
        tag: "Brand Cred",
      },
      {
        title: "Learning Sprint",
        body: `Schedule a 25-minute daily reflection. Tie each note back to your latest assessment takeaway below.`,
        tag: "Consistency",
      },
    ];
  }, [selectedCareer]);

  const nextSession = sessions.find((entry) => entry.session.status === "scheduled");

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Innovation Lab</CardTitle>
        </div>
        <CardDescription>{assessmentCallout}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{insightText}</p>
        <div className="grid gap-3">
          {ideas.map((idea, index) => {
            const Icon = ideaIcons[index % ideaIcons.length];
            return (
              <motion.div
                key={idea.title}
                className="rounded-xl border bg-card/80 p-3 shadow-sm backdrop-blur"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Icon className="h-4 w-4 text-primary" />
                    {idea.title}
                  </div>
                  <Badge variant="outline">{idea.tag}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{idea.body}</p>
              </motion.div>
            );
          })}
        </div>
        {nextSession && (
          <div className="rounded-lg border border-dashed p-3 text-sm">
            <p className="font-semibold">Next Mentor Touchpoint</p>
            <p className="text-muted-foreground">
              {nextSession.counselor?.name ?? "Mentor"} ·{" "}
              {new Date(nextSession.session.sessionDate).toLocaleString()}
            </p>
            <Badge className="mt-2 w-fit" variant="secondary">
              {nextSession.session.goal}
            </Badge>
          </div>
        )}
      </CardContent>
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{
          background:
            "linear-gradient(120deg, rgba(59,130,246,0.5), rgba(236,72,153,0.5))",
        }}
      />
    </Card>
  );
}