import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";

import { alarmDetailEntries } from "@helpers/alarmDetails";

/** An alarm's details as labelled lines rather than raw JSON. */
export default function AlarmDetails({ details }: { details: unknown }) {
	const { t } = useTranslation();
	const entries = alarmDetailEntries(details);

	if (entries.length === 0) {
		return (
			<Typography variant="attributeText">{t("alarms.detail.none")}</Typography>
		);
	}

	return (
		<Box
			component="dl"
			sx={{
				display: "grid",
				gridTemplateColumns: "max-content 1fr",
				columnGap: 2,
				rowGap: 0.5,
				m: 0,
			}}
		>
			{entries.map((entry) => (
				<Box key={entry.key} sx={{ display: "contents" }}>
					<Typography
						component="dt"
						variant="body2"
						sx={{ fontWeight: "bold" }}
					>
						{entry.labelKey ? t(entry.labelKey) : entry.fallbackLabel}
					</Typography>
					<Typography
						component="dd"
						variant="body2"
						sx={{
							m: 0,
							minWidth: 0,
							overflowWrap: "anywhere",
							...(entry.structured && {
								fontFamily: "monospace",
								whiteSpace: "pre-wrap",
							}),
						}}
					>
						{entry.value}
					</Typography>
				</Box>
			))}
		</Box>
	);
}
