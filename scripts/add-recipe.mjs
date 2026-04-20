import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { extractStructured } from "./lib/extract-structured.mjs"
import { extractFromUrl } from "./lib/extract-url.mjs"
import { extractFromFile } from "./lib/extract-file.mjs"
import { translateRecipe } from "./lib/translate.mjs"
import { fetchCoverImage } from "./lib/unsplash.mjs"
import { writeRecipe } from "./lib/write-recipe.mjs"
import { commentOnIssue, createPr, findOpenPr, pushBranch } from "./lib/github.mjs"

const REPO_ROOT = resolve(process.cwd())

async function main() {
  const event = await readEvent()
  const issue = event.issue
  if (!issue) {
    throw new Error("No issue in event payload")
  }

  const labels = (issue.labels ?? []).map((l) => (typeof l === "string" ? l : l.name))
  if (!labels.includes("recipe-submission")) {
    console.log("Issue not labelled recipe-submission — skipping.")
    return
  }

  try {
    const template = detectTemplate(labels, issue.body || "")
    console.log(`Detected template: ${template}`)

    let recipe
    if (template === "structured") recipe = await extractStructured(issue)
    else if (template === "url") recipe = await extractFromUrl(issue)
    else if (template === "file") recipe = await extractFromFile(issue)
    else throw new Error(`Unsupported template: ${template}`)

    validateRecipeShape(recipe)

    console.log("Translating into EN and IT...")
    const translations = await translateRecipe(recipe)

    console.log("Fetching cover image...")
    const cover = await fetchCoverImage(recipe.slug, recipe, REPO_ROOT)

    console.log("Writing recipe files...")
    await writeRecipe({ repoRoot: REPO_ROOT, recipe, translations, cover })

    const branch = `recipe/${recipe.slug}`
    console.log(`Pushing branch ${branch}...`)
    await pushBranch({ repoRoot: REPO_ROOT, branch })

    const existingPr = await findOpenPr(branch)
    const prUrl = existingPr
      ? existingPr.url
      : await createPr({
          branch,
          title: `feat: ajouter ${recipe.title}`,
          body: buildPrBody({ recipe, translations, cover, issueNumber: issue.number }),
        })

    await commentOnIssue(
      issue.number,
      `Nouvelle recette générée par Mistral AI : ${prUrl}\n\n- Catégorie : ${recipe.category}\n- Difficulté : ${recipe.difficulty}\n- ${recipe.steps.length} étapes, ${recipe.ingredients.reduce((n, g) => n + g.items.length, 0)} ingrédients\n- Traductions : français, allemand, anglais, espagnol`
    )
    console.log(`Done: ${prUrl}`)
  } catch (err) {
    console.error(err)
    await commentOnIssue(
      issue.number,
      `La génération automatique a échoué :\n\n\`\`\`\n${String(err.message || err).slice(0, 2000)}\n\`\`\`\n\nVérifiez les champs obligatoires du formulaire, puis ré-éditez l'issue pour relancer le workflow.`
    )
    process.exitCode = 1
  }
}

async function readEvent() {
  const path = process.env.GITHUB_EVENT_PATH
  if (!path) throw new Error("GITHUB_EVENT_PATH is not set")
  const raw = await readFile(path, "utf-8")
  return JSON.parse(raw)
}

function detectTemplate(labels, body) {
  if (body.includes("### URL de la recette")) return "url"
  if (body.includes("### Fichier de la recette")) return "file"
  if (labels.includes("needs-formatting")) {
    return body.includes("### Fichier") ? "file" : "url"
  }
  return "structured"
}

function validateRecipeShape(recipe) {
  if (!recipe.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(recipe.slug)) {
    throw new Error(`Invalid slug: ${recipe.slug || "(empty)"}`)
  }
  if (!recipe.title) throw new Error("Missing title")
  if (!recipe.description) throw new Error("Missing description")
  if (!recipe.ingredients?.length) throw new Error("Missing ingredients")
  if (!recipe.steps?.length) throw new Error("Missing steps")
  if (!recipe.tags?.length) throw new Error("Missing tags")
}

function buildPrBody({ recipe, translations, cover, issueNumber }) {
  const ingredientCount = recipe.ingredients.reduce((n, g) => n + g.items.length, 0)
  const translationSummary = Object.keys(translations ?? {}).join(", ")
  const coverInfo = cover
    ? `${cover.relativePath}${cover.credit?.author ? ` (photo: ${cover.credit.author})` : ""}`
    : "placeholder (no UNSPLASH_ACCESS_KEY)"
  return `Recette générée par Mistral AI à partir de l'issue #${issueNumber}.

- **Titre**: ${recipe.title}
- **Catégorie**: ${recipe.category}
- **Difficulté**: ${recipe.difficulty}
- **Temps**: ${recipe.prepTime}min prep, ${recipe.cookTime}min cuisson — ${recipe.servings} portions
- **Ingrédients**: ${ingredientCount}
- **Étapes**: ${recipe.steps.length}
- **Tags** (${recipe.tags.length}): ${recipe.tags.join(", ")}
- **Traductions**: fr + ${translationSummary}
- **Image**: ${coverInfo}

Closes #${issueNumber}
`
}

main()
