import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Calendar,
  CheckCircle2,
  Circle,
  MessageSquare,
  Plus,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";

type DashboardProps = {
  defaultSection?: "overview" | "careers" | "assessment" | "mentors";
};

export default function Dashboard({ defaultSection }: DashboardProps = {}) {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const profile = useQuery(api.profiles.getMyProfile);
  const onboardingStatus = useQuery(api.profiles.checkOnboardingStatus);
  const goals = useQuery(api.goals.list);
  const careerPaths = useQuery(api.careerPaths.list);
  const categories = useQuery(api.careerPaths.listCategories);
  const savedCareers = useQuery(api.careerPaths.listSaved);
  const counselors = useQuery(api.mentorship.listCounselors);
  const sessions = useQuery(api.mentorship.listSessions);
  const assessments = useQuery(api.assessments.list);

  const createGoal = useMutation(api.goals.create);
  const updateGoalStatus = useMutation(api.goals.updateStatus);
  const seedPaths = useMutation(api.careerPaths.seed);
  const toggleSave = useMutation(api.careerPaths.toggleSave);
  const seedCounselors = useMutation(api.mentorship.seed);
  const bookSession = useMutation(api.mentorship.bookSession);
  const submitAssessment = useMutation(api.assessments.submit);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPathId, setSelectedPathId] = useState<Id<"careerPaths"> | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({ interests: "", strengths: "", focusAreas: "" });
  const [sessionForm, setSessionForm] = useState({ counselorId: "", sessionDate: "", goal: "" });
  const [isAssessmentSubmitting, setIsAssessmentSubmitting] = useState(false);
  const [isBookingSession, setIsBookingSession] = useState(false);

  const overviewRef = useRef<HTMLDivElement>(null);
  const careersRef = useRef<HTMLDivElement>(null);
  const assessmentRef = useRef<HTMLDivElement>(null);
  const mentorsRef = useRef<HTMLDivElement>(null);

  const savedCareerIds = useMemo(
    () => new Set(savedCareers?.map((entry) => entry.career._id)),
    [savedCareers],
  );

  useEffect(() => {
    if (!defaultSection) return;
    const sectionMap = {
      overview: overviewRef,
      careers: careersRef,
      assessment: assessmentRef,
      mentors: mentorsRef,
    } as const;
    const target = sectionMap[defaultSection];
    if (target?.current) {
      target.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [defaultSection]);

  useEffect(() => {
    if (careerPaths && careerPaths.length === 0) {
      seedPaths();
    }
  }, [careerPaths, seedPaths]);

  useEffect(() => {
    if (counselors && counselors.length === 0) {
      seedCounselors();
    }
  }, [counselors, seedCounselors]);

  useEffect(() => {
    if (!sessionForm.counselorId && counselors && counselors.length > 0) {
      setSessionForm((prev) => ({ ...prev, counselorId: counselors[0]._id }));
    }
  }, [counselors, sessionForm.counselorId]);

  useEffect(() => {
    if (careerPaths && careerPaths.length > 0 && !selectedPathId) {
      setSelectedPathId(careerPaths[0]._id);
    }
  }, [careerPaths, selectedPathId]);

  useEffect(() => {
    if (!authLoading && onboardingStatus && !onboardingStatus.isOnboarded) {
      navigate("/onboarding");
    }
  }, [authLoading, onboardingStatus, navigate]);

  if (authLoading) return null;

  const completedGoals = goals?.filter((goal) => goal.status === "completed").length || 0;
  const totalGoals = goals?.length || 0;
  const goalProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const filteredCareers =
    careerPaths?.filter((career) => selectedCategory === "All" || career.category === selectedCategory) ?? [];
  const selectedCareer = careerPaths?.find((career) => career._id === selectedPathId);
  const latestAssessment = assessments?.[0];

  const insightText = selectedCareer
    ? `Sharpen ${selectedCareer.skillsToGrow[0]} to unlock faster growth in ${selectedCareer.title}.`
    : "Select a career path to unlock personalized insights.";
  const assessmentCallout = latestAssessment
    ? `Your latest assessment suggests ${latestAssessment.recommendedCareers.join(", ")} with ${
        latestAssessment.confidenceScore
      }% confidence.`
    : "Complete the assessment to receive curated recommendations.";

  const sanitizeList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const handleAssessmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const interests = sanitizeList(assessmentForm.interests);
    const strengths = sanitizeList(assessmentForm.strengths);
    const focusAreas = sanitizeList(assessmentForm.focusAreas);

    if (interests.length === 0 || strengths.length === 0) {
      toast.error("Add at least one interest and one strength.");
      return;
    }

    setIsAssessmentSubmitting(true);
    try {
      await submitAssessment({ interests, strengths, focusAreas });
      toast.success("Assessment saved successfully!");
      setAssessmentForm({ interests: "", strengths: "", focusAreas: "" });
    } catch (error) {
      console.error(error);
      toast.error("Unable to save assessment.");
    } finally {
      setIsAssessmentSubmitting(false);
    }
  };

  const handleSessionBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionForm.counselorId || !sessionForm.sessionDate) {
      toast.error("Pick a counselor and time.");
      return;
    }
    setIsBookingSession(true);
    try {
      await bookSession({
        counselorId: sessionForm.counselorId as Id<"counselors">,
        sessionDate: new Date(sessionForm.sessionDate).getTime(),
        goal: sessionForm.goal,
      });
      toast.success("Session scheduled!");
      setSessionForm((prev) => ({ ...prev, sessionDate: "", goal: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setIsBookingSession(false);
    }
  };

  const handleCreateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await createGoal({
        title: data.get("title") as string,
        category: data.get("category") as string,
        status: "pending",
        deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
        description: "",
      });
      toast.success("Goal added!");
      setIsGoalDialogOpen(false);
    } catch {
      toast.error("Failed to add goal");
    }
  };

  const handleGoalToggle = async (id: Id<"goals">, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateGoalStatus({ id, status: nextStatus as "pending" | "in_progress" | "completed" });
  };

  const handleSaveCareer = async (careerId: Id<"careerPaths">) => {
    try {
      const result = await toggleSave({ careerPathId: careerId });
      toast.success(result.status === "saved" ? "Career saved!" : "Career removed.");
    } catch {
      toast.error("Unable to update saved career.");
    }
  };

  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <section ref={overviewRef} className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {profile?.headline || user?.name || "Explorer"}
              </h1>
              <p className="text-muted-foreground">
                Track goals, explore paths, and book a mentor in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/profile")}>
                Edit Profile
              </Button>
              <Button onClick={() => navigate("/assessment")}>Assessment Hub</Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completedGoals}/{totalGoals}
                </div>
                <Progress value={goalProgress} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Role</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">{profile?.currentRole || "Not set"}</div>
                <p className="text-xs text-muted-foreground">Target: {profile?.targetRole || "Define your goal"}</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-primary" /> Compass Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{insightText}</p>
              </CardContent>
              <motion.div
                className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-primary to-secondary"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </Card>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Goals</CardTitle>
                <CardDescription>Keep momentum across your milestones.</CardDescription>
              </div>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" /> Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Goal</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleCreateGoal}>
                    <div className="space-y-2">
                      <Label htmlFor="title">Goal Title</Label>
                      <Input id="title" name="title" required placeholder="Ship a portfolio case study" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" defaultValue="Learning" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Learning">Learning</SelectItem>
                          <SelectItem value="Career">Career</SelectItem>
                          <SelectItem value="Networking">Networking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">
                      Save Goal
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals?.length === 0 && <p className="text-muted-foreground text-sm">No goals yet.</p>}
              {goals?.map((goal) => (
                <div
                  key={goal._id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/40"
                >
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleGoalToggle(goal._id, goal.status)}>
                      {goal.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <span className={goal.status === "completed" ? "line-through text-muted-foreground" : ""}>
                      {goal.title}
                    </span>
                  </div>
                  <Badge variant="secondary">{goal.category}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card ref={overviewRef}>
            <CardHeader>
              <CardTitle>Saved Careers & Sessions</CardTitle>
              <CardDescription>Quick access to what matters now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <BookmarkCheck className="h-4 w-4 text-primary" /> Saved Careers
                </p>
                <div className="mt-2 space-y-2">
                  {savedCareers?.length ? (
                    savedCareers.map((entry) => (
                      <div key={entry.savedCareerId} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <p className="font-medium">{entry.career.title}</p>
                          <p className="text-xs text-muted-foreground">{entry.career.category}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveCareer(entry.career._id)}
                          title="Remove"
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No saved careers yet.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Sessions
                </p>
                <div className="mt-2 space-y-2">
                  {sessions?.length ? (
                    sessions.slice(0, 2).map((item) => (
                      <div key={item.session._id} className="rounded-md border p-2">
                        <p className="font-medium">{item.counselor?.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.session.sessionDate)}</p>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {item.session.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No sessions booked yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section ref={careersRef} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Career Explorer</h2>
              <p className="text-muted-foreground text-sm">Browse curated paths with live skill gaps.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === "All" ? "default" : "outline"}
                onClick={() => setSelectedCategory("All")}
              >
                All
              </Button>
              {categories?.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardContent className="space-y-4 pt-6">
                {filteredCareers.map((career) => {
                  const isSaved = savedCareerIds.has(career._id);
                  return (
                    <div
                      key={career._id}
                      className={`rounded-lg border p-4 transition hover:border-primary ${
                        selectedPathId === career._id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{career.title}</h3>
                          <p className="text-sm text-muted-foreground">{career.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleSaveCareer(career._id)}>
                            {isSaved ? (
                              <BookmarkCheck className="h-4 w-4 text-primary" />
                            ) : (
                              <Bookmark className="h-4 w-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedPathId(career._id)}>
                            Details
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {career.requiredSkills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card id="career-spotlight">
              <CardHeader>
                <CardTitle>Career Spotlight</CardTitle>
                <CardDescription>Deep dive into the role you selected.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCareer ? (
                  <>
                    <div>
                      <p className="text-lg font-semibold">{selectedCareer.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedCareer.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{selectedCareer.description}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">Growth Outlook</p>
                      <Badge variant="outline">{selectedCareer.growthOutlook}</Badge>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">Skills to Grow</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCareer.skillsToGrow.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">Estimated Salary</p>
                      <p className="text-muted-foreground">{selectedCareer.estimatedSalary}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Select a career to view insights.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section ref={assessmentRef} className="grid gap-6 md:grid-cols-2">
          <Card id="assessment">
            <CardHeader>
              <CardTitle>Career Assessment</CardTitle>
              <CardDescription>Describe your interests to unlock guidance.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAssessmentSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests (comma separated)</Label>
                  <Textarea
                    id="interests"
                    value={assessmentForm.interests}
                    onChange={(e) => setAssessmentForm((prev) => ({ ...prev, interests: e.target.value }))}
                    placeholder="AI research, People leadership, Social impact"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strengths">Strengths (comma separated)</Label>
                  <Textarea
                    id="strengths"
                    value={assessmentForm.strengths}
                    onChange={(e) => setAssessmentForm((prev) => ({ ...prev, strengths: e.target.value }))}
                    placeholder="Data storytelling, React, Facilitation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="focusAreas">Focus Areas (comma separated)</Label>
                  <Textarea
                    id="focusAreas"
                    value={assessmentForm.focusAreas}
                    onChange={(e) => setAssessmentForm((prev) => ({ ...prev, focusAreas: e.target.value }))}
                    placeholder="Leadership, System design"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isAssessmentSubmitting}>
                  {isAssessmentSubmitting ? "Analyzing..." : "Save Assessment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Insights</CardTitle>
              <CardDescription>{assessmentCallout}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assessments?.length ? (
                assessments.map((assessment) => (
                  <div key={assessment._id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Confidence: {Math.round(assessment.confidenceScore)}%
                      </p>
                      <Badge variant="outline">{new Date(assessment._creationTime).toLocaleDateString()}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{assessment.summary}</p>
                    {assessment.recommendedCareers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {assessment.recommendedCareers.map((career) => (
                          <Badge key={career} variant="secondary">
                            {career}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Complete your first assessment to view insights.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <section ref={mentorsRef} className="grid gap-6 md:grid-cols-2" id="mentors">
          <Card>
            <CardHeader>
              <CardTitle>Mentor Connect</CardTitle>
              <CardDescription>Pair up with seasoned counsellors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {counselors?.map((counselor) => (
                  <div key={counselor._id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{counselor.name}</p>
                        <p className="text-xs text-muted-foreground">{counselor.specialization}</p>
                      </div>
                      <Badge variant="outline">{counselor.rating.toFixed(1)} ★</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{counselor.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {counselor.focusAreas.map((area) => (
                        <Badge key={area} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <form className="space-y-3" onSubmit={handleSessionBooking}>
                <div className="space-y-1">
                  <Label>Choose Counselor</Label>
                  <Select
                    value={sessionForm.counselorId}
                    onValueChange={(value) => setSessionForm((prev) => ({ ...prev, counselorId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {counselors?.map((counselor) => (
                        <SelectItem key={counselor._id} value={counselor._id}>
                          {counselor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Session Date</Label>
                  <Input
                    type="datetime-local"
                    value={sessionForm.sessionDate}
                    onChange={(e) => setSessionForm((prev) => ({ ...prev, sessionDate: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Focus Goal</Label>
                  <Textarea
                    placeholder="Portfolio review, interview prep, etc."
                    value={sessionForm.goal}
                    onChange={(e) => setSessionForm((prev) => ({ ...prev, goal: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isBookingSession}>
                  {isBookingSession ? "Scheduling..." : "Book Session"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming & Past Sessions</CardTitle>
              <CardDescription>Track engagement with your mentors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions?.length ? (
                sessions.map((entry) => (
                  <div key={entry.session._id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{entry.counselor?.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.session.goal}</p>
                      </div>
                      <Badge
                        variant={entry.session.status === "scheduled" ? "default" : "outline"}
                        className="capitalize"
                      >
                        {entry.session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.session.sessionDate)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sessions booked yet.</p>
              )}
            </CardContent>
          </Card>
        </section>

        {user?.role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Pulse</CardTitle>
              <CardDescription>Monitor platform health at a glance.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground uppercase">Career Tracks</p>
                <p className="text-2xl font-bold">{careerPaths?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Live resources</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground uppercase">Mentors</p>
                <p className="text-2xl font-bold">{counselors?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Active counsellors</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground uppercase">Sessions</p>
                <p className="text-2xl font-bold">{sessions?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Tracked engagements</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}