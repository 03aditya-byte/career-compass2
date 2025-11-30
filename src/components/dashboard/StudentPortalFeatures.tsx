import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BookOpenCheck,
  Brain,
  MessageSquare,
  Radar as RadarIcon,
  Route,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
} from "recharts";
import { Doc, Id } from "@/convex/_generated/dataModel";

type SessionWithCounselor = {
  session: Doc<"mentorships">;
  counselor?: Doc<"counselors"> | null;
};

type SavedCareerEntry = {
  savedCareerId: Id<"savedCareers">;
  career: Doc<"careerPaths">;
};

type StudentPortalFeaturesProps = {
  profile?: Doc<"profiles"> | null;
  assessments?: Doc<"assessments">[];
  selectedCareer?: Doc<"careerPaths"> | null;
  goals?: Doc<"goals">[];
  savedCareers?: SavedCareerEntry[];
  sessions?: SessionWithCounselor[];
};

type ResumeReport = {
  score: number;
  keywordMatches: string[];
  missingKeywords: string[];
  recommendations: string[];
};

type ChatMessage = {
  id: string;
  sender: "Student" | "Counselor";
  content: string;
  timestamp: string;
};

type LearningTask = {
  id: string;
  label: string;
  completed: boolean;
  type: "video" | "practice" | "project";
};

type MockFeedback = {
  score: number;
  strengths: string[];
  improvements: string[];
};

const MOCK_INTERVIEW_QUESTIONS = [
  {
    id: "behavioral",
    prompt: "Tell me about a time you overcame a career setback and how you reframed it.",
    focus: "Behavioral clarity",
  },
  {
    id: "vision",
    prompt: "How would you design a 30-60-90 day plan for your target role?",
    focus: "Strategic thinking",
  },
  {
    id: "technical",
    prompt: "Explain a complex project in simple terms to an executive stakeholder.",
    focus: "Storytelling",
  },
];

const INDUSTRY_SIGNAL_DATA = [
  { month: "Jan", ai: 62, product: 54, design: 48 },
  { month: "Feb", ai: 68, product: 57, design: 52 },
  { month: "Mar", ai: 74, product: 62, design: 55 },
  { month: "Apr", ai: 81, product: 66, design: 58 },
  { month: "May", ai: 89, product: 70, design: 61 },
  { month: "Jun", ai: 95, product: 73, design: 63 },
];

