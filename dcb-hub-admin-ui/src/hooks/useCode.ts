import { create } from "zustand"

// For managing the few global state things not covered by Apollo
// Won't stay as just 'code' - add as necessary.

// Do we need to fold all non react-query state values into this?

type State = {
    code: string,
    category: string
}
  
type Action = {
    updateCode: (code: State['code']) => void,
    updateCategory: (category: State['category']) => void,
}
  
  // Create the store, which includes both state and (optionally) actions https://docs.pmnd.rs/zustand/guides/updating-state
const useCode = create<State & Action>((set) => ({
    code: '',
    category: 'CirculationStatus',
    updateCode: (code) => set(() => ({ code: code })),
    updateCategory: (category) => set(() => ({ category: category } )),
}))

export default useCode;