import { questionSchema, questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { files, questionCount } = await req.json();
  const count = typeof questionCount === "number" && questionCount > 0 ? questionCount : 4;
  const base64Data = files[0].data.split(",")[1];

  const result = await generateObject({
    model: google("gemini-1.5-flash-latest"),
    messages: [
      {
        role: "system",
        content:
          `You are a teacher. Your job is to take a document, and create a multiple choice test (with ${count} questions) based on the content of the document. Each option should be roughly equal in length.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Create a multiple choice test with ${count} questions based on this document.`,
          },
          {
            type: "image",
            image: base64Data,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: z.array(questionSchema),
  });

  console.log("[DEBUG] Raw AI response:", JSON.stringify(result.object, null, 2));
  if (!Array.isArray(result.object) || result.object.length !== count) {
    throw new Error(`Expected ${count} questions, received ${Array.isArray(result.object) ? result.object.length : 0}`);
  }
  const res = z.array(questionSchema).length(count).safeParse(result.object);
  if (res.error) {
    console.error("Zod validation error:", res.error.errors);
    throw new Error(res.error.errors.map((e: any) => e.message).join("\n"));
  }

  return new Response(JSON.stringify(result.object), {
    headers: { "Content-Type": "application/json" },
  });
}