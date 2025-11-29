import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  id: number;
  role: "assistant" | "user";
  content: string;
};

const knowledgeBase = [
  {
    matcher: /mentor|session|coach/i,
    response:
      "Mentor slots live inside Mentor Connect. Book a time, set a focus goal, and drop a recap afterwards so progress stays visible.",
  },
  {
    matcher: /goal|focus|priority/i,
    response:
      "Stack-rank goals by impact × energy. Pick one weekly \"needle mover\" and log a micro-win each day to stay accountable.",
  },
  {
    matcher: /assessment|skill|strength/i,
    response:
      "Turn each assessment insight into a 30-minute skill sprint. Capture what you practiced and map it back to your chosen career path.",
  },
  {
    matcher: /feedback|support|help/i,
    response:
      "Share feedback in the panel below—everything routes straight to the team and keeps Compass evolving around you.",
  },
];

const quickPrompts = [
  "How do I prep for a mentor session?",
  "What should I focus on this week?",
  "How do I use my assessment insights?",
];

const defaultResponse =
  "I’m CompassCare, your in-app support buddy. Ask about goals, mentors, assessments, or how to get unstuck and I’ll guide you.";

const getBotResponse = (message: string) => {
  const hit = knowledgeBase.find((entry) => entry.matcher.test(message));
  return hit?.response ?? defaultResponse;
};

export function SupportChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Need help? I can explain features, unblock goals, or guide you to a mentor—ask away!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const processMessage = (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: trimmed },
    ]);
    setIsThinking(true);

    const reply = getBotResponse(trimmed);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "assistant", content: reply },
      ]);
      setIsThinking(false);
    }, 600);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) return;
    const outbound = input.trim();
    setInput("");
    processMessage(outbound);
  };

  const handleQuickPrompt = (prompt: string) => {
    processMessage(prompt);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <CardTitle>CompassCare Chat</CardTitle>
        </div>
        <CardDescription>Your instant support copilot.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div ref={scrollRef} className="flex h-64 flex-col gap-3 overflow-y-auto pr-1">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-2 text-sm ${
                message.role === "assistant"
                  ? "justify-start"
                  : "justify-end text-right"
              }`}
            >
              {message.role === "assistant" && (
                <span className="rounded-full bg-primary/10 p-1">
                  <Bot className="h-4 w-4 text-primary" />
                </span>
              )}
              <span
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                  message.role === "assistant"
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </span>
              {message.role === "user" && (
                <span className="rounded-full bg-primary/10 p-1">
                  <User className="h-4 w-4 text-primary" />
                </span>
              )}
            </motion.div>
          ))}
          {isThinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Drafting a response…
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Badge
              key={prompt}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleQuickPrompt(prompt)}
            >
              {prompt}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask me anything about Career Compass..."
            rows={2}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Powered by curated Compass playbooks
            </div>
            <Button type="submit" size="sm" disabled={isThinking}>
              {isThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
