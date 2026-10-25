import { execFile } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)

export type WorktreeInfo = { path: string; branch: string; main: boolean }
export type WorktreeResult = { ok: boolean; error?: string }

export function validWorktreeName(name: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(name)
}

function message(error: unknown) {
  if (error && typeof error === "object" && "stderr" in error) {
    const stderr = String((error as { stderr?: string }).stderr ?? "").trim()
    if (stderr) return stderr
  }
  return error instanceof Error ? error.message : String(error)
}

async function git(directory: string, args: string[]) {
  const { stdout } = await run("git", ["-C", directory, ...args], { maxBuffer: 16 * 1024 * 1024 })
  return stdout.trim()
}

export const worktree = {
  async list(directory: string): Promise<{ ok: boolean; worktrees?: WorktreeInfo[]; error?: string }> {
    try {
      const output = await git(directory, ["worktree", "list", "--porcelain"])
      const worktrees: WorktreeInfo[] = output
        .split("\n\n")
        .map((block, index) => {
          const lines = block.split("\n")
          const path = lines.find((line) => line.startsWith("worktree "))?.slice("worktree ".length)
          const branch = lines
            .find((line) => line.startsWith("branch "))
            ?.slice("branch ".length)
            .replace(/^refs\/heads\//, "")
          if (!path) return undefined
          return { path, branch: branch ?? "", main: index === 0 }
        })
        .filter((item): item is WorktreeInfo => !!item)
      return { ok: true, worktrees }
    } catch (error) {
      return { ok: false, error: message(error) }
    }
  },

  async create(
    directory: string,
    input: { name: string },
  ): Promise<{ ok: boolean; path?: string; branch?: string; error?: string }> {
    try {
      const root = await git(directory, ["rev-parse", "--show-toplevel"])
      const name = (input.name ?? "").trim()
      if (!validWorktreeName(name)) return { ok: false, error: "invalid-name" }
      const path = join(root, ".worktrees", name)
      const branch = `worktree-${name}`
      try {
        await git(root, ["worktree", "add", "-b", branch, path, "HEAD"])
      } catch (error) {
        if (!/already exists/i.test(message(error))) throw error
        await git(root, ["worktree", "add", path, branch])
      }
      const common = await git(root, ["rev-parse", "--git-common-dir"])
      const exclude = join(common.startsWith("/") ? common : join(root, common), "info", "exclude")
      const current = await readFile(exclude, "utf8").catch(() => "")
      if (!current.split("\n").some((line) => line.trim() === "/.worktrees/")) {
        await writeFile(exclude, `${current}${current.endsWith("\n") || !current ? "" : "\n"}/.worktrees/\n`)
      }
      return { ok: true, path, branch }
    } catch (error) {
      return { ok: false, error: message(error) }
    }
  },

  async remove(directory: string, path: string): Promise<WorktreeResult> {
    try {
      if (!path) return { ok: false, error: "missing-path" }
      const listed = await worktree.list(directory)
      if (!listed.ok || !listed.worktrees) return { ok: false, error: listed.error ?? "list-failed" }
      const known = listed.worktrees.some((item) => !item.main && item.path === path)
      if (!known) return { ok: false, error: "not-a-worktree" }
      await git(directory, ["worktree", "remove", path])
      return { ok: true }
    } catch (error) {
      return { ok: false, error: message(error) }
    }
  },
}
