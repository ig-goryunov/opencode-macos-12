import { execFile, execFileSync, spawn } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, renameSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, dirname, join } from "node:path"

const flag = "--opencode-apply-update"

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function isApplyUpdateRequest(): boolean {
  return process.argv.includes(flag)
}

export function spawnApplyUpdate(zipPath: string) {
  spawn(process.execPath, [flag, zipPath], { detached: true, stdio: "ignore" }).unref()
}

export async function runApplyUpdate(): Promise<void> {
  const index = process.argv.indexOf(flag)
  const zipPath = process.argv[index + 1]
  if (!zipPath) process.exit(1)

  await sleep(2000)

  const exe = process.execPath
  const appBundle = dirname(dirname(exe))
  const appName = basename(appBundle)

  const tmp = mkdtempSync(join(tmpdir(), "opencode-app-update-"))
  try {
    execFileSync("ditto", ["-x", "-k", zipPath, tmp], { stdio: "ignore" })
    const extracted = join(tmp, appName)
    if (!existsSync(join(extracted, "Contents", "MacOS", appName.replace(/\.app$/, "")))) {
      process.exit(1)
    }
    rmSync(appBundle, { recursive: true, force: true })
    renameSync(extracted, appBundle)
  } catch {
    process.exit(1)
  } finally {
    rmSync(tmp, { recursive: true, force: true })
  }

  await new Promise<void>((resolve) => {
    execFile("open", [appBundle], () => resolve())
  })
  process.exit(0)
}

export function getPendingUpdateZip(cacheDir: string): string | undefined {
  const pending = join(cacheDir, "pending")
  if (!existsSync(pending)) return
  const zips = readdirSync(pending)
    .filter((file) => file.endsWith(".zip"))
    .map((file) => join(pending, file))
  if (zips.length === 0) return
  zips.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return zips[0]
}