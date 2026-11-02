import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
	useRegisterSetupDirty,
	useSetupRunActions,
} from "@components/Setup/setupRun";
import {
	newLibrarySchema,
	type NewLibraryFormValues,
} from "@schemas/newLibrarySchema";
import type { LibraryFormDefaults } from "@forms/NewLibrary/libraryPayloads";

/**
 * The form one chapter of library setup edits. Every chapter uses the whole library schema
 * so the step components keep working unchanged, and validates only its own fields.
 */
export function useLibraryChapterForm(
	chapterId: string,
	defaultValues: LibraryFormDefaults,
	fields: (keyof NewLibraryFormValues)[],
) {
	const methods = useForm<NewLibraryFormValues>({
		mode: "onTouched",
		resolver: zodResolver(newLibrarySchema) as Resolver<NewLibraryFormValues>,
		defaultValues,
	});

	useRegisterSetupDirty(chapterId, methods.formState.isDirty);
	const { clearDirty } = useSetupRunActions();

	/**
	 * Saved: the form's baseline moves to these values, and the unsaved-work guard is told
	 * at once. Dirty state reaches it in an effect, a render after a navigation made now.
	 */
	const markSaved = (values: NewLibraryFormValues) => {
		methods.reset(values);
		clearDirty();
	};

	/**
	 * Valid, or focus is on the first field that is not. A field name such as `contacts`
	 * names a subtree with no input of its own, so this walks down to a leaf.
	 */
	const validate = async (): Promise<boolean> => {
		if (fields.length === 0 || (await methods.trigger(fields))) return true;

		const leafOf = (node: any, trail: string[]): string | undefined => {
			if (!node || typeof node !== "object") return undefined;
			if ("message" in node || "ref" in node) return trail.join(".");
			for (const key of Object.keys(node)) {
				const found = leafOf(node[key], [...trail, key]);
				if (found) return found;
			}
			return undefined;
		};
		for (const name of fields) {
			const target = leafOf((methods.formState.errors as any)[name], [name]);
			if (target) {
				methods.setFocus(target as any);
				break;
			}
		}
		return false;
	};

	return { methods, validate, markSaved };
}
