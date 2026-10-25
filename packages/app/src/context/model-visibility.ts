export type ModelVisibility = "show" | "hide"

export type ModelVisibilityEntry = {
  providerID: string
  modelID: string
  visibility: ModelVisibility
}

/**
 * Applies one visibility to every known model while keeping any other fields of
 * the entries that are already stored (favourites, ordering).
 */
export function applyVisibilityAll<T extends ModelVisibilityEntry>(
  current: T[],
  models: { providerID: string; modelID: string }[],
  state: ModelVisibility,
): T[] {
  const map = new Map(current.map((item) => [`${item.providerID}:${item.modelID}`, item]))
  for (const model of models) {
    const id = `${model.providerID}:${model.modelID}`
    const stored = map.get(id)
    map.set(id, { ...(stored ?? model), visibility: state } as T)
  }
  return [...map.values()]
}
