import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { Briefcase, CheckCircle2, Circle, Plus, Target, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const profile = useQuery(api.profiles.getMyProfile);
  const onboardingStatus = useQuery(api.profiles.checkOnboardingStatus);
  const goals = useQuery(api.goals.list);
  const careerPaths = useQuery(api.careerPaths.list);
  const createGoal = useMutation(api.goals.create);
  const updateGoalStatus = useMutation(api.goals.updateStatus);
  const seedPaths = useMutation(api.careerPaths.seed);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  useEffect(() => {
    // Seed career paths if empty (just for demo purposes)
    if (careerPaths && careerPaths.length === 0) {
      seedPaths();
    }
  }, [careerPaths, seedPaths]);

  useEffect(() => {
    if (!authLoading && onboardingStatus && !onboardingStatus.isOnboarded) {
      navigate("/onboarding");
    }
  }, [authLoading, onboardingStatus, navigate]);

  if (authLoading) return null;

  if (!profile && !authLoading) {
    // Redirect to onboarding if no profile found (handled in main usually, but good safety)
    // For now, we'll just show a loading state or let the user navigate manually if needed
    // But ideally, we should redirect.
    // navigate("/onboarding"); 
    // Let's just return null to avoid flash
  }

  const completedGoals = goals?.filter((g) => g.status === "completed").length || 0;
  const totalGoals = goals?.length || 0;
  const progress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createGoal({
        title: formData.get("title") as string,
        category: formData.get("category") as string,
        status: "pending",
        deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week default
      });
      toast.success("Goal added!");
      setIsGoalDialogOpen(false);
    } catch (error) {
      toast.error("Failed to add goal");
    }
  };

  const toggleGoalStatus = async (id: any, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await updateGoalStatus({ id, status: newStatus });
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.headline || user?.name || "User"}</h1>
            <p className="text-muted-foreground">Here's an overview of your career progress.</p>
          </div>
          <Button onClick={() => navigate("/onboarding")} variant="outline">Edit Profile</Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedGoals}/{totalGoals}</div>
              <Progress value={progress} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Role</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">{profile?.currentRole || "Not set"}</div>
              <p className="text-xs text-muted-foreground">Target: {profile?.targetRole || "Not set"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Tracked</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.skills?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Skills in your profile</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Goals Section */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Goals</CardTitle>
                <CardDescription>Track your professional milestones</CardDescription>
              </div>
              <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Goal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Goal</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateGoal} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Goal Title</Label>
                      <Input id="title" name="title" required placeholder="e.g. Learn TypeScript" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select name="category" required defaultValue="Learning">
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
                    <Button type="submit" className="w-full">Create Goal</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals?.length === 0 && <p className="text-muted-foreground text-sm">No goals set yet.</p>}
                {goals?.map((goal) => (
                  <div key={goal._id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleGoalStatus(goal._id, goal.status)}>
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
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full text-secondary-foreground">
                      {goal.category}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Career Paths Section */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recommended Paths</CardTitle>
              <CardDescription>Based on market trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {careerPaths?.map((path) => (
                  <div key={path._id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{path.title}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{path.growthOutlook} Growth</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{path.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {path.requiredSkills.slice(0, 3).map((skill) => (
                        <span key={skill} className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                      {path.requiredSkills.length > 3 && (
                        <span className="text-xs text-muted-foreground self-center">+{path.requiredSkills.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}