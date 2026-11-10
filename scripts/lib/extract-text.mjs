import { chatJson } from "./mistral.mjs"
import { baseRecipeJsonSchema, stripEmpty } from "./schema.mjs"
import { parseIssueSections, titleHintFromIssue } from "./issue-form.mjs"

const TEXT_HEADING = "Texte de la recette"
const MAX_CHARS = 40000

export async function extractRecipeFromText(text, { titleHint = "", notes = "" } = {}) {
  const recipe = await chatJson({
    system:
      "You extract a recipe from text pasted by a user and output French-language JSON. " +
      "All free-text fields (title, description, ingredients, steps, tips, history) must be in French, translating if needed. " +
      "Preserve quantities and units exactly. The slug must be URL-safe (lowercase ASCII, digits, hyphens). " +
      "Tags are 5-12 French lowercase hyphenated words. Pick one difficulty from Facile/Moyen/Difficile and one category from the allowed list. " +
      "If a field is not in the source, use an empty string or empty array.",
    user:
      `Recipe title hint: ${titleHint || "(none — infer it from the text)"}\n` +
      `User notes: ${notes || "(none)"}\n\n` +
      `Recipe text:\n${text.slice(0, MAX_CHARS)}`,
    schema: baseRecipeJsonSchema,
    schemaName: "Recipe",
  })
  return stripEmpty(recipe)
}

// "Recette (texte)" template: one pasted-text field (+ optional cover photo,
// handled separately by cover-upload.mjs).
export async function extractFromText(issue) {
  const text = parseIssueSections(issue.body)[TEXT_HEADING]
  if (!text || text.length < 40) {
    throw new Error("Le champ « Texte de la recette » est vide ou trop court.")
  }
  return extractRecipeFromText(text, { titleHint: titleHintFromIssue(issue) })
}
