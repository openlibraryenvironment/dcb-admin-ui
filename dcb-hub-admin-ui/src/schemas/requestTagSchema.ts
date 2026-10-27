import * as Yup from "yup";

// The same limits dcb-service enforces, so a mistake is named before saving. The server
// still decides.
export const REQUEST_TAG_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/;
export const REQUEST_TAG_LABEL_MAX = 64;
export const REQUEST_TAG_DESCRIPTION_MAX = 200;
export const REQUEST_TAG_VOCABULARY_MAX = 100;

export interface RequestTagFormData {
	code: string;
	label: string;
	description: string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function buildRequestTagSchema(t: Translate) {
	return Yup.object().shape({
		code: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("consortium.request_tags.code"),
				}),
			)
			.matches(
				REQUEST_TAG_CODE_PATTERN,
				t("consortium.request_tags.validation.code"),
			),
		label: Yup.string()
			.trim()
			.required(
				t("ui.validation.required", {
					field: t("consortium.request_tags.label"),
				}),
			)
			.max(
				REQUEST_TAG_LABEL_MAX,
				t("ui.validation.max_length", { length: REQUEST_TAG_LABEL_MAX }),
			),
		description: Yup.string()
			.trim()
			.max(
				REQUEST_TAG_DESCRIPTION_MAX,
				t("ui.validation.max_length", { length: REQUEST_TAG_DESCRIPTION_MAX }),
			),
	});
}
