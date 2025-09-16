
import { NextRequest } from "next/server";
import { z } from "zod";
import { questionSchema } from "@/lib/schemas";
import OpenAI from "openai";

const reviewSchema = z.object({
  review: z.string(),
  recommendations: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { questions, userAnswers } = await req.json();
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
    if (!apiKey || !endpoint || !deploymentId) {
      return new Response(JSON.stringify({ error: "Missing Azure OpenAI environment variables." }), { status: 500 });
    }
    const openai = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${deploymentId}`,
      defaultHeaders: {
        "api-key": apiKey,
      },
      defaultQuery: { "api-version": "2025-01-01-preview" },
    });
    const prompt = `You are an expert tutor. Given the following multiple-choice questions, the user's answers, and the correct answers, provide a personalized review of the user's performance. Highlight areas for improvement and recommend what the user should learn next. Be specific and encouraging.\n\nQuestions and Answers:\n${questions.map((q: any, i: number) => `Q${i+1}: ${q.question}\nOptions: ${q.options.join(" | ")}\nCorrect: ${q.answer}\nUser: ${userAnswers[i] || "No answer"}`).join("\n\n")}\n\nRespond ONLY with a valid JSON object in this format and nothing else: {\n  review: "...",\n  recommendations: "..."\n}`;
    const response = await openai.chat.completions.create({
      model: deploymentId,
      messages: [
        { role: "system", content: "You are a helpful and expert tutor." },
        { role: "user", content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });
    const message = response.choices[0]?.message?.content ?? "";
    // Log the raw LLM response for debugging
    console.log("Raw LLM review response:", message);
    let reviewObj = null;
    try {
      const jsonMatch = message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewObj = JSON.parse(jsonMatch[0]);
      } else {
        reviewObj = { review: "Could not parse OpenAI's response.", recommendations: "Try again." };
      }
    } catch {
      reviewObj = { review: "Could not parse OpenAI's response.", recommendations: "Try again." };
    }
    const parsed = reviewSchema.safeParse(reviewObj);
    if (!parsed.success) {
      return new Response(JSON.stringify({ review: "Could not parse OpenAI's response.", recommendations: "Try again." }), { status: 200 });
    }
    return new Response(JSON.stringify(parsed.data), { status: 200 });
  } catch (err: any) {
    console.error("Quiz review error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), { status: 500 });
  }
}
