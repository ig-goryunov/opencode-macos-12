import { getFilename } from "@opencode-ai/core/util/path"
import type { FilePart } from "@opencode-ai/sdk/v2"

export function attached(part: FilePart) {
  return part.url.startsWith("data:") && !inline(part)
}

export function inline(part: FilePart) {
  return part.source?.text?.start !== undefined && part.source?.text?.end !== undefined
}

export function kind(part: FilePart) {
  return part.mime.startsWith("image/") ? "image" : "file"
}

// Language display names for attachment labels. Kept as a small local map so
// the shiki language registry (hundreds of lazy grammar imports) stays out of
// the startup bundle; unknown extensions fall back to the upper-cased suffix.
const LANGUAGE_NAMES = new Map<string, string>([
  ["ts", "TypeScript"],
  ["typescript", "TypeScript"],
  ["mts", "TypeScript"],
  ["cts", "TypeScript"],
  ["tsx", "TSX"],
  ["js", "JavaScript"],
  ["javascript", "JavaScript"],
  ["mjs", "JavaScript"],
  ["cjs", "JavaScript"],
  ["jsx", "JSX"],
  ["json", "JSON"],
  ["jsonc", "JSON"],
  ["json5", "JSON5"],
  ["md", "Markdown"],
  ["markdown", "Markdown"],
  ["mdx", "MDX"],
  ["css", "CSS"],
  ["scss", "SCSS"],
  ["sass", "Sass"],
  ["less", "Less"],
  ["html", "HTML"],
  ["htm", "HTML"],
  ["xml", "XML"],
  ["svg", "SVG"],
  ["py", "Python"],
  ["python", "Python"],
  ["ipynb", "Jupyter Notebook"],
  ["rb", "Ruby"],
  ["ruby", "Ruby"],
  ["go", "Go"],
  ["rs", "Rust"],
  ["rust", "Rust"],
  ["java", "Java"],
  ["kt", "Kotlin"],
  ["kts", "Kotlin"],
  ["scala", "Scala"],
  ["groovy", "Groovy"],
  ["c", "C"],
  ["h", "C"],
  ["cc", "C++"],
  ["cpp", "C++"],
  ["cxx", "C++"],
  ["hpp", "C++"],
  ["hh", "C++"],
  ["cs", "C#"],
  ["csharp", "C#"],
  ["php", "PHP"],
  ["swift", "Swift"],
  ["m", "Objective-C"],
  ["mm", "Objective-C++"],
  ["sh", "Shell"],
  ["bash", "Bash"],
  ["zsh", "Zsh"],
  ["fish", "Fish"],
  ["ps1", "PowerShell"],
  ["pwsh", "PowerShell"],
  ["yml", "YAML"],
  ["yaml", "YAML"],
  ["toml", "TOML"],
  ["ini", "INI"],
  ["env", "Dotenv"],
  ["sql", "SQL"],
  ["graphql", "GraphQL"],
  ["gql", "GraphQL"],
  ["proto", "Protocol Buffer"],
  ["dart", "Dart"],
  ["lua", "Lua"],
  ["r", "R"],
  ["jl", "Julia"],
  ["ex", "Elixir"],
  ["exs", "Elixir"],
  ["erl", "Erlang"],
  ["hrl", "Erlang"],
  ["hs", "Haskell"],
  ["ml", "OCaml"],
  ["clj", "Clojure"],
  ["cljs", "Clojure"],
  ["zig", "Zig"],
  ["nim", "Nim"],
  ["v", "V"],
  ["pl", "Perl"],
  ["pm", "Perl"],
  ["tex", "LaTeX"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
  ["astro", "Astro"],
  ["dockerfile", "Docker"],
  ["docker", "Docker"],
  ["makefile", "Makefile"],
  ["make", "Makefile"],
  ["cmake", "CMake"],
  ["gradle", "Gradle"],
  ["tf", "Terraform"],
  ["hcl", "HCL"],
  ["nix", "Nix"],
  ["csv", "CSV"],
  ["tsv", "TSV"],
  ["log", "Log"],
  ["txt", "Text"],
])

// attachments carry text/plain for all text files, so the label comes from the extension;
// filename may be an absolute path, so extract the basename before looking for one
export function typeLabel(filename: string, mime: string, fallback: string) {
  if (mime === "application/pdf") return "PDF"
  const base = getFilename(filename)
  // idx 0 is a dotfile like .gitignore, not an extension
  const idx = base.lastIndexOf(".")
  const suffix = idx <= 0 ? "" : base.slice(idx + 1).toLowerCase()
  if (!suffix) return fallback
  return LANGUAGE_NAMES.get(suffix) ?? suffix.toUpperCase()
}
