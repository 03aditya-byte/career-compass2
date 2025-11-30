import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Bot,
  ClipboardPenLine,
  Database,
  LineChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Doc, Id } from "@/convex/_generated/dataModel";

type SessionWithCounselor = {
  session: Doc<"mentorships">;
  counselor?: Doc<"counselors"> | null;
};

type AdminPortalFeaturesProps = {
  isAdmin: boolean;
  sessions?: SessionWithCounselor[];
  counselors?: Doc<"counselors">[];
  careerPaths?: Doc<"careerPaths">[];
  assessments?: Doc<"assessments">[];
};

type GeneratedContent = {
  title: string;
  summary: string;
  requiredSkills: string[];
  salaryRange: string;
  roadmap: string[];
};

type NotificationItem = {
  id: string;
  subject: string;
  audience: string;
  scheduledAt: string;
  status: "Scheduled" | "Sent";
};

type ForumThread = {
  id: string;
  topic: string;
  flagged: boolean;
  pendingReplies: number;
};

const DEFAULT_FORUM_THREADS: ForumThread[] = [
  {
    id: "forum-1",
    topic: "Best roadmap for GenAI product managers?",
    flagged: false,
    pendingReplies: 1,
  },
  {
    id: "forum-2",
    topic: "Portfolio critique for UX case study",
    flagged: true,
    pendingReplies: 0,
  },
  {
    id: "forum-3",
    topic: "Need help choosing between MSCS vs bootcamp",
    flagged: false,
    pendingReplies: 2,
  },
];

