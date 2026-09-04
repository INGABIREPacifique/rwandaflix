import { RwandaFlixContext, useRwandaFlixInternal } from '../lib/useRwandaFlix'

export default function RwandaFlixProvider({ children }) {
  const value = useRwandaFlixInternal()
  return <RwandaFlixContext.Provider value={value}>{children}</RwandaFlixContext.Provider>
}
