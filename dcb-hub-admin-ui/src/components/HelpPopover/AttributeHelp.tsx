import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";

import HelpPopover from "./HelpPopover";

/** Each names a `help.<topic>` block in the catalogue. docs/attribute-help.md */
export type HelpTopic = "patron_request_status";

/**
 * Explains an attribute and the value it holds, from `help.<topic>.values.<value>`,
 * `help.<topic>.waiting.<value>` and `help.<topic>.about`. Any may be absent; with no
 * text at all there is no button, so a value the service adds before the catalogue does
 * shows nothing rather than a raw key.
 */
export default function AttributeHelp({
	topic,
	label,
	value,
	valueLabel,
}: {
	topic: HelpTopic;
	/** The attribute's visible title. */
	label: string;
	value?: string | null;
	/** How the value reads to a person, for the heading. */
	valueLabel?: string;
}) {
	const { t, i18n } = useTranslation();

	const parts = (["values", "waiting"] as const)
		.map((part) => ({ part, key: `help.${topic}.${part}.${value}` }))
		.filter(({ key }) => value && i18n.exists(key));
	const aboutKey = `help.${topic}.about`;
	const hasAbout = i18n.exists(aboutKey);

	if (parts.length === 0 && !hasAbout) return null;

	return (
		<HelpPopover
			label={t("help.trigger", { label })}
			title={
				parts.length > 0
					? t("help.title_value", { label, value: valueLabel ?? value })
					: label
			}
		>
			{parts.length > 0 ? (
				<Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5 }}>
					{parts.map(({ part, key }) => (
						<Box key={part}>
							<Typography
								component="dt"
								variant="overline"
								color="primary"
								sx={{ display: "block", lineHeight: 1.6 }}
							>
								{t(`help.part.${part}`)}
							</Typography>
							<Typography component="dd" variant="body2" sx={{ m: 0 }}>
								{t(key)}
							</Typography>
						</Box>
					))}
				</Box>
			) : null}
			{hasAbout ? (
				<Typography
					variant="body2"
					color="text.secondary"
					sx={{ mt: parts.length > 0 ? 1.5 : 0 }}
				>
					{t(aboutKey)}
				</Typography>
			) : null}
		</HelpPopover>
	);
}
