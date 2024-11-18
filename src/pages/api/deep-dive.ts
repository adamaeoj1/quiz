import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

const RequestBodySchema = z.object({
  question: z.string().min(1, { message: "User input is required." }),
});

export const DeepDiveFormat = z.object({
  markdown: z.string(),
});

export type DeepDiveType = z.infer<typeof DeepDiveFormat>;

export type ApiDeepDiveResponse = {
  message: string;
  data: DeepDiveType | null;
  errors?: z.ZodFormattedError<
    {
      userInput: string;
    },
    string
  >;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiDeepDiveResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed", data: null });
  }

  const parseResult = RequestBodySchema.safeParse(req.body);

  if (!parseResult.success) {
    const errors = parseResult.error.format();

    return res.status(400).json({
      message: "Invalid request body.",
      data: null,
      errors,
    });
  }

  const { question } = parseResult.data;

  const prompt = `
  You are a teacher providing a deep dive explanation for a student.
  Analyze the following text and provide a detailed explanation based ONLY on the information contained within it.
  The response must be in markdown format with the following requirements:
  1. Use clearly defined sections with appropriate headings (e.g., # Topic, ## Subtopic).
  2. Use code blocks (e.g., \`\`\`) to provide code examples ONLY if they appear in the original text.
  3. Use diagrams (in mermaid.js syntax) to explain concepts from the text visually, but ensure they are simple and syntactically correct.
     - Preferred diagram types: flowcharts, sequence diagrams, and class diagrams.
     - Avoid overly complex diagrams or incorrect syntax.
  4. Be concise and to the point; avoid filler text or explanations not supported by the source text.
  5. Structure the output to follow the logical organization present in the original text.
  Important: Only use information that is directly stated in or clearly implied by the provided text.
  `;

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `The context is: "${question}".`,
      },
    ],
    response_format: zodResponseFormat(DeepDiveFormat, "event"),
  });

  const event = completion.choices[0].message.parsed;

  res.status(200).json({ message: "All good", data: event });
}
