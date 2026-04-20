import { chatJson } from "./mistral.mjs"
import { baseRecipeJsonSchema, stripEmpty } from "./schema.mjs"

const FIELD_MAP = {
  "Titre de la recette": "title",
  "Slug": "slug",
  "Description": "description",
  "Catégorie": "category",
  "Difficulté": "difficulty",
  "Temps de préparation (minutes)": "prepTime",
  "Temps de cuisson (minutes)": "cookTime",
  "Portions": "servings",
  "Tags": "tags",
  "Ingrédients": "ingredients",
  "Étapes": "steps",
  "Conseils (optionnel)": "tips",
  "Histoire (optionnel)": "history",
  "Source (optionnel)": "source",
  "Image de couverture (optionnel)": "coverImage",
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

function parseIngredients(raw) {
  const groups = []
  let current = { group: undefined, items: [] }
  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith("##")) {
      if (current.items.length) groups.push(current)
      current = { group: line.replace(/^#+\s*/, "").trim(), items: [] }
    } else {
      current.items.push(line)
    }
  }
  if (current.items.length) groups.push(current)
  return groups.length ? groups : [{ items: [] }]
}

function parseSteps(raw) {
  return raw
    .split("\n")
    .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .map((text) => ({ text }))
}

function parseTips(raw) {
  if (!raw) return []
  return raw.split("\n").map((l) => l.trim()).filter(Boolean)
}

function parseTags(raw) {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

export async function extractStructured(issue) {
  const fields = parseIssueForm(issue.body || "")

  const recipe = {
    slug: (fields.slug || "").toLowerCase().trim(),
    title: fields.title || "",
    description: fields.description || "",
    prepTime: Number.parseInt(fields.prepTime ?? "0", 10) || 0,
    cookTime: Number.parseInt(fields.cookTime ?? "0", 10) || 0,
    servings: Number.parseInt(fields.servings ?? "1", 10) || 1,
    difficulty: fields.difficulty || "Facile",
    category: fields.category || "Secondi",
    tags: parseTags(fields.tags || ""),
    ingredients: parseIngredients(fields.ingredients || ""),
    steps: parseSteps(fields.steps || ""),
    tips: parseTips(fields.tips || ""),
    history: fields.history || "",
    source: fields.source || "",
  }

  if (recipe.tags.length < 3) {
    const enriched = await enrichTags(recipe)
    recipe.tags = Array.from(new Set([...recipe.tags, ...enriched])).slice(0, 12)
  }

  return stripEmpty(recipe)
}

async function enrichTags(recipe) {
  const result = await chatJson({
    system:
      "You add French recipe tags. Output 6-10 tags (lowercase, hyphen-separated words, no emoji) that cover diet, season, effort, meal type, cuisine and key ingredients. Reply with JSON { tags: string[] }.",
    user:
      `Generate tags for this recipe:\n\nTitle: ${recipe.title}\nDescription: ${recipe.description}\nCategory: ${recipe.category}\nIngredients: ${recipe.ingredients.flatMap((g) => g.items).join(", ")}`,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["tags"],
    },
    schemaName: "Tags",
  })
  return result.tags || []
}

export { baseRecipeJsonSchema }
