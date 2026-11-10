import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { parseIssueSections } from "./issue-form.mjs"

// Issue-form fields where submitters can drop a photo of the finished dish.
const COVER_HEADINGS = ["Photo du plat (optionnel)", "Image de couverture (optionnel)"]

// Only download files GitHub itself hosts (drag-and-drop uploads), never arbitrary URLs.
const ALLOWED_PREFIXES = [
  "https://github.com/user-attachments/assets/",
  "https://user-images.githubusercontent.com/",
  "https://private-user-images.githubusercontent.com/",
]

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

const MAX_BYTES = 15 * 1024 * 1024

// GitHub inserts uploads either as Markdown `![alt](url)` or as `<img src="url">`.
export function findCoverImageUrl(body) {
  const sections = parseIssueSections(body)
  for (const heading of COVER_HEADINGS) {
    const field = sections[heading]
    if (!field) continue
    const candidates = [
      ...field.matchAll(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g),
      ...field.matchAll(/<img\b[^>]*\bsrc=["'](https:\/\/[^"']+)["']/gi),
      ...field.matchAll(/(https:\/\/github\.com\/user-attachments\/assets\/[\w-]+)/g),
    ].map((m) => m[1])
    const url = candidates.find((u) => ALLOWED_PREFIXES.some((p) => u.startsWith(p)))
    if (url) return url
  }
  return null
}

// Downloads the submitter's photo into public/images/recipes/{slug}/cover.{ext}.
// Returns null when there is no photo; throws when the photo can't be used.
export async function downloadIssueCover(body, slug, repoRoot) {
  const url = findCoverImageUrl(body)
  if (!url) return null

  const response = await fetch(url, { redirect: "follow" })
  if (!response.ok) throw new Error(`cover download failed: HTTP ${response.status}`)
  const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase()
  const ext = EXT_BY_TYPE[type]
  if (!ext) throw new Error(`cover is not a JPEG/PNG/WebP image (content-type: ${type || "unknown"})`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > MAX_BYTES) throw new Error(`cover is too large (${buffer.length} bytes)`)

  const relativePath = `images/recipes/${slug}/cover.${ext}`
  const absolutePath = join(repoRoot, "public", relativePath)
  await mkdir(dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, buffer)
  return { relativePath, fromIssue: true }
}
