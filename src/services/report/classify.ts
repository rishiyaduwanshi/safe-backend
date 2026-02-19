import { z } from "zod";
import Groq from "groq-sdk";
import { flatCategory } from "@/data/category";
import reportLogger from "./logger";
import { config } from "@config/index";

const groq = new Groq({
  apiKey: config.GROQ_API_KEY,
});

const classificationSchema = z.object({
  key: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
});


const categoryKeys = flatCategory.map((c) => c.key);

export async function classifyWithAI(text: string) {
  reportLogger.info(`Classifying report: ${text}`);

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
You classify public safety incidents reported by citizens in India.

Select the most appropriate category key from the provided list.
Adjust severity if situation is extremely serious.
Return ONLY valid JSON.

Allowed keys:
${categoryKeys.join(", ")}

Severity levels:
low → minor inconvenience
medium → moderate risk
high → serious safety risk
critical → immediate life threat
`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "classification",
        schema: {
          type: "object",
          properties: {
            key: { type: "string", enum: categoryKeys },
            severity: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
            },
            confidence: { type: "number" },
          },
          required: ["key", "severity"],
          additionalProperties: false,
        },
        strict: false,
      },
    },
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  const parsed = classificationSchema.parse(JSON.parse(content));

  reportLogger.info(
    `AI classified as ${parsed.key} | severity: ${parsed.severity} | confidence: ${parsed.confidence}`
  );

  return parsed;
}
