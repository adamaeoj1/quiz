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

  const prompt = `You are an expert Kuwaiti educator specializing in assessment and evaluation. Your task is to:

  1. Create ${questionAmount} ${type === "multiple-choice" ? "multiple-choice" : "true/false"} questions EXCLUSIVELY from this text: "${userInput}"
  
  2. Critical rules for Kuwaiti educational standards:
     - Questions MUST be derived ONLY from the provided text content
     - NO external information or knowledge should be added
     - All questions and answers must be directly verifiable from the text
     - Detect if the text is in Arabic or English and respond in the same language
     - Follow Kuwaiti Ministry of Education guidelines for question formation
  
  3. For each question:
     - Questions must cite specific text passages
     - Explanations must include direct quotes from the text
     - All answers must be based on explicit text content
     - Use culturally appropriate language and examples relevant to Kuwait
  
  4. Format requirements:
     ${type === "multiple-choice" 
       ? "- Create exactly one correct answer and 3-4 incorrect options based on the text\n     - Incorrect options must represent common misunderstandings of the text content"
       : "- Develop true/false statements that test comprehension of explicit text content\n     - Each statement must be directly verifiable from the text"}
  
  5. Difficulty levels aligned with Kuwaiti educational standards - '${difficulty}':
     - Easy: Direct text comprehension and main ideas
     - Medium: Connecting multiple concepts from the text
     - Hard: Critical analysis of text implications
  
  Important: Every question, answer, and explanation must be traceable to specific content in the text. Maintain high standards of Kuwaiti educational practices.`;

  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: userInput,
      },
    ],
    response_format: zodResponseFormat(QuestionAndAnswerFormat, "event"),
    temperature: 0.7,
    max_tokens: 2000,
  });

  const event = completion.choices[0].message.parsed;

  // Randomize the order of answers for multiple choice questions
  if (event && type === "multiple-choice") {
    event.questions = event.questions.map(question => ({
      ...question,
      answers: question.answers.sort(() => Math.random() - 0.5)
    }));
  }

  res.status(200).json({ message: "All good", data: event });
}
