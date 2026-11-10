import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, it, expect, beforeEach } from "vitest"
import i18n from "i18next"
import { RecipeGrid } from "@/components/RecipeGrid"
import type { RecipeSummary } from "@/types/recipe"

const mockRecipes: RecipeSummary[] = [
  {
    slug: "soupe-a-l-oignon",
    title: "Soupe à l'oignon",
    description: "La soupe gratinée des bistrots parisiens.",
    images: { cover: "images/recipes/soupe-a-l-oignon/cover.svg", web: "images/recipes/soupe-a-l-oignon/cover.svg" },
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: "Moyen",
    category: "Entrées",
    tags: ["soupe"],
  },
  {
    slug: "tarte-tatin",
    title: "Tarte Tatin",
    description: "Il dolce più amato.",
    images: { cover: "images/recipes/tarte-tatin/cover.svg", web: "images/recipes/tarte-tatin/cover.svg" },
    prepTime: 30,
    cookTime: 0,
    servings: 8,
    difficulty: "Facile",
    category: "Desserts",
    tags: ["dessert"],
  },
]

function renderGrid(props: Parameters<typeof RecipeGrid>[0]) {
  return render(
    <MemoryRouter>
      <RecipeGrid {...props} />
    </MemoryRouter>
  )
}

describe("RecipeGrid", () => {
  beforeEach(() => {
    i18n.changeLanguage("en")
  })

  it("shows skeletons while loading", () => {
    const { container } = renderGrid({ recipes: [], loading: true })
    // Three skeleton placeholders rendered
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it("shows empty state when no recipes", () => {
    renderGrid({ recipes: [] })
    expect(screen.getByText("The pot is empty!")).toBeInTheDocument()
  })

  it("renders a card per recipe", () => {
    renderGrid({ recipes: mockRecipes })
    expect(screen.getByText("Soupe à l'oignon")).toBeInTheDocument()
    expect(screen.getByText("Tarte Tatin")).toBeInTheDocument()
  })

  it("links each card to its recipe detail page", () => {
    renderGrid({ recipes: mockRecipes })
    const soupeLink = screen.getByText("Soupe à l'oignon").closest("a")
    expect(soupeLink).toHaveAttribute("href", "/recipe/soupe-a-l-oignon")
    const tatinLink = screen.getByText("Tarte Tatin").closest("a")
    expect(tatinLink).toHaveAttribute("href", "/recipe/tarte-tatin")
  })
})
