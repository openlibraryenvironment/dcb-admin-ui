/** What every chapter of an existing library's setup is given by its route. */
export interface LibraryChapterProps {
	library: any;
	onNext: () => void;
	onBack: () => void;
}