export function StudentPortalFeatures({
  profile,
  assessments,
  selectedCareer,
  goals,
  savedCareers,
  sessions,
}: StudentPortalFeaturesProps) {
  const primaryAssessment = assessments?.[0];
  const recommendedPaths = primaryAssessment?.recommendedCareers ?? [];
  const selectedCareerKey = selectedCareer?._id ?? "no-career";

  const [resumeText, setResumeText] = useState("");
  const [resumeReport, setResumeReport] = useState<ResumeReport | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "Counselor",
      content: "👋 Need help prioritizing between Product and Data tracks? I'm online now.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  const [roadmapCompletion, setRoadmapCompletion] = useState<Record<string, boolean>>({});
  const roadmapSteps = useMemo(() => generateRoadmap(selectedCareer), [selectedCareerKey]);
  useEffect(() => {
    setRoadmapCompletion({});
  }, [selectedCareerKey]);

  const [learningTasks, setLearningTasks] = useState<LearningTask[]>(() =>
    generateLearningTasks(selectedCareer),
  );
  useEffect(() => {
    setLearningTasks(generateLearningTasks(selectedCareer));
  }, [selectedCareerKey]);

  const completedLearning = learningTasks.filter((task) => task.completed).length;
  const learningProgress = learningTasks.length
    ? Math.round((completedLearning / learningTasks.length) * 100)
    : 0;

  const [mockQuestionIndex, setMockQuestionIndex] = useState(0);
  const [mockAnswer, setMockAnswer] = useState("");
  const [mockFeedback, setMockFeedback] = useState<MockFeedback | null>(null);

  const skillCoverage = useMemo(
    () => computeSkillCoverage(profile, selectedCareer, primaryAssessment),
    [profile, selectedCareer, primaryAssessment, selectedCareerKey],
  );

  const radarData = [
    { metric: "Core Skills", current: skillCoverage.coreMatch, target: 100 },
    { metric: "Growth Skills", current: skillCoverage.growthMatch, target: 100 },
    { metric: "Interest Fit", current: skillCoverage.interestFit, target: 100 },
  ];

  const badges = useMemo(
    () => [
      {
        title: "Career Trailblazer",
        detail: "Completed AI career quiz",
        earned: (assessments?.length ?? 0) > 0,
      },
      {
        title: "Roadmap Runner",
        detail: "Finished a weekly learning sprint",
        earned: learningProgress >= 60,
      },
      {
        title: "Mentor Linked",
        detail: "Booked a counselor session",
        earned: (sessions?.length ?? 0) > 0,
      },
      {
        title: "Opportunity Keeper",
        detail: "Saved a promising career path",
        earned: (savedCareers?.length ?? 0) > 0,
      },
      {
        title: "Goal Finisher",
        detail: "Marked a goal as completed",
        earned: goals?.some((goal) => goal.status === "completed") ?? false,
      },
    ],
    [assessments, learningProgress, sessions, savedCareers, goals],
  );

  const handleResumeAnalyze = () => {
    if (!resumeText.trim()) {
      toast.error("Paste your resume summary before analyzing.");
      return;
    }
    const report = evaluateResume(resumeText, selectedCareer);
    setResumeReport(report);
    toast.success("Resume insights generated.");
  };

  const toggleRoadmapStep = (stepId: string) => {
    setRoadmapCompletion((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const toggleLearningTask = (taskId: string) => {
    setLearningTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const handleChatSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    const outbound: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "Student",
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setChatMessages((prev) => [...prev, outbound]);
    setChatInput("");
    window.setTimeout(() => {
      const response: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "Counselor",
        content: generateCounselorReply(outbound.content),
        timestamp: new Date().toLocaleTimeString(),
      };
      setChatMessages((prev) => [...prev, response]);
    }, 900);
  };

  const currentMockQuestion = MOCK_INTERVIEW_QUESTIONS[mockQuestionIndex];

  const handleMockSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mockAnswer.trim()) {
      toast.error("Record an answer to receive feedback.");
      return;
    }
    const feedback = scoreMockAnswer(mockAnswer, currentMockQuestion.focus);
    setMockFeedback(feedback);
    toast.success("Mock interview evaluated.");
  };

  const moveToNextQuestion = () => {
    setMockQuestionIndex((prev) => (prev + 1) % MOCK_INTERVIEW_QUESTIONS.length);
    setMockAnswer("");
    setMockFeedback(null);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-primary" />
                AI Career Recommendation Engine
              </CardTitle>
              <CardDescription>
                Personalized suggestions using skills, interests, and assessment signals.
              </CardDescription>
            </div>
            <Badge variant="outline">Confidence {Math.round(primaryAssessment?.confidenceScore ?? 38)}%</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendedPaths.length ? (
              <ul className="space-y-3">
                {recommendedPaths.map((career) => (
                  <li
                    key={career}
                    className="rounded-lg border bg-card/60 p-3"
                  >
                    <p className="font-semibold">{career}</p>
                    <p className="text-sm text-muted-foreground">
                      {primaryAssessment?.summary?.includes(career)
                        ? "Aligned with your assessment narrative."
                        : "AI suggests this based on your strengths."}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Add strengths and interests to unlock precise fits.
              </p>
            )}
            <Button
              variant="secondary"
              onClick={() => toast("Recommendations refresh scheduled.")}
              className="w-full"
            >
              Refresh suggestions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Route className="h-5 w-5 text-primary" />
              Interactive Career Roadmap
            </CardTitle>
            <CardDescription>Step-by-step plan updates as you progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roadmapSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                </div>
                <Button
                  size="sm"
                  variant={roadmapCompletion[step.id] ? "default" : "outline"}
                  onClick={() => toggleRoadmapStep(step.id)}
                >
                  {roadmapCompletion[step.id] ? "Done" : "Track"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-primary" />
              Resume Analyzer
            </CardTitle>
            <CardDescription>Instant score with keyword and grammar insights.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              placeholder="Paste your resume summary or bullet points..."
              className="min-h-32"
            />
            <Button onClick={handleResumeAnalyze} className="w-full">
              Generate score
            </Button>
            {resumeReport && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                <p className="font-semibold text-lg">
                  Score: {resumeReport.score}/100
                </p>
                <p>
                  Keyword hits:{" "}
                  <span className="font-medium">
                    {resumeReport.keywordMatches.join(", ") || "None"}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Missing: {resumeReport.missingKeywords.join(", ") || "All covered 🎉"}
                </p>
                <ul className="list-disc pl-4">
                  {resumeReport.recommendations.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RadarIcon className="h-5 w-5 text-primary" />
                Skill-Gap Visualizer
              </CardTitle>
              <CardDescription>Compare readiness vs. target career.</CardDescription>
            </div>
            <Badge variant="secondary">Live</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer
              id="skill-gap-radar"
              config={{
                current: { label: "You", color: "hsl(var(--chart-1))" },
                target: { label: "Target", color: "hsl(var(--chart-2))" },
              }}
              className="h-64"
            >
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.1}
                />
                <ChartLegend />
              </RadarChart>
            </ChartContainer>
            <p className="text-sm text-muted-foreground">
              Highlighted gaps feed directly into your roadmap tasks.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Real-Time Counselor Chat
            </CardTitle>
            <CardDescription>Instant support for roadmap or college questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-60 overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-2">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-md px-3 py-2 text-sm ${
                    message.sender === "Student"
                      ? "bg-primary/10 text-primary-foreground"
                      : "bg-background border"
                  }`}
                >
                  <p className="font-semibold">{message.sender}</p>
                  <p>{message.content}</p>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={handleChatSend}>
              <Input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about courses, interviews, or colleges..."
              />
              <Button type="submit">Send</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Personalized Learning Path
            </CardTitle>
            <CardDescription>Weekly goals, streaks, and module tracking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{learningProgress}%</span>
              </div>
              <Progress value={learningProgress} className="mt-2" />
            </div>
            <ul className="space-y-2">
              {learningTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      <BookOpenCheck className="h-4 w-4 text-primary" />
                      {task.label}
                    </p>
                    <p className="text-muted-foreground capitalize text-xs">{task.type} module</p>
                  </div>
                  <Button
                    size="sm"
                    variant={task.completed ? "default" : "outline"}
                    onClick={() => toggleLearningTask(task.id)}
                  >
                    {task.completed ? "Completed" : "Mark done"}
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />
              Gamification & Rewards
            </CardTitle>
            <CardDescription>Earn badges to stay motivated.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {badges.map((badge) => (
              <div
                key={badge.title}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-semibold">{badge.title}</p>
                  <p className="text-sm text-muted-foreground">{badge.detail}</p>
                </div>
                <Badge variant={badge.earned ? "default" : "outline"}>
                  {badge.earned ? "Unlocked" : "Pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Industry Trends Dashboard
              </CardTitle>
              <CardDescription>Live signals for in-demand roles & skills.</CardDescription>
            </div>
            <Badge variant="outline">Realtime</Badge>
          </CardHeader>
          <CardContent>
            <ChartContainer
              id="industry-trends"
              config={{
                ai: { label: "AI & Data", color: "hsl(var(--chart-1))" },
                product: { label: "Product", color: "hsl(var(--chart-2))" },
                design: { label: "Design", color: "hsl(var(--chart-3))" },
              }}
              className="h-64"
            >
              <AreaChart data={INDUSTRY_SIGNAL_DATA}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <Area
                  type="monotone"
                  dataKey="ai"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="product"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="design"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.12}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Virtual Mock Interview Assistant
            </CardTitle>
            <CardDescription>AI evaluates confidence, clarity, and structure.</CardDescription>
          </div>
          <Badge variant="secondary">{currentMockQuestion.focus}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{currentMockQuestion.prompt}</p>
          <form className="space-y-3" onSubmit={handleMockSubmit}>
            <Textarea
              value={mockAnswer}
              onChange={(event) => setMockAnswer(event.target.value)}
              placeholder="Record your thoughts here..."
              required
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Evaluate answer</Button>
              <Button type="button" variant="outline" onClick={moveToNextQuestion}>
                Next question
              </Button>
            </div>
          </form>
          {mockFeedback && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <p className="font-semibold text-lg">Score: {mockFeedback.score}/100</p>
              <div>
                <p className="font-semibold text-sm">Strengths</p>
                <ul className="list-disc pl-4">
                  {mockFeedback.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm">Improvements</p>
                <ul className="list-disc pl-4">
                  {mockFeedback.improvements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function generateRoadmap(career?: Doc<"careerPaths"> | null) {
  if (!career) {
    return [
      {
        id: "baseline",
        title: "Clarify Direction",
        detail: "Complete your assessment to personalize the timeline.",
      },
      {
        id: "skills",
        title: "Skill Sprint",
        detail: "Commit to two high-impact courses this week.",
      },
      {
        id: "portfolio",
        title: "Showcase Work",
        detail: "Translate a project into a storytelling case study.",
      },
    ];
  }

  const skills = career.requiredSkills.slice(0, 2);
  const growth = career.skillsToGrow.slice(0, 2);
  return [
    {
      id: `${career._id}-audit`,
      title: `Map ${career.title} competencies`,
      detail: `Align resume bullet points with ${career.requiredSkills[0] ?? "the role"} expectations.`,
    },
    ...skills.map((skill, index) => ({
      id: `${career._id}-skill-${index}`,
      title: `Deepen ${skill}`,
      detail: `Ship a micro-project proving your ${skill} strength.`,
    })),
    ...growth.map((skill, index) => ({
      id: `${career._id}-grow-${index}`,
      title: `Future-proof with ${skill}`,
      detail: `Book a mentor session to design a ${skill} practice plan.`,
    })),
  ];
}

function generateLearningTasks(career?: Doc<"careerPaths"> | null): LearningTask[] {
  const baseSkills = career?.skillsToGrow.slice(0, 3) ?? ["Storytelling", "Systems thinking", "Networking"];
  return baseSkills.map((skill, index) => ({
    id: `${career?._id ?? "generic"}-${skill}-${index}`,
    label: `Practice ${skill} for 45 minutes`,
    type: index === 0 ? "video" : index === 1 ? "practice" : "project",
    completed: false,
  }));
}

function evaluateResume(resume: string, career?: Doc<"careerPaths"> | null): ResumeReport {
  const keywords = career ? [...career.requiredSkills, ...career.skillsToGrow] : ["impact", "ownership", "analysis"];
  const normalizedResume = resume.toLowerCase();
  const keywordMatches = keywords.filter((keyword) =>
    normalizedResume.includes(keyword.toLowerCase()),
  );
  const missingKeywords = keywords
    .filter((keyword) => !normalizedResume.includes(keyword.toLowerCase()))
    .slice(0, 5);
  const lengthScore = Math.min(40, Math.round(resume.split(/\s+/).length / 5));
  const keywordScore = keywordMatches.length * 8;
  const grammarPenalty = resume.includes("  ") ? 8 : 0;
  const score = Math.max(35, Math.min(100, 40 + lengthScore + keywordScore - grammarPenalty));
  const recommendations = [
    "Mirror keywords from the job description.",
    "Quantify achievements with numbers.",
    "Keep a consistent tense and casing.",
  ];
  if (missingKeywords.length) {
    recommendations.unshift(`Mention: ${missingKeywords.join(", ")} to match ${career?.title ?? "target"} role.`);
  }
  return { score, keywordMatches, missingKeywords, recommendations };
}

function computeSkillCoverage(
  profile?: Doc<"profiles"> | null,
  career?: Doc<"careerPaths"> | null,
  assessment?: Doc<"assessments"> | undefined,
) {
  const skills = profile?.skills ?? [];
  const interests = profile?.interests ?? [];
  const required = career?.requiredSkills ?? [];
  const growth = career?.skillsToGrow ?? [];
  const coreMatch = required.length
    ? Math.round((required.filter((skill) => skills.includes(skill)).length / required.length) * 100)
    : 45;
  const growthMatch = growth.length
    ? Math.round((growth.filter((skill) => skills.includes(skill)).length / growth.length) * 100)
    : 38;
  const interestFit = career
    ? Math.min(
        100,
        50 +
          (interests.some((interest) =>
            interest.toLowerCase().includes(career.category.toLowerCase()),
          )
            ? 30
            : 0) +
          (assessment?.interests.length ? 20 : 0),
      )
    : 50;
  return { coreMatch, growthMatch, interestFit };
}

function generateCounselorReply(prompt: string) {
  if (prompt.toLowerCase().includes("course")) {
    return "Try pairing a portfolio-ready project with a flagship course like CS50 or Meta Frontend to stay relevant.";
  }
  if (prompt.toLowerCase().includes("resume")) {
    return "Highlight impact metrics and align keywords with your target role's description.";
  }
  return "Great question! I'll drop a tailored resource pack in your inbox within the hour.";
}

function scoreMockAnswer(answer: string, focus: string): MockFeedback {
  const clarityScore = Math.min(30, Math.round(answer.split(/[.!?]/).length * 5));
  const depthScore = Math.min(40, Math.round(answer.length / 20));
  const structureScore = answer.includes("because") ? 30 : 18;
  const score = Math.min(100, clarityScore + depthScore + structureScore);
  return {
    score,
    strengths: [
      "You addressed the prompt directly.",
      focus.includes("Behavioral") ? "Good reflection on learnings." : "Clear strategic framing.",
    ],
    improvements: [
      "Add measurable outcomes to boost credibility.",
      "Close with how the lesson influences your next role.",
    ],
  };
}