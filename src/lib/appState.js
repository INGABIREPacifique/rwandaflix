const WATCH_PROGRESS_KEY = 'rwandaflix_watch_progress'
const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} } }
const write = (key,value) => localStorage.setItem(key, JSON.stringify(value))
export function saveLocalProgress(titleId, seconds) { const data=read(WATCH_PROGRESS_KEY); data[titleId]={seconds:Math.max(0,Math.floor(seconds)),updatedAt:Date.now()}; write(WATCH_PROGRESS_KEY,data) }
export function getLocalProgress(titleId) { return read(WATCH_PROGRESS_KEY)[titleId] || null }
export function getAllLocalProgress() { return Object.entries(read(WATCH_PROGRESS_KEY)).map(([titleId,value])=>({titleId,...value})).sort((a,b)=>b.updatedAt-a.updatedAt) }
export function clearLocalProgress(titleId) { const data=read(WATCH_PROGRESS_KEY); delete data[titleId]; write(WATCH_PROGRESS_KEY,data) }
