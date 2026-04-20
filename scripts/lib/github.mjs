import { spawn } from "node:child_process"

function runGh(args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("gh", args, { stdio: ["pipe", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d.toString()))
    child.stderr.on("data", (d) => (stderr += d.toString()))
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`gh ${args.join(" ")} failed: ${stderr}`))
      else resolve(stdout.trim())
    })
    if (input !== undefined) child.stdin.end(input)
    else child.stdin.end()
  })
}

function runGit(args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (d) => (stdout += d.toString()))
    child.stderr.on("data", (d) => (stderr += d.toString()))
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`git ${args.join(" ")} failed: ${stderr}`))
      else resolve(stdout.trim())
    })
  })
}

export async function commentOnIssue(issueNumber, body) {
  await runGh(["issue", "comment", String(issueNumber), "--body-file", "-"], { input: body })
}

export async function findOpenPr(branch) {
  try {
    const output = await runGh([
      "pr",
      "list",
      "--head",
      branch,
      "--state",
      "open",
      "--json",
      "number,url",
    ])
    const parsed = JSON.parse(output || "[]")
    return parsed[0] ?? null
  } catch {
    return null
  }
}

export async function createPr({ branch, title, body }) {
  const output = await runGh([
    "pr",
    "create",
    "--base",
    "main",
    "--head",
    branch,
    "--title",
    title,
    "--body-file",
    "-",
  ], { input: body })
  const match = output.match(/https:\/\/\S+/)
  return match ? match[0] : output.trim()
}

export async function pushBranch({ repoRoot, branch }) {
  await runGit(["checkout", "-B", branch], { cwd: repoRoot })
  await runGit(["add", "-A"], { cwd: repoRoot })
  await runGit([
    "commit",
    "-m",
    `feat: add ${branch.replace(/^recipe\//, "")}`,
    "--allow-empty",
  ], { cwd: repoRoot })
  await runGit(["push", "--force-with-lease", "-u", "origin", branch], { cwd: repoRoot })
}
