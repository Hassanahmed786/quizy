
import { questionSchema, questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import OpenAI from "openai";


const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID!;

const openai = new OpenAI({
  apiKey,
  baseURL: `${endpoint}/openai/deployments/${deploymentId}`,
  defaultHeaders: {
    "api-key": apiKey,
  },
  defaultQuery: { "api-version": "2025-01-01-preview" },
});

export async function POST(req: Request) {
  const { files, questionCount, difficulty } = await req.json();
  const count = typeof questionCount === "number" && questionCount > 0 ? questionCount : 4;
  const level = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
  const base64Data = files[0].data.split(",")[1];

  // Compose the prompt for OpenAI
  const prompt = `You are a teacher. Your job is to read the following PDF (provided as base64) and create a multiple choice test (with ${count} questions) strictly based on the actual content of the PDF. Do NOT ask about PDFs in general, but only about the information, facts, or topics found inside this specific document. Each question should have four options (A, B, C, D) and only one correct answer. The exam difficulty should be '${level}'. Respond ONLY with a JSON array of questions in this format: [{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "A" }, ...]`;

  // Call Azure OpenAI using the official SDK
  const response = await openai.chat.completions.create({
    model: deploymentId,
    messages: [
      { role: "system", content: "You are a helpful and expert teacher." },
      { role: "user", content: prompt },
      { role: "user", content: `PDF (base64): ${base64Data}` },
    ],
    max_tokens: 2048,
    temperature: 0.7,
  });

  const message = response.choices[0]?.message?.content ?? "";
  // Log the raw LLM response for debugging
  console.log("Raw LLM response:", message);
  // Try to extract JSON array from the response
  let questionsArr = [];
  try {
    const jsonMatch = message.match(/\[.*\]/s);
    if (jsonMatch) {
      questionsArr = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON array found in response.");
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Could not parse OpenAI's response." }), { status: 200 });
  }

  if (!Array.isArray(questionsArr) || questionsArr.length !== count) {
    const errorMsg = `Expected ${count} questions, received ${Array.isArray(questionsArr) ? questionsArr.length : 0}`;
    console.error(errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), { status: 200 });
  }
  const res = z.array(questionSchema).length(count).safeParse(questionsArr);
  if (!res.success) {
    console.error("Zod validation error:", res.error.errors);
    return new Response(JSON.stringify({ error: res.error.errors.map((e: any) => e.message).join("\n") }), { status: 200 });
  }

  return new Response(JSON.stringify(questionsArr), {
    headers: { "Content-Type": "application/json" },
  });
}