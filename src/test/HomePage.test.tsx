import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, beforeEach } from "vitest"
import i18n from "i18next"
import { HomePage } from "@/pages/HomePage"

const mockRecipes = [
  {
    slug: "soupe-a-l-oignon",
    title: "Soupe à l'oignon",
    description: "La soupe gratinée des bistrots parisiens.",
    images: { cover: "images/recipes/soupe-a-l-oignon/cover.svg", web: "images/recipes/soupe-a-l-oignon/cover.svg" },
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: "Moyen" as const,
    category: "Entrées",
    tags: ["soupe", "bistrot"],
  },
  {
    slug: "tarte-tatin",
    title: "Tarte Tatin",
    description: "La tarte aux pommes caramélisée et renversée.",
    images: { cover: "images/recipes/tarte-tatin/cover.svg", web: "images/recipes/tarte-tatin/cover.svg" },
    prepTime: 30,
    cookTime: 0,
    servings: 8,
    difficulty: "Facile" as const,
    category: "Desserts",
    tags: ["dessert", "pomme"],
  },
]

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe("HomePage", () => {
  beforeEach(() => {
    i18n.changeLanguage("en")
    globalThis.fetch = async () =>
      ({
        json: async () => mockRecipes,
      }) as Response
  })

  it("renders category cards after loading", async () => {
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/1 — Entrées/)).toBeInTheDocument()
      expect(screen.getByText(/1 — Desserts/)).toBeInTheDocument()
    })
  })

  it("renders the hero headline", () => {
    renderHomePage()
    expect(screen.getByText("Bon appétit")).toBeInTheDocument()
  })

  it("renders search input", () => {
    renderHomePage()
    expect(screen.getByPlaceholderText("Search a recipe...")).toBeInTheDocument()
  })

  it("links category cards to filtered recipes page", async () => {
    renderHomePage()
    await waitFor(() => {
      const entreesLink = screen.getByText(/1 — Entrées/).closest("a")
      expect(entreesLink).toHaveAttribute("href", "/recipes?category=Entr%C3%A9es")
    })
  })

  it("replaces category cards with recipe results when searching", async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/1 — Entrées/)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText("Search a recipe...")
    await user.type(input, "oignon")

    await waitFor(() => {
      expect(screen.getByText("Soupe à l'oignon")).toBeInTheDocument()
      expect(screen.queryByText(/1 — Entrées/)).not.toBeInTheDocument()
    })
  })

  it("restores category cards when search is cleared", async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/1 — Entrées/)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText("Search a recipe...")
    await user.type(input, "oignon")
    await waitFor(() => {
      expect(screen.queryByText(/1 — Entrées/)).not.toBeInTheDocument()
    })

    await user.clear(input)
    await waitFor(() => {
      expect(screen.getByText(/1 — Entrées/)).toBeInTheDocument()
    })
  })

  it("shows empty state when search has no matches", async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/1 — Entrées/)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText("Search a recipe...")
    await user.type(input, "xyznotarecipe")

    await waitFor(() => {
      expect(screen.getByText("The pot is empty!")).toBeInTheDocument()
      expect(screen.queryByText(/1 — Entrées/)).not.toBeInTheDocument()
    })
  })
})
