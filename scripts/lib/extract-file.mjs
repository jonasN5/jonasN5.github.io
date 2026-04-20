import { chatJson, chatVisionJson } from "./mistral.mjs"
import { baseRecipeJsonSchema, stripEmpty } from "./schema.mjs"

const FIELD_MAP = {
  "Nom de la recette": "title",
  "Fichier de la recette": "file",
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

function extractAttachmentUrls(field) {
  const urls = []
  const imageRegex = /!\[[^\]]*\]\((https:\/\/[^)]+)\)/g
  const linkRegex = /\[([^\]]+)\]\((https:\/\/[^)]+)\)/g
  let match
  while ((match = imageRegex.exec(field)) !== null) {
    urls.push({ url: match[1], kind: "image" })
  }
  while ((match = linkRegex.exec(field)) !== null) {
    const url = match[2]
    if (!urls.some((u) => u.url === url)) {
      const lower = url.toLowerCase()
      const kind = lower.endsWith(".pdf") ? "pdf" : lower.match(/\.(jpe?g|png|webp|gif)$/) ? "image" : "unknown"
      urls.push({ url, kind })
    }
  }
  return urls
}

export async function extractFromFile(issue) {
  const fields = parseIssueForm(issue.body || "")
  if (!fields.file) throw new Error("File field is missing from the issue.")

  const attachments = extractAttachmentUrls(fields.file)
  if (!attachments.length) {
    throw new Error(
      "No file attachment found. GitHub's attachment uploader sometimes takes a moment — re-edit the issue after the upload completes."
    )
  }

  const images = attachments.filter((a) => a.kind === "image")
  const pdfs = attachments.filter((a) => a.kind === "pdf")

  if (images.length) {
    return await extractFromImages(images.map((a) => a.url), fields)
  }
  if (pdfs.length) {
    // Mistral document AI (OCR + extraction) isn't guaranteed on free tier.
    // Strategy: try a text-only call where we point the model at the PDF URL
    // and let it fetch/describe. If that fails, the workflow surfaces the
    // error on the issue so the submitter can re-upload as images.
    return await extractFromPdf(pdfs[0].url, fields)
  }
  throw new Error(
    "Unsupported file type. Please attach an image (JPG/PNG) or a PDF."
  )
}

async function extractFromImages(imageUrls, fields) {
  const recipe = await chatVisionJson({
    system:
      "You transcribe a recipe from a photo or scan and output French-language JSON. " +
      "All text fields must be in French, translating if needed. Tags are 5-12 French lowercase hyphenated words. " +
      "Slug must be URL-safe (lowercase ASCII, digits, hyphens). Difficulty is Facile, Medio or Difficile. " +
      "Use an empty string or empty array for fields not visible in the image.",
    user: `Recipe title hint: ${fields.title}\nUser notes: ${fields.notes || "(none)"}\n\nTranscribe this recipe precisely, preserving quantities and units.`,
    imageUrls,
    schema: baseRecipeJsonSchema,
    schemaName: "Recipe",
  })
  return stripEmpty(recipe)
}

async function extractFromPdf(pdfUrl, fields) {
  const recipe = await chatJson({
    system:
      "You extract a recipe from a PDF document available at the given URL. " +
      "Output French-language JSON. Tags are 5-12 French lowercase hyphenated words. " +
      "Slug must be URL-safe. Difficulty is Facile, Medio or Difficile. " +
      "If you cannot access the PDF, reply with an empty recipe (title '', steps: []) — a follow-up workflow will surface the error.",
    user: `Recipe title hint: ${fields.title}\nUser notes: ${fields.notes || "(none)"}\n\nPDF URL: ${pdfUrl}`,
    schema: baseRecipeJsonSchema,
    schemaName: "Recipe",
  })
  if (!recipe.title || !recipe.steps?.length) {
    throw new Error(
      "PDF extraction didn't produce a usable recipe. Please re-upload the pages as images (JPG/PNG) or use the URL or structured-form template."
    )
  }
  return stripEmpty(recipe)
}
