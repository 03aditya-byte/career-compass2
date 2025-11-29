import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profiles.updateProfile);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    headline: "",
    currentRole: "",
    targetRole: "",
    experienceYears: 0,
    bio: "",
    skills: "",
    interests: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        headline: formData.headline,
        currentRole: formData.currentRole,
        targetRole: formData.targetRole,
        experienceYears: Number(formData.experienceYears),
        bio: formData.bio,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        interests: formData.interests.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Profile created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Welcome to Career Compass</CardTitle>
          <CardDescription>Let's set up your profile to get personalized recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  name="headline"
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.headline}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentRole">Current Role</Label>
                  <Input
                    id="currentRole"
                    name="currentRole"
                    placeholder="Software Engineer"
                    value={formData.currentRole}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role</Label>
                <Input
                  id="targetRole"
                  name="targetRole"
                  placeholder="e.g. Engineering Manager"
                  value={formData.targetRole}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Textarea
                  id="skills"
                  name="skills"
                  placeholder="React, Node.js, Leadership..."
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interests">Professional Interests (comma separated)</Label>
                <Textarea
                  id="interests"
                  name="interests"
                  placeholder="AI, Mentorship, Startups..."
                  value={formData.interests}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Tell us a bit about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => Math.min(3, s + 1))}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
