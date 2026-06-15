import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getExamsHistory, saveExamHistory, deleteExamHistory, upsertExamsHistory } from './src/db/exams.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (e) {
    console.warn("GEMINI_API_KEY is not set or invalid.");
  }

  const generateWithRetry = async (model: string, contents: string, config: any, retries = 5) => {
    while (retries > 0) {
      try {
        return await ai.models.generateContent({ model, contents, config });
      } catch (error: any) {
        let errStr = String(error);
        const isRetryable = errStr.includes("503") || errStr.includes("429") || errStr.includes("UNAVAILABLE") || errStr.includes("RESOURCE_EXHAUSTED") || error?.status === 503 || error?.status === 429;
        
        if (isRetryable && retries > 1) {
          retries--;
          // Simple fixed delay of 25 seconds to surpass the common 22s rate limit delay
          console.warn(`[Retryable Error] Model ${model} is overloaded or rate-limited. Retrying in 25 seconds... (${retries} retries left) - Error: ${errStr.substring(0, 50)}`);
          await new Promise(r => setTimeout(r, 25000));
        } else {
          throw error;
        }
      }
    }
  };

  // API Route: Format/Generate Exam
  app.post("/api/exam/generate-exam", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured. Please add it to your secrets." });
      }

      const { prompt, content } = req.body;
      
      let systemPrompt = `You are an AI assistant specialized in formatting and generating math exams in Khmer. 
If the user provides an existing exam content, format it neatly, using Markdown.
Make sure to add clear structure, numbered lists for questions, and bold text for points.
Always put sub-questions (like ក., ខ., គ., or ១., ២., ៣.) on their own separate lines.
Always put block LaTeX equations ($$ ... $$) on their own separate lines, with an empty line before and after. DO NOT output equations on the same line as text.
Always return ONLY the markdown content, without any extra conversation.
Use the following format for question headers where necessary: "### I. (XXពិន្ទុ)".`;
      let userPrompt = prompt || `សូមជួយរៀបចំសំណួរប្រឡងខាងក្រោមឲ្យមានសណ្តាប់ធ្នាប់ល្អ៖\n\n${content}`;

      const response = await generateWithRetry(
        "gemini-2.5-flash", 
        userPrompt, 
        { 
          systemInstruction: systemPrompt,
          maxOutputTokens: 8192
        }
      );

      res.json({ result: response?.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate exam." });
    }
  });

  // API Route: Calculate Solution & Tips
  app.post("/api/exam/generate-solution", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured. Please add it to your secrets." });
      }

      const { content, examContent } = req.body;
      
      let systemPrompt = `You are a mathematician AI assistant helping to solve and format math exam solutions in Khmer.
You must solve the provided math problems or improve the provided solution formatting.
If an existing incomplete solution is provided, you must CONTINUE solving from where it left off, BUT YOU MUST RE-OUTPUT THE ENTIRE SOLUTION from the beginning to the end, including the existing content. Do not just output the rest.
You MUST output using the predefined template elements:
1. Use "#### ចម្លើយលម្អិត" for the main solution steps.
2. Provide useful hints or tips using "> គន្លឹះ៖ [your hint here]".
3. Use proper LaTeX math formatting. Use $$ ... $$ for block equations and $ ... $ for inline math. DO NOT put spaces immediately inside the $ delimiters (e.g., use $x=1$, not $ x=1 $).
Always put block LaTeX equations ($$ ... $$) on their own separate lines, with an empty line before and after. DO NOT output block equations on the same line as text!
Always put sub-questions (like ក., ខ., គ., or ១., ២., ៣.) on their own separate lines.
Always return ONLY the formatted markdown content without any extra conversation.`;

      let userPrompt = `នេះជាសំណួរប្រឡងទាំងមូល៖\n${examContent}\n\nសូមជួយគណនា និងផ្តល់ចម្លើយលម្អិតសម្រាប់ **លំហាត់ទាំងអស់** ដែលមានក្នុងវិញ្ញាសានេះ។ ត្រូវប្រាកដថាអ្នកបានដោះស្រាយគ្រប់លំហាត់តាំងពីដើមដល់ចប់ ដោយមិនរំលងលំហាត់ណាមួយឡើយ ក៏ដូចជាបន្ថែមគន្លឹះពណ៌លឿង (Tip) ជាជំនួយ។`;
      if (content && content.trim() !== "") {
        userPrompt += `\n\nនេះជាចម្លើយដែលមានស្រាប់ (អាចមានការបន្ថែម ឬកែតម្រូវបានតទៅទៀត)៖\n${content}`;
      }

      const response = await generateWithRetry(
        "gemini-2.5-flash", 
        userPrompt, 
        { 
          systemInstruction: systemPrompt,
          maxOutputTokens: 8192
        }
      );

      res.json({ result: response?.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to generate solution." });
    }
  });

  // API Route: Analyze Exam
  app.post("/api/exam/analyze", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      const { content, totalTime } = req.body;
      
      let systemPrompt = `You are an AI assistant specialized in analyzing math exams in Khmer.
Given the exam content, you must extract the distinct topics (e.g. លីមីត, ចំនួនកុំផ្លិច, អាំងតេក្រាល, etc.), their associated points (must sum up to the total exam points if applicable, or just extract what is written like ១៥ពិន្ទុ -> 15).
Estimate the time needed for each topic based on the totalTime (e.g., if total time is 150 mins and total score is 125, time per point is ~1.2 mins).
Return ONLY a valid JSON array of objects. Do not write markdown blocks or any other text.
Format for each object:
{ "name": "Topic Name in Khmer", "score": number, "time": number, "color": "a hex color code like #EC4899", "emoji": "a relevant emoji", "details": ["array of 2-3 short bullet points in Khmer summarizing the sub-questions"] }
Make sure to give a unique visually distinct color for each topic.`;

      let userPrompt = `នេះជាសំណួរប្រឡង៖\n${content}\n\nមេត្តាវិភាគទម្ងន់ពិន្ទុ និងពេលវេលាសម្រាប់ប្រធានបទនីមួយៗ (សរុបប្រហែល ${totalTime}នាទី) ជាទម្រង់ JSON។`;

      const response = await generateWithRetry(
        "gemini-2.5-flash", 
        userPrompt, 
        { systemInstruction: systemPrompt }
      );

      let text = response?.text || "[]";
      // sanitize potential markdown
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      let parsed = JSON.parse(text);

      res.json({ result: parsed });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Failed to analyze exam." });
    }
  });

  app.get("/api/history", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const history = await getExamsHistory(req.user.uid, req.user.email || '');
      res.json(history);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/history", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const saved = await saveExamHistory(req.user.uid, req.user.email || '', req.body);
      res.json(saved);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/history/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      await deleteExamHistory(req.user.uid, req.user.email || '', parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/history/upsert", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const result = await upsertExamsHistory(req.user.uid, req.user.email || '', req.body);
      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
