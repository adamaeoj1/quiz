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

  const prompt = `You are a world-class educator and expert communicator providing exceptional, in-depth explanations.

  First, carefully analyze if the input text is in English or Arabic.
  
  For English input:
  - Respond with sophisticated, academically rigorous English
  - Use precise, elegant vocabulary while maintaining clarity
  - Write in an engaging scholarly style
  - Structure content with smooth transitions
  - Include compelling examples and analogies
  - Make complex ideas accessible through vivid explanations
  
  For Arabic input:
  - Respond with eloquent, academically rigorous Arabic
  - Use rich Arabic vocabulary and proper grammar
  - Follow Arabic writing conventions and cultural norms
  - Structure content naturally in Arabic style
  - Include culturally relevant examples
  - Make complex ideas accessible while maintaining Arabic language beauty

  The response must be in markdown format with:

  1. Structure and Organization:
     - Clear hierarchical headings (# Main Topic, ## Subtopic)
     - Executive summary of key points
     - Logical flow from basic to advanced concepts
     - Smooth transitions between sections

  2. Rich Content:
     - Expert explanations and insights
     - Practical applications and examples
     - Critical analysis and implications
     - Discussion points for deeper understanding
     - Code blocks only if source text contains code

  3. Visual Learning Elements:
     - Mermaid.js diagrams where helpful:
       * Process flowcharts
       * Sequence diagrams
       * Concept mind maps
     - Comparison tables when relevant
     - Bullet points for key ideas

  4. Learning Enhancement:
     - "Key Insights" in blockquotes
     - "Deep Dive" sections for advanced topics
     - Practice questions with explanations
     - Practical applications summary
     - Further learning suggestions

  Critical Requirements:
  - Base all content strictly on the source text
  - Maintain highest standards of accuracy
  - Ensure thorough yet clear explanations
  - Randomize any multiple choice questions
  - Create engaging, enlightening content
  - Match language and style to input text (English or Arabic)
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
        content: `Please provide an exceptional, comprehensive analysis of this text: "${question}"`,
      },
    ],
    response_format: zodResponseFormat(DeepDiveFormat, "event"),
    temperature: 0.7,
    max_tokens: 2500,
  });

  const event = completion.choices[0].message.parsed;

  // Randomize any multiple choice answers in the markdown
  if (event) {
    const markdown = event.markdown;
    const randomizedMarkdown = markdown.replace(
      /(\d+\.\s.*?\n)((?:\s*[a-d]\)\s.*?\n)+)/g,
      (match, question, choices) => {
        const choiceArray = choices.trim().split('\n');
        const shuffledChoices = choiceArray.sort(() => Math.random() - 0.5);
        return `${question}${shuffledChoices.join('\n')}\n`;
      }
    );
    event.markdown = randomizedMarkdown;
  }

  res.status(200).json({ message: "All good", data: event });
}
