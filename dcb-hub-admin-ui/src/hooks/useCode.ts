import { create } from "zustand";

type State = {
	code: string;
	category: string;
};

type Action = {
	updateCode: (code: State["code"]) => void;
	updateCategory: (category: State["category"]) => void;
	resetCode: () => void;
	resetAll: () => void;
};

const initialState: State = {
	code: "",
	category: "",
};

const useCode = create<State & Action>((set) => ({
	...initialState,
	updateCode: (code) => set({ code }),
	updateCategory: (category) => set({ category }),
	resetCode: () => set({ code: "" }),
	resetAll: () => set(initialState),
}));

export default useCode;
