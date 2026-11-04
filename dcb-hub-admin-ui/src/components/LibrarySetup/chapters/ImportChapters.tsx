import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormProvider } from "react-hook-form";

import SetupFooter from "@components/Setup/SetupFooter";
import RefValueMappingStep from "@forms/NewLibrary/steps/RefValueMappingStep";
import NumericMappingStep from "@forms/NewLibrary/steps/NumericRangeMappingStep";
import LocationsStep from "@forms/NewLibrary/steps/LocationsStep";
import { formValuesFromLibrary } from "@forms/NewLibrary/libraryPayloads";
import { invalidateLibraryCaches } from "@forms/NewLibrary/libraryCaches";
import { useLibraryChapterForm } from "../useLibraryChapterForm";
import type { LibraryChapterProps } from "./chapterProps";

/**
 * A chapter whose step writes as it goes: an import, or a mapping made in place. Continue
 * refreshes the counts the rail reads, so what was just imported shows as done.
 */
function ImportChapter({
	id,
	library,
	onNext,
	onBack,
	children,
}: LibraryChapterProps & { id: string; children: ReactNode }) {
	const queryClient = useQueryClient();
	const { methods } = useLibraryChapterForm(
		id,
		formValuesFromLibrary(library),
		[],
	);

	return (
		<>
			<FormProvider {...methods}>{children}</FormProvider>
			<SetupFooter
				onBack={onBack}
				onContinue={() => {
					void invalidateLibraryCaches(queryClient);
					onNext();
				}}
			/>
		</>
	);
}

/** "What do its patron types, item types and locations mean?" */
export const MappingsChapter = (props: LibraryChapterProps) => (
	<ImportChapter id="refMappings" {...props}>
		<RefValueMappingStep hostLmsCode={props.library.agency?.hostLms?.code} />
	</ImportChapter>
);

/** "Which numeric ranges does it use?" Sierra and Polaris only. */
export const NumbersChapter = (props: LibraryChapterProps) => (
	<ImportChapter id="numMappings" {...props}>
		<NumericMappingStep hostLmsCode={props.library.agency?.hostLms?.code} />
	</ImportChapter>
);

/** "Where can patrons collect items?" */
export const LocationsChapter = (props: LibraryChapterProps) => (
	<ImportChapter id="locations" {...props}>
		<LocationsStep
			hostLmsCode={props.library.agency?.hostLms?.code}
			hostLmsId={props.library.agency?.hostLms?.id}
			agencyCode={props.library.agencyCode ?? ""}
		/>
	</ImportChapter>
);
