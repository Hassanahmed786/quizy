"use server";

// Removed Gemini/Google import
import OpenAI from "openai";
import { z } from "zod";


export const generateQuizTitle = async (file: string) => {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
  if (!apiKey || !endpoint || !deploymentId) {
    throw new Error("Missing Azure OpenAI environment variables.");
  }
  const openai = new OpenAI({
    apiKey,
    baseURL: `${endpoint}/openai/deployments/${deploymentId}`,
    defaultHeaders: {
      "api-key": apiKey,
    },
    defaultQuery: { "api-version": "2025-01-01-preview" },
  });
  const response = await openai.chat.completions.create({
    model: deploymentId,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: `Generate a max three word title for a quiz based on the file name: ${file}` },
    ],
    max_tokens: 10,
    temperature: 0.7,
  });
  return response.choices?.[0]?.message?.content?.trim() || "Quiz";
};
