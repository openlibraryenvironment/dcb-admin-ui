import * as Yup from "yup";

// dcb-service's limit, so an over-long note is named before it is sent. The server still decides.
export const PATRON_REQUEST_NOTE_MAX = 2000;

export interface PatronRequestNoteFormData {
	body: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function buildPatronRequestNoteSchema(t: Translate) {
	return Yup.object().shape({
		body: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("patron_request.notes.body"),
				}),
			)
			.max(
				PATRON_REQUEST_NOTE_MAX,
				t("ui.validation.max_length", { length: PATRON_REQUEST_NOTE_MAX }),
			),
	});
}