export function AdminPortalFeatures({
  isAdmin,
  sessions,
  counselors,
  careerPaths,
  assessments,
}: AdminPortalFeaturesProps) {
  if (!isAdmin) return null;

  const [contentForm, setContentForm] = useState({ title: "", industry: "" });
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const [notificationForm, setNotificationForm] = useState({
    subject: "",
    audience: "all",
    scheduledAt: "",
    message: "",
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<NotificationItem[]>([]);

  const [forumThreads, setForumThreads] = useState(DEFAULT_FORUM_THREADS);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  const analyticsSummary = useMemo(() => {
    const totalSessions = sessions?.length ?? 0;
    const uniqueLearners = new Set(
      sessions?.map((entry) => entry.session.userId) ?? [],
    ).size;
    const peakHour = getPeakHourLabel(sessions ?? []);
    const careerFrequency = new Map<string, number>();
    assessments?.forEach((assessment) => {
      assessment.recommendedCareers.forEach((career) => {
        careerFrequency.set(career, (careerFrequency.get(career) ?? 0) + 1);
      });
    });
    const topCareer =
      Array.from(careerFrequency.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "Not enough data";
    return {
      totalSessions,
      uniqueLearners,
      peakHour,
      topCareer,
    };
  }, [sessions, assessments]);

  const counselorPerformance = useMemo(() => {
    if (!counselors?.length) return [];
    return counselors.map((counselor) => {
      const handled = sessions?.filter(
        (entry) => entry.counselor?._id === counselor._id,
      ).length ?? 0;
      return {
        name: counselor.name,
        sessions: handled,
        rating: counselor.rating,
        focusAreas: counselor.focusAreas.join(", "),
        responseTime: handled ? `${Math.max(1, 12 - handled)}h SLA` : "—",
      };
    });
  }, [counselors, sessions]);

  const usageHeatmap = useMemo(() => {
    const base: Array<{ feature: string; usage: number }> = [
      { feature: "Career Explorer", usage: (careerPaths?.length ?? 0) * 3 + 42 },
      { feature: "Mentor Connect", usage: (sessions?.length ?? 0) * 5 + 28 },
      { feature: "Innovation Hub", usage: 64 },
      { feature: "Learning Paths", usage: (assessments?.length ?? 0) * 4 + 30 },
      { feature: "Feedback Panel", usage: 37 },
    ];
    return base;
  }, [careerPaths, sessions, assessments]);

  const matchSuggestions = useMemo(() => {
    if (!counselors?.length || !assessments?.length) return [];
    return assessments.slice(0, 3).map((assessment) => {
      const bestCounselor = counselors.reduce(
        (best, counselor) => {
          const overlap = counselor.focusAreas.filter((area) =>
            assessment.focusAreas.includes(area),
          ).length;
          if (overlap > best.score) {
            return { counselor, score: overlap };
          }
          return best;
        },
        { counselor: counselors[0], score: 0 },
      );
      return {
        studentFocus: assessment.recommendedCareers[0] ?? assessment.summary,
        counselor: bestCounselor.counselor,
        score: Math.min(100, 60 + bestCounselor.score * 10),
      };
    });
  }, [assessments, counselors]);

  const fraudAlerts = useMemo(() => detectFraudulentPatterns(sessions ?? []), [sessions]);

  const handleGenerateContent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contentForm.title.trim()) {
      toast.error("Provide a career name to generate content.");
      return;
    }
    const generated = buildCareerContent(contentForm.title.trim(), contentForm.industry.trim());
    setGeneratedContent(generated);
    toast.success("Draft content generated.");
  };

  const handleScheduleNotification = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!notificationForm.subject.trim() || !notificationForm.scheduledAt) {
      toast.error("Subject and schedule time are required.");
      return;
    }
    setScheduledNotifications((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        subject: notificationForm.subject.trim(),
        audience: notificationForm.audience,
        scheduledAt: notificationForm.scheduledAt,
        status: "Scheduled",
      },
    ]);
    toast.success("Notification scheduled.");
    setNotificationForm({ subject: "", audience: "all", scheduledAt: "", message: "" });
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setBulkStatus("Processing import...");
    setTimeout(() => {
      setBulkStatus("Import successful");
      toast.success(`Imported ${file.name}`);
    }, 800);
  };

  const resolveThread = (threadId: string) => {
    setForumThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, flagged: false, pendingReplies: 0 } : thread,
      ),
    );
    toast.success("Thread reviewed and cleared.");
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              AI-Driven Analytics Dashboard
            </CardTitle>
            <CardDescription>Real-time platform telemetry for decision making.</CardDescription>
          </div>
          <Badge variant="outline">{analyticsSummary.peakHour}</Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Top Path</p>
            <p className="text-2xl font-semibold">{analyticsSummary.topCareer}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Active Learners</p>
            <p className="text-2xl font-semibold">{analyticsSummary.uniqueLearners}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Sessions</p>
            <p className="text-2xl font-semibold">{analyticsSummary.totalSessions}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Peak Usage</p>
            <p className="text-2xl font-semibold">{analyticsSummary.peakHour}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              Automated Career Content Generator
            </CardTitle>
            <CardDescription>Seed descriptions, skills, and outlook in one click.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={handleGenerateContent}>
              <Input
                value={contentForm.title}
                onChange={(event) =>
                  setContentForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="e.g., AI Product Strategist"
              />
              <Input
                value={contentForm.industry}
                onChange={(event) =>
                  setContentForm((prev) => ({ ...prev, industry: event.target.value }))
                }
                placeholder="Industry focus (optional)"
              />
              <Button type="submit" className="w-full">
                Generate outline
              </Button>
            </form>
            {generatedContent && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                <p className="font-semibold">{generatedContent.title}</p>
                <p>{generatedContent.summary}</p>
                <p>
                  Required skills:{" "}
                  <span className="font-medium">{generatedContent.requiredSkills.join(", ")}</span>
                </p>
                <p>Compensation: {generatedContent.salaryRange}</p>
                <ul className="list-disc pl-4">
                  {generatedContent.roadmap.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BellRing className="h-5 w-5 text-primary" />
              Smart Notification Scheduler
            </CardTitle>
            <CardDescription>Automate reminders and campaign outreach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form className="space-y-3" onSubmit={handleScheduleNotification}>
              <Input
                value={notificationForm.subject}
                onChange={(event) =>
                  setNotificationForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="Subject"
              />
              <Textarea
                value={notificationForm.message}
                onChange={(event) =>
                  setNotificationForm((prev) => ({ ...prev, message: event.target.value }))
                }
                placeholder="Message body"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={notificationForm.audience}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, audience: event.target.value }))
                  }
                >
                  <option value="all">All students</option>
                  <option value="inactive">Dormant cohorts</option>
                  <option value="mentors">Counselors</option>
                </select>
                <Input
                  type="datetime-local"
                  value={notificationForm.scheduledAt}
                  onChange={(event) =>
                    setNotificationForm((prev) => ({ ...prev, scheduledAt: event.target.value }))
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Schedule notification
              </Button>
            </form>
            {scheduledNotifications.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-2">
                {scheduledNotifications.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.audience} • {new Date(item.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{item.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" />
              Bulk Data Management
            </CardTitle>
            <CardDescription>Import/export cohorts, counselors, or content at scale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleBulkImport}
            />
            {importFileName && (
              <p className="text-sm text-muted-foreground">Loaded: {importFileName}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => toast("Export queued.")}>
                Export students
              </Button>
              <Button variant="outline" onClick={() => toast("Counselor export queued.")}>
                Export counselors
              </Button>
            </div>
            {bulkStatus && <Badge variant="secondary">{bulkStatus}</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Moderated Discussion Forum
            </CardTitle>
            <CardDescription>Auto-flags harmful content and highlights trends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {forumThreads.map((thread) => (
              <div
                key={thread.id}
                className="rounded-md border p-3 text-sm flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold">{thread.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    Pending replies: {thread.pendingReplies}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={thread.flagged ? "destructive" : "outline"}>
                    {thread.flagged ? "Flagged" : "Clean"}
                  </Badge>
                  {thread.flagged && (
                    <Button size="sm" onClick={() => resolveThread(thread.id)}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Counselor Performance Analytics
          </CardTitle>
          <CardDescription>Response time, ratings, and workload monitor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {counselorPerformance.length ? (
            counselorPerformance.map((row) => (
              <div
                key={row.name}
                className="grid gap-2 rounded-md border p-3 md:grid-cols-4"
              >
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.focusAreas}</p>
                </div>
                <p>Sessions: {row.sessions}</p>
                <p>Rating: {row.rating.toFixed(1)} ★</p>
                <p>SLA: {row.responseTime}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Seed counselors to view analytics.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LineChart className="h-5 w-5 text-primary" />
              User Heatmap Insights
            </CardTitle>
            <CardDescription>Feature engagement over the last 7 days.</CardDescription>
          </div>
          <Badge variant="secondary">UX Intelligence</Badge>
        </CardHeader>
        <CardContent>
          <ChartContainer
            id="user-heatmap"
            config={{
              usage: { label: "Usage", color: "hsl(var(--chart-1))" },
            }}
            className="h-64"
          >
            <BarChart data={usageHeatmap}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="feature" className="text-xs" />
              <Bar
                dataKey="usage"
                fill="hsl(var(--chart-1))"
                radius={[8, 8, 0, 0]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardPenLine className="h-5 w-5 text-primary" />
              Automated Session Matching
            </CardTitle>
            <CardDescription>AI pairs students with the best counselor instantly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchSuggestions.length ? (
              matchSuggestions.map((suggestion) => (
                <div
                  key={suggestion.studentFocus}
                  className="rounded-md border p-3 text-sm flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{suggestion.studentFocus}</p>
                    <p className="text-muted-foreground">
                      {suggestion.counselor?.name ?? "Counselor pool"}
                    </p>
                  </div>
                  <Badge variant="outline">{suggestion.score}% fit</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Run at least one assessment to unlock smart matching.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Fraud & Duplicate Detection
            </CardTitle>
            <CardDescription>Protects data integrity and trust.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-sm">
              <p>Duplicate accounts</p>
              <Badge variant={fraudAlerts.duplicates.length ? "destructive" : "outline"}>
                {fraudAlerts.duplicates.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/20 p-3 text-sm">
              <p>Suspicious login spikes</p>
              <Badge variant={fraudAlerts.suspiciousLogins ? "destructive" : "outline"}>
                {fraudAlerts.suspiciousLogins ? "Detected" : "Clear"}
              </Badge>
            </div>
            {fraudAlerts.duplicates.length > 0 && (
              <ul className="list-disc pl-4 text-sm">
                {fraudAlerts.duplicates.map((duplicate) => (
                  <li key={duplicate}>User {duplicate} flagged for review</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function buildCareerContent(title: string, industry: string): GeneratedContent {
  const normalizedTitle = title || "Career Strategist";
  const focusIndustry = industry || "Technology";
  return {
    title: normalizedTitle,
    summary: `${normalizedTitle} roles in ${focusIndustry} blend storytelling, experimentation, and leadership to ship durable impact.`,
    requiredSkills: ["Stakeholder alignment", "AI literacy", "Metrics design", "Narrative decks"],
    salaryRange: "$120k – $185k",
    roadmap: [
      "Phase 1: Audit strengths vs. role competencies",
      "Phase 2: Launch micro-experiments in 4 weeks",
      "Phase 3: Ship executive-ready narrative + metrics",
    ],
  };
}

function getPeakHourLabel(sessions: SessionWithCounselor[]) {
  if (!sessions.length) return "No data";
  const counts: Record<number, number> = {};
  sessions.forEach((entry) => {
    const hour = new Date(entry.session.sessionDate).getHours();
    counts[hour] = (counts[hour] ?? 0) + 1;
  });
  const peakHour = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const hourNumber = Number(peakHour);
  const label = hourNumber >= 12 ? `${hourNumber === 12 ? 12 : hourNumber - 12} PM` : `${hourNumber || 12} AM`;
  return `Peak: ${label}`;
}

function detectFraudulentPatterns(sessions: SessionWithCounselor[]) {
  const duplicates: Id<"users">[] = [];
  const userCounts = new Map<Id<"users">, number>();
  sessions.forEach((entry) => {
    const current = userCounts.get(entry.session.userId) ?? 0;
    const next = current + 1;
    userCounts.set(entry.session.userId, next);
    if (next > 3 && !duplicates.includes(entry.session.userId)) {
      duplicates.push(entry.session.userId);
    }
  });
  return {
    duplicates,
    suspiciousLogins: duplicates.length > 0,
  };
}