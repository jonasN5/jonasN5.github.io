import { chatJson } from "./mistral.mjs"
import { baseRecipeJsonSchema, stripEmpty } from "./schema.mjs"

const FIELD_MAP = {
  "Nom de la recette": "title",
  "URL de la recette": "url",
  "Notes (optionnel)": "notes",
}

function parseIssueForm(body) {
  const fields = {}
  const parts = body.split(/^### /m).slice(1)
  for (const part of parts) {
    const [heading, ...rest] = part.split("\n")
    const key = FIELD_MAP[heading.trim()]
    if (!key) continue
    const value = rest.join("\n").trim()
    fields[key] = value === "_No response_" ? "" : value
  }
  return fields
}

async function fetchPageText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RecettesFamilialesBot/1.0; +https://github.com/jonasN5/recettes-familiales)",
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  const html = await response.text()
  return htmlToText(html).slice(0, 40000)
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export async function extractFromUrl(issue) {
  const fields = parseIssueForm(issue.body || "")
  if (!fields.url) {
    throw new Error("URL field is missing from the issue.")
  }
  const pageText = await fetchPageText(fields.url)

  const recipe = await chatJson({
    system:
      "You extract a recipe from web-page text and output French-language JSON. " +
      "All free-text fields (title, description, ingredients, steps, tips, history) must be in French, translating if needed. " +
      "The slug must be URL-safe (lowercase ASCII, digits, hyphens). Tags are 5-12 French lowercase hyphenated words. " +
      "Pick one difficulty from Facile/Medio/Difficile and one category from the allowed list. " +
      "If a field is not in the source, use an empty string or empty array.",
    user: `Recipe title suggestion: ${fields.title}\nUser notes: ${fields.notes || "(none)"}\nSource URL: ${fields.url}\n\nPage text:\n${pageText}`,
    schema: baseRecipeJsonSchema,
    schemaName: "Recipe",
  })
  recipe.source = recipe.source || fields.url
  return stripEmpty(recipe)
}
