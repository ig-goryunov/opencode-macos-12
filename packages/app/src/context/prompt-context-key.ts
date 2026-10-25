import { checksum } from "@opencode-ai/core/util/encode"
import type { ContextItem } from "./prompt-state"

export function contextItemKey(item: ContextItem) {
  const comment = item.comment?.trim()
  const digest = () => (comment ? (checksum(comment) ?? comment).slice(0, 8) : undefined)
  if (item.type === "element") {
    const key = `${item.type}:${item.path}:${item.selector ?? ""}`
    const id = digest()
    return id ? `${key}:c=${id}` : key
  }
  const start = item.selection?.startLine
  const end = item.selection?.endLine
  const key = `${item.type}:${item.path}:${start}:${end}`

  if (item.commentID) return `${key}:c=${item.commentID}`
  const id = digest()
  if (!id) return key
  return `${key}:c=${id}`
}
