export type TimelineDetailPreset = "everything" | "detailed" | "compact" | "quiet"

export type TimelineDetailFlags = {
  showReasoningSummaries: boolean
  shellToolPartsExpanded: boolean
  editToolPartsExpanded: boolean
  timelineCollapseTools: boolean
}

export const timelineDetailPresets = [
  {
    id: "quiet",
    value: {
      showReasoningSummaries: false,
      shellToolPartsExpanded: false,
      editToolPartsExpanded: false,
      timelineCollapseTools: true,
    },
  },
  {
    id: "compact",
    value: {
      showReasoningSummaries: false,
      shellToolPartsExpanded: false,
      editToolPartsExpanded: false,
      timelineCollapseTools: false,
    },
  },
  {
    id: "detailed",
    value: {
      showReasoningSummaries: true,
      shellToolPartsExpanded: true,
      editToolPartsExpanded: false,
      timelineCollapseTools: false,
    },
  },
  {
    id: "everything",
    value: {
      showReasoningSummaries: true,
      shellToolPartsExpanded: true,
      editToolPartsExpanded: true,
      timelineCollapseTools: false,
    },
  },
] as const satisfies readonly { id: TimelineDetailPreset; value: TimelineDetailFlags }[]

const flagKeys = [
  "showReasoningSummaries",
  "shellToolPartsExpanded",
  "editToolPartsExpanded",
  "timelineCollapseTools",
] as const

export function timelineDetailPreset(flags: TimelineDetailFlags) {
  return timelineDetailPresets.find((preset) => flagKeys.every((key) => preset.value[key] === flags[key]))
}
