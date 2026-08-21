const KEY = 'mtm_state_v1'

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // stockage indisponible (mode privé, quota...) : on ignore silencieusement
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
