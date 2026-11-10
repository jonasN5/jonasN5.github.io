// "### Heading\n\nvalue" sections of an issue-form body, keyed by heading.
export function parseIssueSections(body) {
  const sections = {}
  for (const part of (body || "").split(/^### /m).slice(1)) {
    const [heading, ...rest] = part.split("\n")
    const value = rest.join("\n").trim()
    sections[heading.trim()] = value === "_No response_" ? "" : value
  }
  return sections
}

// Issue title minus the "[Recette]" prefix the templates pre-fill.
export function titleHintFromIssue(issue) {
  return (issue.title || "").replace(/^\s*\[recette\]\s*/i, "").trim()
}
