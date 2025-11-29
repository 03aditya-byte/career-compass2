import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Target, TrendingUp, Users, Brain, FlaskConical, MessageSquare, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

type InnovationHighlight = {
  title: string;
  description: string;
  metric: string;
  badge: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const innovationHighlights: InnovationHighlight[] = [
  {
    title: "AI Mentor Pairing",
    description: "Our matcher blends your interests with mentor signals to tee up a focus-ready session in under a minute.",
    metric: "Match <60s",
    badge: "Mentor Graph",
    icon: Brain,
  },
  {
    title: "Micro-Experiment Lab",
    description: "Launch guided 72-hour experiments that turn assessments into measurable portfolio wins.",
    metric: "Fresh weekly",
    badge: "Innovation Hub",
    icon: FlaskConical,
  },
  {
    title: "CompassCare Copilot",
    description: "An on-page copilot that routes you to the right feature, drops reminders, and unblocks next steps 24/7.",
    metric: "Live support",
    badge: "CompassCare",
    icon: MessageSquare,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Compass className="h-6 w-6" />
            <span>Career Compass</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            >
              Navigate Your Career with <span className="text-primary">Confidence</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl text-muted-foreground mb-8"
            >
              Discover your path, set meaningful goals, and track your professional growth with our AI-powered career guidance platform.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="gap-2" onClick={() => navigate("/auth")}>
                Start Your Journey <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Grow</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to help you make informed decisions about your professional future.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Target className="h-10 w-10 text-primary" />}
              title="Goal Tracking"
              description="Set and monitor professional milestones with our intuitive goal tracking system."
            />
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-primary" />}
              title="Career Paths"
              description="Explore detailed career trajectories, salary insights, and required skills for various roles."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Skill Assessment"
              description="Identify your strengths and gaps to build a personalized learning roadmap."
            />
          </div>
        </div>
      </section>

      {/* Innovation Highlights Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Working Innovation Stack
              </div>
              <h2 className="text-3xl font-bold">Ship experiments, activate mentors, stay supported.</h2>
              <p className="text-muted-foreground">
                These live capabilities power Career Compass today—each one unlocks inside the dashboard so you move from plans to proof quickly.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Live telemetry</span>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border px-3 py-1">Realtime mentor graph</span>
                <span className="rounded-full border px-3 py-1">AI co-pilot</span>
                <span className="rounded-full border px-3 py-1">Micro-sprint engine</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {innovationHighlights.map((highlight) => (
              <InnovationHighlightCard key={highlight.title} {...highlight} onAction={() => navigate("/auth")} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Shape Your Future?</h2>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                Join thousands of professionals who are taking control of their career paths today.
              </p>
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
                Create Free Account
              </Button>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Career Compass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-card p-6 rounded-xl border shadow-sm"
    >
      <div className="mb-4 bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function InnovationHighlightCard({
  icon: Icon,
  title,
  description,
  metric,
  badge,
  onAction,
}: InnovationHighlight & { onAction: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="flex h-full flex-col rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{badge}</p>
            <h3 className="text-xl font-semibold">{title}</h3>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{metric}</span>
      </div>
      <p className="mt-4 flex-1 text-muted-foreground">{description}</p>
      <Button variant="link" className="mt-4 px-0" onClick={onAction}>
        Try it now <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}