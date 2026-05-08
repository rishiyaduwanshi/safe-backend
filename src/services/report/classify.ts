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
  comment: z.string().max(500).nullable().optional(),
});


const categoryKeys = flatCategory.map((c) => c.key);

export async function classifyWithAI(text: string) {
  reportLogger.info(`Classifying report: ${text}`);

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `
       You classify public safety incident reports submitted by citizens in India.

Your task:

1. Determine whether the text describes a real and actionable incident.
2. If valid, classify it using the best matching category key.
3. Assign severity and confidence conservatively.

Interpret the report the way a cautious and practical human reviewer would.

Focus on the real-world meaning of the report, not just keywords. Consider implied context, intent, and safety risk, but do not assume facts that are not stated or strongly implied.

Rules:

* If the text is placeholder content, nonsense, irrelevant, fictional, spam, or lacks a concrete incident, return:

  * key: "insufficient_detail"
  * confidence between 0.00 and 0.15
* Do NOT invent new categories.
* If multiple categories are plausible, choose the most specific category explicitly supported by the report text.
* If details are vague but still suggest a category, choose the closest valid key with low confidence.
* Long or well-written text does NOT automatically increase confidence.
* Use low confidence when evidence is weak or ambiguous.

Severity guidelines:

* low → minor issue or low-risk concern
* medium → moderate safety concern
* high → serious danger, harassment, or ongoing criminal activity
* critical → immediate threat to life, violence, weapons, kidnapping, or medical emergency

Confidence guidelines:

* 0.00–0.15 → insufficient, vague, placeholder, or irrelevant
* 0.20–0.54 → weak evidence / uncertain classification
* 0.55–0.74 → strong category match
* 0.75–0.95 → explicit and highly reliable evidence

Comment rules:

* If key = "insufficient_detail", briefly explain what is missing.
* If confidence < 0.55, briefly explain the uncertainty or what additional detail would help.
* Otherwise return comment as null.

Allowed category keys:
${categoryKeys.join(", ")}

Return ONLY valid JSON matching the provided schema.


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
            comment: { type: ["string", "null"] },
          },
          required: ["key", "severity", "confidence"],
          additionalProperties: false,
        },
        strict: true,
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
