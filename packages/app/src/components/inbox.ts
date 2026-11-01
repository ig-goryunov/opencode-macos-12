import { createMemo } from "solid-js"
import { useNotification } from "@/context/notification"
import { useServerSync } from "@/context/server-sync"
import { displayName } from "@/pages/layout/helpers"

export type InboxKind = "permission" | "error" | "unread" | "working"

export type InboxItem = {
  id: string
  title: string
  directory: string
  project: string
  kind: InboxKind
  count: number
  updated: number
}

const kindOrder: Record<InboxKind, number> = {
  permission: 0,
  error: 1,
  unread: 2,
  working: 3,
}

export function useInbox() {
  const serverSync = useServerSync()
  const notification = useNotification()

  const items = createMemo<InboxItem[]>(() => {
    const data = serverSync().session.data
    const sessions = Object.values(data.info).filter((session) => !!session)
    const result: InboxItem[] = []
    for (const session of sessions) {
      if (session.parentID) continue
      if (session.time?.archived) continue
      const permissions = data.permission[session.id]?.length ?? 0
      const unseen = notification.session.unseenCount(session.id)
      const hasError = notification.session.unseenHasError(session.id)
      const status = data.session_status[session.id]
      const working = !!status && status.type !== "idle"
      if (!permissions && !unseen && !working) continue
      const kind: InboxKind = permissions ? "permission" : hasError ? "error" : unseen ? "unread" : "working"
      result.push({
        id: session.id,
        title: session.title?.trim() ?? "",
        directory: session.directory,
        project: displayName({ worktree: session.directory }),
        kind,
        count: permissions || unseen || 1,
        updated: session.time?.updated ?? session.time?.created ?? 0,
      })
    }
    return result.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || b.updated - a.updated).slice(0, 100)
  })

  const attention = createMemo(() => items().filter((item) => item.kind !== "working").length)

  return { items, attention }
}
