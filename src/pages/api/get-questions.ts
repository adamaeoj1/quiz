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
  type: z.literal("true-or-false").or(z.literal("multiple-choice")),
  difficulty: z.literal("easy").or(z.literal("medium")).or(z.literal("hard")),
  questionAmount: z.number().int().min(1).max(20),
});

export const QuestionAndAnswerFormat = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      explanation: z.string(),
      answers: z.array(
        z.object({
          text: z.string(),
          isCorrect: z.boolean(),
          counterArgument: z.string(),
        })
      ),
    })
  ),
});

export type QuestionType = z.infer<
  typeof QuestionAndAnswerFormat
>["questions"][number];

export type ApiGetQuestionsType = {
  message: string;
  data: { questions: QuestionType[] } | null;
  errors?: z.ZodFormattedError<
    {
      userInput: string;
    },
    string
  >;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiGetQuestionsType>
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

  const { userInput, type, questionAmount, difficulty } = parseResult.data;

  const prompts = [
    `You are an expert teacher. I will provide you with text, and I want you to:
    1. Carefully analyze this text: "${userInput}"
    2. Create ${questionAmount} ${type === "multiple-choice" ? "multiple-choice" : "true/false"} questions
    3. For multiple-choice: provide one correct answer and 2-3 plausible incorrect options
    4. For true/false: create statements that require analysis
    5. Match the difficulty level '${difficulty}' by adjusting complexity and depth
    6. Include for each question:
       - Clear question text based on the provided content
       - Detailed explanation of the correct answer
       - For wrong options: explain why they are incorrect
    7. Important: Only use information directly stated in or clearly implied by the provided text`,
  ];

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: prompts.join(" "),
      },
      {
        role: "user",
        content: `Please create questions using the following context: "${userInput}".`,
      },
    ],
    response_format: zodResponseFormat(QuestionAndAnswerFormat, "event"),
  });

  const event = completion.choices[0].message.parsed;

  res.status(200).json({ message: "All good", data: event });
}
