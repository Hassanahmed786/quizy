import { useState } from "react";
import { Question } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OpenAIReviewProps {
  questions: Question[];
  userAnswers: string[];
}

export default function OpenAIReview({ questions, userAnswers }: OpenAIReviewProps) {
  const [review, setReview] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetReview = async () => {
    setLoading(true);
    setError(null);
    setReview(null);
    setRecommendations(null);
    try {
      const res = await fetch("/api/quiz-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, userAnswers }),
      });
      const data = await res.json();
      setReview(data.review);
      setRecommendations(data.recommendations);
    } catch (e) {
      setError("Failed to get review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">OpenAI Personalized Review</CardTitle>
      </CardHeader>
      <CardContent>
        {review ? (
          <>
            <div className="mb-4">
              <span className="font-semibold">Review:</span>
              <div className="mt-1 whitespace-pre-line">{review}</div>
            </div>
            <div>
              <span className="font-semibold">Recommendations:</span>
              <div className="mt-1 whitespace-pre-line">{recommendations}</div>
            </div>
          </>
        ) : (
          <Button onClick={handleGetReview} disabled={loading} className="mt-2">
            {loading ? "Generating Review..." : "Get OpenAI Personalized Review"}
          </Button>
        )}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </CardContent>
    </Card>
  );
}
