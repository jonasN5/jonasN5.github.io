# Recettes Familiales

A warm, simple website to gather the recipes we've collected over the years — from grandparents, parents, friends, the internet or elsewhere. No ads, no popups, no accounts. Just the recipes. Bon appétit!

Forked from [`PierrickMartos/Cucina-Mia`](https://github.com/PierrickMartos/Cucina-Mia) — all the initial credit goes to him.

## How it works

New recipes are submitted through GitHub Issues using one of the three templates (structured form, file upload, URL). A GitHub Action picks up the issue, calls **Mistral AI** to extract the recipe, generate filter metadata and translate it into German, English and Spanish (with French as the source), then opens a pull request with the generated JSON.

<details>
<summary>Tech details</summary>

Built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. Deployed to GitHub Pages.

- Routing via `react-router-dom` with `HashRouter` for GitHub Pages compatibility
- Recipe data is static JSON served from `public/data/recipes/`
- Fuzzy search with **Fuse.js**
- Animations with **Motion**
- UI primitives from **shadcn/ui** (`class-variance-authority` + `tailwind-merge`)
- i18n in French (default), German, English and Spanish
- Recipe intake pipeline powered by **Mistral AI** (see `scripts/` and `.github/workflows/add-recipe-mistral.yml`)

```bash
npm run dev      # dev server
npm run build    # production build
npm run test     # run tests
npm run lint     # lint
```

</details>

## Configuration

Two GitHub Actions secrets drive the recipe intake pipeline:

- `MISTRAL_API_KEY` (required) — create one at <https://console.mistral.ai/> and set it with `gh secret set MISTRAL_API_KEY`.
- `UNSPLASH_ACCESS_KEY` (optional) — if provided, the pipeline will search Unsplash for a cover photo; otherwise it falls back to a placeholder.

## License

MIT — see `LICENSE`.
