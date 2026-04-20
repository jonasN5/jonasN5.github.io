import { chatJson } from "./mistral.mjs"
import { translationJsonSchema } from "./schema.mjs"

const TARGET_LANGS = [
  { code: "de", name: "German" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
]

export async function translateRecipe(recipe) {
  const translations = {}
  for (const { code, name } of TARGET_LANGS) {
    translations[code] = await translateOne(recipe, code, name)
  }
  return translations
}

async function translateOne(recipe, code, name) {
  const result = await chatJson({
    system:
      `You translate French recipes into ${name}. Preserve meaning and cooking instructions precisely. ` +
      `Ingredient quantities and units stay identical (e.g. "400g" stays "400g"). ` +
      `Return translated tags, ingredients, steps, tips and history; pass through the original title only if it is a proper name (like "Tarte Tatin") otherwise translate it. ` +
      `Use empty strings / empty arrays for fields that were empty in the source.`,
    user: JSON.stringify({
      title: recipe.title,
      description: recipe.description,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tips: recipe.tips ?? [],
      history: recipe.history ?? "",
    }),
    schema: translationJsonSchema,
    schemaName: `Translation_${code}`,
  })
  return sanitizeTranslation(result)
}

function sanitizeTranslation(t) {
  const out = {}
  if (t.title) out.title = t.title
  if (t.description) out.description = t.description
  if (t.tags?.length) out.tags = t.tags
  if (t.ingredients?.length) {
    out.ingredients = t.ingredients.map((g) => {
      const group = { items: g.items }
      if (g.group && g.group.trim()) group.group = g.group
      return group
    })
  }
  if (t.steps?.length) out.steps = t.steps.map((s) => ({ text: s.text }))
  if (t.tips?.length) out.tips = t.tips
  if (t.history) out.history = t.history
  return out
}
