# AGENTS.md

Guidance for AI coding assistants (Mistral's Le Chat / Codestral / aider / Continue / Cursor / etc.) working in this repository.

## Project overview

Recettes Familiales is a family-recipe cookbook web app built with React 19, TypeScript, Vite, and Tailwind CSS v4. It deploys to GitHub Pages as the user site `https://jonasn5.github.io/` (repo: `jonasN5/jonasN5.github.io`, Vite `base: "/"`). Recipe data is static JSON served from `public/data/recipes/`. There is no runtime backend.

## Commands

- Dev server: `npm run dev`
- Build: `npm run build` (runs `tsc -b && vite build`)
- Lint: `npm run lint`
- Run tests: `npm run test`
- Validate recipes only: `npm run validate:recipes`

## Architecture

### Routing & data

`react-router-dom` with `HashRouter` (GitHub Pages-friendly). Routes: `/`, `/recipes`, `/recipe/:slug`, `/about`. Every page fetches JSON at runtime using `import.meta.env.BASE_URL` as prefix.

- `public/data/recipes/index.json` — array of recipe summaries
- `public/data/recipes/{slug}.json` — full recipe detail
- `public/images/recipes/{slug}/cover.{jpg,svg}` — cover image

### Schema invariants

- Recipe types live in `src/types/recipe.ts`; Zod schemas in `src/lib/recipeSchema.ts`.
- The canonical difficulty enum is `"Facile" | "Medio" | "Difficile"` (from the source project). UI translates these via `difficulties.*` keys.
- Canonical category names are Italian-derived (`Pasta`, `Antipasti`, `Dolci`, ...) and translated via `categories.*` keys.
- Base recipe language is French; translations live under `translations.en` and `translations.it`.
- All 5–15 tags per recipe are in French (canonical); they're translated via `tags.*` keys.

### Components

- `src/components/ui/` — shadcn/ui-style primitives
- `src/components/` — app components (Layout, RecipeCard, RecipeGrid, SearchBar, FilterDrawer)
- `src/pages/` — route-level pages
- `src/lib/` — utilities (recipe schema, categories sort, localize helper)

### Path alias

`@/` maps to `./src/` (see `tsconfig.app.json` and `vite.config.ts`).

## Recipe intake pipeline (Mistral-powered)

`.github/workflows/add-recipe-mistral.yml` listens to `issues: [opened, labeled, edited]`. When an issue is labelled `recipe-submission`, it runs `node scripts/add-recipe.mjs`, which:

1. Reads the issue payload from `$GITHUB_EVENT_PATH`.
2. Dispatches on the issue label: structured form (`recipe-submission` only), file upload (`needs-formatting` + attached image/PDF) or URL paste.
3. Calls Mistral AI via the `@mistralai/mistralai` SDK with a strict JSON schema matching `RecipeDetailSchema`.
4. Generates EN and IT translations in a second Mistral call.
5. Writes `public/data/recipes/{slug}.json`, updates `index.json`, optionally fetches a cover image from Unsplash.
6. Pushes a branch `recipe/{slug}` and opens a PR.

Per-model choices (configurable via env vars on the workflow):

- `MISTRAL_MODEL_TEXT` — default `mistral-small-latest` (structured extraction, translation)
- `MISTRAL_MODEL_VISION` — default `pixtral-12b-2409` (image submissions)

Secrets required: `MISTRAL_API_KEY`. Optional: `UNSPLASH_ACCESS_KEY`.

## Known gaps

- **No `@mistral` PR coding assistant** equivalent to `claude-pr-comment.yml`. Mistral has no first-party GitHub Action matching `anthropics/claude-code-action`; if you need one, a community action wrapping `mistral-small-latest` can be added later.
- **`GITHUB_TOKEN` can't trigger downstream workflows.** PRs opened by the intake bot won't auto-run CI. Swap for a PAT if you need that.
- **Mistral free-tier limits shift.** Keep the model name configurable via env var so the pipeline can fall back to an open-weight model if the free tier tightens.

## House style

- No comments explaining *what* code does — names are enough. Only comment the *why* for non-obvious constraints.
- No trailing "I have now done X" summaries in commit messages or PR bodies — describe what and why.
- Use the existing Zod schemas (`RecipeDetailSchema`, `RecipeIndexSchema`) as the single source of truth for recipe shape; don't duplicate the schema in prompts or elsewhere.
