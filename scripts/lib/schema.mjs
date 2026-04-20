export const CATEGORY_OPTIONS = [
  "Antipasti",
  "Pasta",
  "Gnocchi",
  "Risotto",
  "Insalate",
  "Secondi",
  "Contorni",
  "Pizze",
  "Pane",
  "Dolci",
  "Bambini",
  "Breakfast",
  "Brunch",
]

export const DIFFICULTY_OPTIONS = ["Facile", "Medio", "Difficile"]

export const baseRecipeJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    slug: {
      type: "string",
      description:
        "URL-safe identifier: lowercase ASCII letters, digits and hyphens only. Must match /^[a-z0-9]+(-[a-z0-9]+)*$/.",
    },
    title: { type: "string" },
    description: { type: "string" },
    prepTime: { type: "integer", minimum: 0 },
    cookTime: { type: "integer", minimum: 0 },
    servings: { type: "integer", minimum: 1 },
    difficulty: { type: "string", enum: DIFFICULTY_OPTIONS },
    category: { type: "string", enum: CATEGORY_OPTIONS },
    tags: {
      type: "array",
      minItems: 3,
      maxItems: 15,
      items: { type: "string" },
      description:
        "French tags (5-15). Cover as many dimensions as possible: diet (végétarien, vegan, sans-gluten), season (printemps, été, automne, hiver), time (rapide, long), mood (réconfortant, léger, festif), meal (plat-principal, dessert, entrée), cuisine (français, italien, asiatique), key ingredients (chocolat, poisson, volaille), practical (apéro, batch-cooking), etc.",
    },
    ingredients: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          group: { type: "string" },
          items: {
            type: "array",
            minItems: 1,
            items: { type: "string" },
          },
        },
        required: ["group", "items"],
      },
    },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
        },
        required: ["text"],
      },
    },
    tips: { type: "array", items: { type: "string" } },
    history: { type: "string" },
    source: { type: "string" },
  },
  required: [
    "slug",
    "title",
    "description",
    "prepTime",
    "cookTime",
    "servings",
    "difficulty",
    "category",
    "tags",
    "ingredients",
    "steps",
    "tips",
    "history",
    "source",
  ],
}

export const translationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          group: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["group", "items"],
      },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
        },
        required: ["text"],
      },
    },
    tips: { type: "array", items: { type: "string" } },
    history: { type: "string" },
  },
  required: [
    "title",
    "description",
    "tags",
    "ingredients",
    "steps",
    "tips",
    "history",
  ],
}

// Convention: the model is asked to fill every required field. To represent
// "not provided", it uses empty strings / empty arrays. The post-processor
// strips these so they don't end up in the published JSON.
export function stripEmpty(obj) {
  const cleaned = { ...obj }
  for (const key of ["tips", "history", "source"]) {
    if (cleaned[key] === "" || (Array.isArray(cleaned[key]) && cleaned[key].length === 0)) {
      delete cleaned[key]
    }
  }
  cleaned.ingredients = (cleaned.ingredients ?? []).map((g) => {
    const out = { items: g.items }
    if (g.group && g.group.trim()) out.group = g.group
    return out
  })
  return cleaned
}
