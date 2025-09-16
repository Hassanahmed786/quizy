"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2, BookText, Lightbulb, GraduationCap } from "lucide-react"; // Added new icons
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Quiz from "@/components/quiz";
import { Link } from "@/components/ui/link";
import { generateQuizTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(4); // Default to 4 questions
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>(
    [],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();

  const {
    submit,
    object: partialQuestions,
    isLoading,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: undefined,
    onError: async (error) => {
      let message = "Failed to generate quiz. Please try again.";
      if (error && typeof error === "object") {
        if ("message" in error && (error as any).message) {
          message = (error as any).message;
        } else if ("response" in error && (error as any).response) {
          try {
            const res = (error as any).response;
            if (typeof res.text === "function") {
              const text = await res.text();
              if (text) message = text;
            } else if (typeof res.json === "function") {
              const json = await res.json();
              if (json && json.message) message = json.message;
            }
          } catch {}
        }
      }
      toast.error(message);
      setFiles([]);
    },
    onFinish: ({ object }) => {
      console.log("[DEBUG] onFinish received object:", object);
      setQuestions(object ?? []);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024,
    ); // 5MB limit

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Only PDF files under 5MB are allowed.");
    }

    setFiles(validFiles);
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please upload a PDF file.");
      return;
    }

    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      })),
    );
    submit({ files: encodedFiles, questionCount }); // Pass questionCount to the API route
    const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
    setTitle(generatedTitle);
  };

  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
    setQuestionCount(4); // Reset question count
  };

  const progress = partialQuestions
    ? (partialQuestions.length / questionCount) * 100
    : 0;

  const validQuestions = questions.filter(
    (q) => q && typeof q.question === "string",
  );

  // If questions are generated and match the requested count, show the quiz
  if (validQuestions.length === questionCount) {
    console.log("[DEBUG] Rendering Quiz with questions:", validQuestions);
    return (
      <Quiz
        title={title ?? "Generated Quiz"} // Default title for the quiz
        questions={validQuestions}
        clearPDF={clearPDF}
      />
    );
  }

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8" // Adjusted for better layout
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      {/* Background Video Placeholder */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950 opacity-90" />
        {/* Replace the div above with your video tag: */}
        {/* <video src="/your-video.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover opacity-70" /> */}
      </div>

      {/* Dragging Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/90 h-dvh w-dvw z-10 justify-center items-center flex flex-col gap-1 bg-zinc-100/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-2xl font-semibold text-white">
              Drop your PDF here
            </div>
            <div className="text-lg text-zinc-400">
              {"(PDFs under 5MB only)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl space-y-12 z-0" // Increased max-width for more content
      >
        {/* Hero Section */}
        <div className="text-center space-y-4 mt-12 mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
            Welcome to <span className="text-primary-foreground">Quizy</span>!
          </h1>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Transform any PDF into an interactive, engaging quiz in seconds, powered by cutting-edge AI.
            Learning made effortless and fun.
          </p>
        </div>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <FileUp className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-xl text-white">Instant Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-300">
                Effortlessly upload your PDF documents. We handle the rest.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <Lightbulb className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-xl text-white">Smart Quiz Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-300">
                Our AI analyzes your content to create relevant, multiple-choice questions.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader>
              <GraduationCap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-xl text-white">Interactive Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-300">
                Engage with your material through dynamic quizzes designed for retention.
              </CardDescription>
            </CardContent>
          </Card>
        </section>

        {/* Quiz Generator Card */}
        <Card className="glass-card w-full max-w-lg mx-auto border-0 sm:border"> {/* Centered and slightly wider */}
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
              <div className="rounded-full bg-primary/10 p-3">
                <FileUp className="h-7 w-7" />
              </div>
              <Plus className="h-5 w-5" />
              <div className="rounded-full bg-primary/10 p-3">
                <Loader2 className="h-7 w-7" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold text-white">
                Generate Your Quiz
              </CardTitle>
              <CardDescription className="text-base text-zinc-300">
                Upload a PDF file and let Quizy create questions based on its content.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitWithFiles} className="space-y-6"> {/* Increased spacing */}
              <div
                className={`relative flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 transition-colors duration-200 ${
                  files.length > 0
                    ? "border-primary-foreground text-primary-foreground"
                    : "hover:border-primary/50 text-muted-foreground"
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                <FileUp className="h-10 w-10 mb-3" />
                <p className="text-md text-center">
                  {files.length > 0 ? (
                    <span className="font-medium text-white">
                      {files[0].name}
                    </span>
                  ) : (
                    <span className="text-zinc-400">
                      Drag & Drop your PDF here or{" "}
                      <span className="text-primary-foreground font-medium cursor-pointer">
                        click to browse
                      </span>
                      .
                    </span>
                  )}
                </p>
                {files.length === 0 && (
                    <p className="text-sm text-zinc-500 mt-2">Max 5MB PDF file.</p>
                )}
              </div>

              {/* Number of Questions Input */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="questionCount"
                  className="text-sm font-medium text-white"
                >
                  Number of Questions (1-20):
                </label>
                <input
                  id="questionCount"
                  type="number"
                  min={1}
                  max={20}
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(Math.max(1, Math.min(20, Number(e.target.value)))) // Clamped input
                  }
                  className="w-full rounded-md px-4 py-2 bg-zinc-700/50 border border-zinc-600 text-white focus:ring-2 focus:ring-primary-foreground focus:border-transparent transition-colors"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full py-3 text-lg font-semibold bg-primary-foreground hover:bg-primary-foreground/90 transition-colors duration-200"
                disabled={files.length === 0 || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating Quiz...</span>
                  </span>
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            </form>
          </CardContent>
          {isLoading && (
            <CardFooter className="flex flex-col space-y-4">
              <div className="w-full space-y-1">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-zinc-700 [&>*]:bg-primary-foreground" />
              </div>
              <div className="w-full space-y-2">
                <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      isLoading ? "bg-yellow-500/70 animate-pulse" : "bg-muted"
                    }`}
                  />
                  <span className="text-zinc-400 text-center col-span-4 sm:col-span-2">
                    {partialQuestions
                      ? `Generating question ${partialQuestions.length + 1} of ${questionCount}`
                      : "Analyzing PDF content"}
                  </span>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Footer */}
        <footer className="text-center text-zinc-400 text-sm mt-16">
          <p>
            Built with{" "}
            <Link
              href="https://nextjs.org"
              className="text-primary-foreground hover:underline"
            >
              Next.js
            </Link>
            ,{" "}
            <Link
              href="https://sdk.vercel.ai"
              className="text-primary-foreground hover:underline"
            >
              Vercel AI SDK
            </Link>{" "}
            &{" "}
            <Link
              href="https://ai.google.dev"
              className="text-primary-foreground hover:underline"
            >
              Google Gemini
            </Link>
            .
          </p>
          <p className="mt-2">© {new Date().getFullYear()} Career sathi. All rights reserved.</p>
        </footer>
      </motion.div>

      {/* Custom Styles for Glass Card (add this to your global CSS, e.g., globals.css) */}
      <style jsx global>{`
        .glass-card {
          background-color: rgba(39, 39, 42, 0.3); /* zinc-800 with 30% opacity */
          backdrop-filter: blur(15px); /* Stronger blur for more prominent effect */
          border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle white border */
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2); /* Soft shadow */
          color: white; /* Ensure text is readable */
        }
        /* Override shadcn's default card background if needed */
        .glass-card .CardHeader, .glass-card .CardContent, .glass-card .CardFooter {
            background-color: transparent;
        }
      `}</style>
    </div>
  );
}