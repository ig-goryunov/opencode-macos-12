import { For, Show } from "solid-js"
import { useNavigate } from "@solidjs/router"
import { Dialog } from "@opencode-ai/ui/dialog"
import { Icon } from "@opencode-ai/ui/icon"
import { useDialog } from "@opencode-ai/ui/context/dialog"
import { base64Encode } from "@opencode-ai/core/util/encode"
import { useLanguage } from "@/context/language"
import { useNotification } from "@/context/notification"
import { useInbox, type InboxItem } from "./inbox"

export function DialogInbox() {
  const language = useLanguage()
  const dialog = useDialog()
  const navigate = useNavigate()
  const notification = useNotification()
  const inbox = useInbox()

  const open = (item: InboxItem) => {
    notification.session.markViewed(item.id)
    navigate(`/${base64Encode(item.directory)}/session/${item.id}`)
    dialog.close()
  }

  return (
    <Dialog title={language.t("inbox.title")} description={language.t("inbox.description")} fit>
      <div class="flex max-h-[60vh] min-h-0 flex-col gap-2 pl-6 pr-6 pb-4">
        <Show
          when={inbox.items().length > 0}
          fallback={
            <div class="flex flex-col items-center gap-2 py-10 text-center">
              <Icon name="archive" size="large" class="text-text-weak" />
              <div class="text-13-medium text-text-base">{language.t("inbox.empty.title")}</div>
              <div class="text-12-regular text-text-weak">{language.t("inbox.empty.description")}</div>
            </div>
          }
        >
          <div class="flex min-h-0 flex-col gap-0.5 overflow-y-auto">
            <For each={inbox.items()}>
              {(item) => (
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-interactive-hover"
                  onClick={() => open(item)}
                >
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="truncate text-13-medium text-text-base">
                      {item.title || language.t("inbox.session.untitled")}
                    </span>
                    <span class="truncate text-11-regular text-text-weak">{item.project}</span>
                  </span>
                  <span
                    class="shrink-0 rounded-md bg-background-stronger px-1.5 py-0.5 text-11-regular text-text-base"
                    classList={{ "text-text-critical-base": item.kind === "error" }}
                  >
                    {language.t(`inbox.kind.${item.kind}` as Parameters<typeof language.t>[0])}
                    <Show when={item.count > 1}>
                      <span class="ml-1 text-text-weak">{item.count}</span>
                    </Show>
                  </span>
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Dialog>
  )
}
