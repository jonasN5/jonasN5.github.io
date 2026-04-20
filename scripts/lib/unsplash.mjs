import { writeFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

export async function fetchCoverImage(slug, recipe, outputDir) {
  if (!ACCESS_KEY) return null

  const query = buildQuery(recipe)
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=5&content_filter=high`,
    { headers: { Authorization: `Client-ID ${ACCESS_KEY}` } }
  )
  if (!response.ok) return null
  const data = await response.json()
  const best = (data.results ?? [])[0]
  if (!best) return null

  const imgResponse = await fetch(best.urls.regular)
  if (!imgResponse.ok) return null
  const buffer = Buffer.from(await imgResponse.arrayBuffer())

  const coverPath = `public/images/recipes/${slug}/cover.jpg`
  const absolutePath = `${outputDir}/${coverPath}`
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, buffer)

  return {
    relativePath: `images/recipes/${slug}/cover.jpg`,
    credit: {
      author: best.user?.name,
      url: best.links?.html,
    },
  }
}

function buildQuery(recipe) {
  const terms = [recipe.title, recipe.category].filter(Boolean)
  return terms.join(" ").replace(/\s+/g, " ").trim()
}
