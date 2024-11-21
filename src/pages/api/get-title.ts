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
  userInput: z.string().min(1, { message: "User input is required." }),
});

export const QuestionAndAnswerFormat = z.object({
  title: z.string(),
  description: z.string(),
});

export type QuestionType = z.infer<typeof QuestionAndAnswerFormat>;

export type ApiGetTitleType = {
  message: string;
  data: { data: QuestionType } | null;
  errors?: z.ZodFormattedError<
    {
      userInput: string;
    },
    string
  >;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiGetTitleType>
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

  const { userInput } = parseResult.data;

  const prompt = `You are an expert title and description generator. Please:
    1. Detect the language of this input (Arabic or English)
    2. Create a compelling title in the same language as the input:
       - Maximum 5 words
       - Captures the core topic/theme
       - Uses engaging, descriptive language
       - Maintains cultural appropriateness
    3. Write a concise description in the same language:
       - Maximum 20 words
       - Highlights key points
       - Provides valuable context
       - Matches the tone and style of the title
    4. Ensure both title and description:
       - Are grammatically correct in the detected language
       - Maintain consistency in terminology
       - Consider cultural nuances
       - Are clear and engaging`;

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: `Please analyze this text and generate an appropriate title and description in its language: "${userInput}"`,
      },
    ],
    response_format: zodResponseFormat(QuestionAndAnswerFormat, "event"),
    temperature: 0.7,
  });

  const event = completion.choices[0].message.parsed;
  if (event === null) {
    res.status(400).json({ message: "Event is null", data: null });
    return;
  }
  const response = {
    data: {
      title: event.title,
      description: event.description,
    },
  };
  res.status(200).json({ message: "All good", data: response });
}
