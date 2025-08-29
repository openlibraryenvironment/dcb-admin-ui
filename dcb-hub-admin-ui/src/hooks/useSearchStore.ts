import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { SearchCriterion } from "@models/SearchCriterion";
import { SearchField } from "@models/SearchField";

// Defines the shape of the store's state and its actions
interface SearchState {
	criteria: SearchCriterion[];
	setCriteria: (criteria: SearchCriterion[]) => void;
	addCriterion: () => void;
	removeCriterion: (id: string) => void;
	updateCriterion: (
		id: string,
		field: keyof Omit<SearchCriterion, "id">,
		value: string,
	) => void;
}

// Defines the default state for a single search criterion
const createDefaultCriterion = (): SearchCriterion => ({
	id: uuidv4(),
	field: SearchField.Keyword,
	value: "",
	operator: "AND",
});

// Create the Zustand store
export const useSearchStore = create<SearchState>((set) => ({
	criteria: [createDefaultCriterion()],
	setCriteria: (criteria) =>
		set({
			criteria: criteria.length > 0 ? criteria : [createDefaultCriterion()],
		}),
	addCriterion: () =>
		set((state) => ({
			criteria: [
				...state.criteria,
				{
					id: uuidv4(),
					field: SearchField.Title,
					value: "",
					operator: "AND",
				},
			],
		})),
	removeCriterion: (id) =>
		set((state) => ({
			criteria: state.criteria.filter((c) => c.id !== id),
		})),
	updateCriterion: (id, field, value) =>
		set((state) => ({
			criteria: state.criteria.map((c) =>
				c.id === id ? { ...c, [field]: value } : c,
			),
		})),
}));
