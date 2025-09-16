import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Question } from '@/lib/schemas';

interface QuizFeedbackProps {
  questions: Question[];
  userAnswers: string[];
}

// Simple keyword/topic extraction from questions
function extractTopics(questions: Question[]): string[] {
  // This is a naive approach: extract capitalized words and unique keywords from questions
  const topics = new Set<string>();
  questions.forEach(q => {
    // Split by space, filter capitalized or long words
    q.question.split(/\s+/).forEach(word => {
      if (word.length > 3 && word[0] === word[0].toUpperCase()) {
        topics.add(word.replace(/[^a-zA-Z0-9]/g, ""));
      }
    });
  });
  return Array.from(topics);
}

export default function QuizFeedback({ questions, userAnswers }: QuizFeedbackProps) {
  const missedQuestions = questions.filter((q, i) => userAnswers[i] !== q.answer);
  const correctQuestions = questions.filter((q, i) => userAnswers[i] === q.answer);
  const topics = extractTopics(questions);
  const missedTopics = extractTopics(missedQuestions);
  const masteredTopics = extractTopics(correctQuestions);
  const topicsLeft = topics.filter(t => !masteredTopics.includes(t));

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Personalized Review & Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {missedQuestions.length === 0 ? (
          <div className="text-green-600 font-semibold text-lg">Excellent! You answered all questions correctly. Keep up the great work!</div>
        ) : (
          <>
            <div className="mb-4 text-yellow-700 dark:text-yellow-300 font-medium">
              You missed {missedQuestions.length} question{missedQuestions.length > 1 ? 's' : ''}. Review these topics:
            </div>
            <ul className="list-disc ml-6 mb-4">
              {missedQuestions.map((q, i) => (
                <li key={i} className="mb-1">{q.question}</li>
              ))}
            </ul>
            {missedTopics.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold">Areas to improve:</span> {missedTopics.join(", ")}
              </div>
            )}
          </>
        )}
        {topicsLeft.length > 0 && (
          <div className="mt-4">
            <span className="font-semibold">Topics left to master:</span> {topicsLeft.join(", ")}
          </div>
        )}
        {topicsLeft.length === 0 && missedQuestions.length > 0 && (
          <div className="mt-4 text-blue-600">You have attempted all major topics in this quiz. Review the missed questions above for improvement.</div>
        )}
      </CardContent>
    </Card>
  );
}
