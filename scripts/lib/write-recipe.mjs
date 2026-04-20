import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"

const SUMMARY_KEYS = [
  "slug",
  "title",
  "description",
  "images",
  "imageCredit",
  "prepTime",
  "cookTime",
  "servings",
  "difficulty",
  "category",
  "tags",
  "origin",
  "stepCount",
  "ingredientCount",
  "translations",
]

export async function writeRecipe({ repoRoot, recipe, translations, cover }) {
  const recipesDir = join(repoRoot, "public", "data", "recipes")
  await mkdir(recipesDir, { recursive: true })

  const detail = {
    ...recipe,
    images: {
      cover: cover?.relativePath ?? `images/recipes/${recipe.slug}/placeholder.svg`,
      web: cover?.relativePath ?? `images/recipes/${recipe.slug}/placeholder.svg`,
    },
    stepCount: recipe.steps.length,
    ingredientCount: recipe.ingredients.reduce((n, g) => n + g.items.length, 0),
    translations,
  }
  if (cover?.credit) detail.imageCredit = cover.credit
  if (!cover) await ensurePlaceholder(join(repoRoot, "public", "images", "recipes", recipe.slug))

  const detailPath = join(recipesDir, `${recipe.slug}.json`)
  await writeFile(detailPath, JSON.stringify(detail, null, 2) + "\n")

  const indexPath = join(recipesDir, "index.json")
  const index = await readIndex(indexPath)

  const existing = index.findIndex((r) => r.slug === recipe.slug)
  const summary = pickSummary(detail, translations)
  if (existing >= 0) index[existing] = summary
  else index.unshift(summary)

  await writeFile(indexPath, JSON.stringify(index, null, 2) + "\n")

  return { detailPath, indexPath }
}

async function readIndex(indexPath) {
  try {
    const raw = await readFile(indexPath, "utf-8")
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function pickSummary(detail, translations) {
  const summary = {}
  for (const key of SUMMARY_KEYS) {
    if (key === "translations") continue
    if (detail[key] !== undefined) summary[key] = detail[key]
  }
  if (translations) {
    summary.translations = {}
    for (const [lang, t] of Object.entries(translations)) {
      const picked = {}
      if (t.title) picked.title = t.title
      if (t.description) picked.description = t.description
      if (t.tags?.length) picked.tags = t.tags
      if (Object.keys(picked).length) summary.translations[lang] = picked
    }
  }
  return summary
}

async function ensurePlaceholder(dir) {
  await mkdir(dir, { recursive: true })
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="Recipe placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F5E6D8"/>
      <stop offset="1" stop-color="#E8C9A8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <text x="400" y="320" font-family="serif" font-size="72" fill="#C05A3E" text-anchor="middle">🍽</text>
</svg>
`
  await writeFile(join(dir, "placeholder.svg"), svg)
}
