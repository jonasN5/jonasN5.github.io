import { Mistral } from "@mistralai/mistralai"

const apiKey = process.env.MISTRAL_API_KEY
if (!apiKey) {
  throw new Error("MISTRAL_API_KEY is required")
}

export const MODEL_TEXT = process.env.MISTRAL_MODEL_TEXT || "mistral-small-latest"
export const MODEL_VISION = process.env.MISTRAL_MODEL_VISION || "pixtral-12b-2409"

const client = new Mistral({ apiKey })

export async function chatJson({
  model = MODEL_TEXT,
  system,
  user,
  schema,
  schemaName = "Result",
  attempts = 2,
}) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await client.chat.complete({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        responseFormat: {
          type: "json_schema",
          jsonSchema: {
            name: schemaName,
            strict: true,
            schemaDefinition: schema,
          },
        },
        temperature: 0.2,
      })
      const content = response.choices?.[0]?.message?.content
      if (typeof content !== "string") throw new Error("Empty Mistral response")
      return JSON.parse(content)
    } catch (err) {
      lastError = err
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, 1500 * attempt))
        continue
      }
      // Fallback: plain JSON mode
      try {
        const response = await client.chat.complete({
          model,
          messages: [
            { role: "system", content: system + "\n\nReturn ONLY valid JSON matching the described schema." },
            { role: "user", content: user },
          ],
          responseFormat: { type: "json_object" },
          temperature: 0.2,
        })
        const content = response.choices?.[0]?.message?.content
        if (typeof content !== "string") throw new Error("Empty Mistral response")
        return JSON.parse(content)
      } catch (fallbackErr) {
        lastError = fallbackErr
      }
    }
  }
  throw new Error(`Mistral call failed: ${lastError?.message ?? lastError}`)
}

export async function chatVisionJson({ system, user, imageUrls, schema, schemaName = "Result" }) {
  const messages = [
    { role: "system", content: system },
    {
      role: "user",
      content: [
        { type: "text", text: user },
        ...imageUrls.map((url) => ({ type: "image_url", imageUrl: url })),
      ],
    },
  ]
  const response = await client.chat.complete({
    model: MODEL_VISION,
    messages,
    responseFormat: {
      type: "json_schema",
      jsonSchema: { name: schemaName, strict: true, schemaDefinition: schema },
    },
    temperature: 0.2,
  })
  const content = response.choices?.[0]?.message?.content
  if (typeof content !== "string") throw new Error("Empty Mistral vision response")
  return JSON.parse(content)
}
