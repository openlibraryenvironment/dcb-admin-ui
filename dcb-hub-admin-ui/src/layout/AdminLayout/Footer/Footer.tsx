import Link from "@components/Link/Link";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
//localisation
import { useTranslation } from "react-i18next";

import dayjs from "dayjs";
import OpenRsLogo from "@assets/brand/OpenRS_48px.png";
import { useRouter } from "@tanstack/react-router";

// this is a guess at what the width should be
// may need changing in the future
const OpenRsLogoWidth = 100;
const OpenRsLogoHeight = 32;

export default function Footer() {
	const { t } = useTranslation();
	const { cfg } = useRouter().options.context as { cfg: any };
	const theme = useTheme();

	return (
		<div>
			{/* // To add footer content, just add items to the Stack. It will adjust to accommodate */}
			<Stack
				direction="row"
				sx={{
					spacing: 2,
					alignItems: "center",
					justifyContent: "space-between",
					maxWidth: "1400px",
					margin: "auto",
					paddingLeft: "24px",
					paddingRight: "24px",
				}}
			>
				<Typography
					data-tid="footer-information"
					color={theme.palette.primary.footerText}
				>
					{
						<Link
							sx={{ color: theme.palette.primary.link }}
							className="text-decoration-none"
							href={
								"https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/"
							}
						>
							{t("app.name")}
						</Link>
					}
					{". " +
						t("app.version") +
						" " +
						cfg?.version +
						". " +
						t("app.released") +
						" " +
						dayjs(cfg?.releaseDate).format("YYYY-MM-DD") +
						"."}
				</Typography>
				{/* apply a wrapper to style the logo inline with text */}
				<Box sx={{ pt: 1.25 }}>
					<Link href={"https://www.openrs.org/"}>
						<Box
							component="img"
							src={OpenRsLogo}
							alt="OpenRS Logo"
							sx={{ width: OpenRsLogoWidth, height: OpenRsLogoHeight }}
						/>
					</Link>
				</Box>
			</Stack>
		</div>
	);
}
