import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, it, expect, beforeEach } from "vitest"
import i18n from "i18next"
import { RecipePage } from "@/pages/RecipePage"

const mockRecipe = {
  slug: "soupe-a-l-oignon",
  title: "Soupe à l'oignon",
  description: "La soupe gratinée des bistrots parisiens.",
  images: { cover: "images/recipes/soupe-a-l-oignon/cover.svg", web: "images/recipes/soupe-a-l-oignon/cover.svg" },
  prepTime: 10,
  cookTime: 15,
  servings: 4,
  difficulty: "Moyen",
  category: "Entrées",
  tags: ["soupe", "bistrot"],
  ingredients: [{ items: ["6 oignons", "1 l de bouillon"] }],
  steps: [{ text: "Émincer les oignons." }, { text: "Faire revenir les oignons." }],
  tips: ["Utiliser du comté bien affiné."],
}

function renderRecipePage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/recipe/${slug}`]}>
      <Routes>
        <Route path="/recipe/:slug" element={<RecipePage />} />
        <Route path="/recipes" element={<div data-testid="recipes-page" />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("RecipePage", () => {
  beforeEach(() => {
    i18n.changeLanguage("en")
    globalThis.fetch = async () =>
      ({
        ok: true,
        json: async () => mockRecipe,
      }) as Response
  })

  it("renders recipe title in hero card", async () => {
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getByText("Soupe à l'oignon")).toBeInTheDocument()
    })
  })

  it("renders prep and cook times", async () => {
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getByText(/Prep:/)).toBeInTheDocument()
      expect(screen.getByText("10 min")).toBeInTheDocument()
      expect(screen.getByText(/Cook:/)).toBeInTheDocument()
      expect(screen.getByText("15 min")).toBeInTheDocument()
    })
  })

  it("shows ingredients tab by default with checkable items", async () => {
    const user = userEvent.setup()
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getAllByText("6 oignons")[0]).toBeInTheDocument()
      expect(screen.getAllByText("1 l de bouillon")[0]).toBeInTheDocument()
    })

    // Click label to check an ingredient (first occurrence = mobile section)
    const label = screen.getAllByText("6 oignons")[0].closest("label")!
    await user.click(label)
    expect(screen.getAllByText("6 oignons")[0]).toHaveClass("line-through")
  })

  it("switches to instructions tab", async () => {
    const user = userEvent.setup()
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getAllByText("6 oignons")[0]).toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Instructions" }))
    expect(screen.getAllByText("Émincer les oignons.")[0]).toBeInTheDocument()
    expect(screen.getAllByText("Faire revenir les oignons.")[0]).toBeInTheDocument()
  })

  it("shows not found for missing recipe", async () => {
    globalThis.fetch = async () =>
      ({ ok: false } as Response)

    renderRecipePage("nonexistent")
    await waitFor(() => {
      expect(screen.getByText("Recipe not found")).toBeInTheDocument()
    })
  })

  it("renders tips section", async () => {
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getByText("Soupe à l'oignon")).toBeInTheDocument()
    })
    expect(screen.getByText("Utiliser du comté bien affiné.")).toBeInTheDocument()
  })

  it("renders tags as links to /recipes?tag=<tag>", async () => {
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getByText("soupe")).toBeInTheDocument()
    })
    const soupeLink = screen.getByText("soupe").closest("a")!
    expect(soupeLink).toHaveAttribute("href", "/recipes?tag=soupe")
    const bistrotLink = screen.getByText("bistrot").closest("a")!
    expect(bistrotLink).toHaveAttribute("href", "/recipes?tag=bistrot")
  })

  it("navigates to recipes page filtered by tag when tag is clicked", async () => {
    const user = userEvent.setup()
    renderRecipePage("soupe-a-l-oignon")
    await waitFor(() => {
      expect(screen.getByText("soupe")).toBeInTheDocument()
    })
    await user.click(screen.getByText("soupe").closest("a")!)
    await waitFor(() => {
      expect(screen.getByTestId("recipes-page")).toBeInTheDocument()
    })
  })
})
