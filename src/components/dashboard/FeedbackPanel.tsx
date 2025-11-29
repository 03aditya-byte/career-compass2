import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Star, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const moodOptions = [
  { label: "Energized", value: "energized" },
  { label: "Curious", value: "curious" },
  { label: "Stuck", value: "stuck" },
];

const categoryOptions = [
  { label: "Product Experience", value: "product" },
  { label: "Mentorship", value: "mentorship" },
  { label: "Assessments", value: "assessments" },
];

type FeedbackFormState = {
  rating: number;
  mood: string;
  category: string;
  message: string;
};

export function FeedbackPanel() {
  const feedbackEntries = useQuery(api.feedback.listMine);
  const submitFeedback = useMutation(api.feedback.submit);
  const [formState, setFormState] = useState<FeedbackFormState>({
    rating: 4,
    mood: moodOptions[0].value,
    category: categoryOptions[0].value,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const entries = feedbackEntries ?? [];
  const averageRating = useMemo(() => {
    if (entries.length === 0) return null;
    const sum = entries.reduce((acc, entry) => acc + entry.rating, 0);
    return Number((sum / entries.length).toFixed(1));
  }, [entries]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formState.message.trim().length < 10) {
      toast.error("Share at least 10 characters so we can act on it.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        rating: formState.rating,
        mood: formState.mood,
        category: formState.category,
        message: formState.message.trim(),
      });
      toast.success("Thanks for the insight—Team Compass is on it!");
      setFormState((prev) => ({ ...prev, message: "" }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save feedback.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Feedback Loop</CardTitle>
        <CardDescription>
          Drop product thoughts and see your recent submissions.
        </CardDescription>
        {averageRating !== null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            {averageRating}/5 avg from your latest {entries.length} note
            {entries.length === 1 ? "" : "s"}.
          </div>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              How’s the experience feeling?
            </p>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const isActive = value <= formState.rating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, rating: value }))
                    }
                    className="transition hover:scale-105"
                    aria-label={`Set rating to ${value}`}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        isActive
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Mood</p>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={
                    formState.mood === option.value ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormState((prev) => ({ ...prev, mood: option.value }))
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              What area are you talking about?
            </p>
            <Select
              value={formState.category}
              onValueChange={(value) =>
                setFormState((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Tell us what’s working, what’s confusing, or what you’d dream up next."
            value={formState.message}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, message: event.target.value }))
            }
            rows={4}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || formState.message.trim().length < 10}
          >
            {isSubmitting ? "Sending..." : "Send feedback"}
          </Button>
          <div className="w-full space-y-2">
            <p className="text-sm font-semibold">Recent submissions</p>
            <div className="space-y-2">
              {entries.length ? (
                entries.map((entry) => (
                  <div
                    key={entry._id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-primary">
                        {Array.from({ length: entry.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="h-3 w-3 fill-primary text-primary"
                          />
                        ))}
                      </div>
                      <Badge variant="outline">{entry.category}</Badge>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      {entry.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground capitalize">
                      {entry.mood}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No feedback yet—share your first note above.
                </p>
              )}
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
