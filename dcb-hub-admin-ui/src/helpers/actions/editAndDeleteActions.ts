import { Dispatch, RefObject, SetStateAction } from "react";

/**
 * Puts a details page into edit mode and moves focus to its first editable
 * field. Without the focus move the page silently swaps read-only text for
 * inputs with focus left on the Edit button that just disappeared - a WCAG
 * 2.4.7 / 3.2.2 failure.
 *
 * The save/cancel/delete helpers that used to live alongside this have been
 * replaced by `useEntityMutation`: they took eight and eleven positional
 * arguments respectively, and the delete one never invalidated any query, so a
 * deleted record stayed on screen in every list that had already been fetched.
 */
export const handleEdit =
	(
		setEditMode: Dispatch<SetStateAction<boolean>>,
		firstEditableFieldRef: RefObject<HTMLInputElement | null>,
	) =>
	() => {
		setEditMode(true);
		requestAnimationFrame(() => {
			if (firstEditableFieldRef.current) {
				firstEditableFieldRef.current.focus();
			}
		});
	};
