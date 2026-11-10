import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { extractFromText } from "./lib/extract-text.mjs"
import { downloadIssueCover } from "./lib/cover-upload.mjs"
import { translateRecipe } from "./lib/translate.mjs"
import { fetchCoverImage } from "./lib/unsplash.mjs"
import { writeRecipe } from "./lib/write-recipe.mjs"
import { commentOnIssue, createPr, findOpenPr, pushBranch } from "./lib/github.mjs"

const REPO_ROOT = resolve(process.cwd())
// Hidden marker on the comment posted after each Mistral attempt. The workflow's
// quota job counts these comments to enforce the daily limit.
const ATTEMPT_MARKER = "\n\n<!-- recipe-intake-attempt -->"

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
    // Single issue form: .github/ISSUE_TEMPLATE/recette.yml (pasted text + optional photo).
    const recipe = await extractFromText(issue)

    validateRecipeShape(recipe)

    console.log("Translating into DE, EN and ES...")
    const translations = await translateRecipe(recipe)

    console.log("Fetching cover image...")
    let cover = null
    let coverError = null
    try {
      cover = await downloadIssueCover(issue.body || "", recipe.slug, REPO_ROOT)
    } catch (err) {
      coverError = err.message
      console.warn(`Could not use the photo from the issue: ${coverError}`)
    }
    cover = cover ?? (await fetchCoverImage(recipe.slug, recipe, REPO_ROOT))

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
      `Nouvelle recette générée par Mistral AI : ${prUrl}\n\n- Catégorie : ${recipe.category}\n- Difficulté : ${recipe.difficulty}\n- ${recipe.steps.length} étapes, ${recipe.ingredients.reduce((n, g) => n + g.items.length, 0)} ingrédients\n- Traductions : français, allemand, anglais, espagnol\n- Photo : ${describeCover(cover, coverError)}` + ATTEMPT_MARKER
    )
    console.log(`Done: ${prUrl}`)
  } catch (err) {
    console.error(err)
    await commentOnIssue(
      issue.number,
      `La génération automatique a échoué :\n\n\`\`\`\n${String(err.message || err).slice(0, 2000)}\n\`\`\`\n\nVérifiez les champs obligatoires du formulaire, puis ré-éditez l'issue pour relancer le workflow.` + ATTEMPT_MARKER
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

function describeCover(cover, coverError) {
  if (cover?.fromIssue) return "photo jointe à l'issue"
  const fallback = cover ? "photo Unsplash" : "image par défaut"
  return coverError ? `${fallback} (la photo jointe n'a pas pu être utilisée : ${coverError})` : fallback
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
