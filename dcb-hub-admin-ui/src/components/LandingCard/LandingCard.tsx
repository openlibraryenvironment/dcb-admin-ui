import { useTranslation, Trans } from "react-i18next"; // Swapped next-i18next for react-i18next
import ReactMarkdown from "react-markdown";
import { isEmpty } from "lodash";
import {
	CardContent,
	CardMedia,
	Stack,
	Typography,
	CardActions,
	Button,
	Card,
	Box,
} from "@mui/material";

import Link from "@components/Link/Link";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";

// Bundled assets (they live in src/assets, not public/) - import so Vite emits a
// hashed URL that resolves on any route. Referencing them as "./assets/..."
// string paths pointed at a non-existent public/ file, so the images 404'd.
import kIntLogo from "@assets/brand/Knowledge-Integration_48px.png";
import openRSLogo from "@assets/brand/OpenRS_48px.png";
import fallbackAbout from "@assets/brand/fallback-about.png";

export default function LandingCard() {
	const { t } = useTranslation();

	const {
		displayName,
		aboutImageURL,
		catalogueSearchURL,
		websiteURL,
		description,
	} = useConsortiumInfoStore();

	return (
		<Stack
			direction={{ xs: "column", sm: "column", md: "row", lg: "row" }}
			spacing={4}
			sx={{
				p: "16px",
				pt: "48px",
				pb: "48px",
			}}
		>
			<Card
				elevation={3}
				sx={{
					p: 3,
					backgroundColor: "primary.landingCard",
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CardContent>
					<Stack direction="column" spacing={3}>
						<CardMedia sx={{ justifyContent: "center", display: "flex" }}>
							<a href="https://www.openrs.org/">
								<Box
									component="img"
									src={openRSLogo}
									alt={String(t("ui.logo", { owner: "OpenRS" }))}
									title={String(t("ui.logo", { owner: "OpenRS" }))}
									sx={{
										height: 48,
									}}
								/>
							</a>
						</CardMedia>
						<Typography variant="h2" sx={{ fontSize: 32 }}>
							{t("openrs.about")}
						</Typography>
						<Typography variant="loginCardText" component="div">
							<Trans
								i18nKey="openrs.description"
								t={t}
								components={{
									linkComponent: (
										<Link
											key="openRS-info"
											href="https://openlibraryfoundation.org/"
										/>
									),
									paragraph: <p />,
								}}
							/>
						</Typography>
					</Stack>
				</CardContent>
				<CardActions disableSpacing sx={{ mt: "auto" }}>
					<Button
						size="medium"
						href="https://www.openrs.org/"
						target="_blank"
						rel="noopener"
					>
						<Typography variant="cardActionText">
							{t("openrs.participate")}
						</Typography>
					</Button>
				</CardActions>
			</Card>
			<Card
				elevation={3}
				sx={{
					p: 3,
					backgroundColor: "primary.landingCard",
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CardContent>
					<Stack direction="column" spacing={3}>
						<CardMedia sx={{ justifyContent: "center", display: "flex" }}>
							<a href="https://www.k-int.com/">
								<Box
									component="img"
									src={kIntLogo}
									alt={String(t("ui.logo", { owner: "Knowledge Integration" }))}
									title={String(
										t("ui.logo", { owner: "Knowledge Integration" }),
									)}
									sx={{
										height: 48,
									}}
								/>
							</a>
						</CardMedia>
						<Typography variant="h2" sx={{ fontSize: 32 }}>
							{t("openrs.dcb.about")}
						</Typography>
						<Typography variant="loginCardText" component="div">
							<Trans
								i18nKey="openrs.dcb.description"
								t={t}
								components={{
									linkComponent: (
										<Link key="dcb-info" href="https://www.k-int.com/" />
									),
									paragraph: <p />,
								}}
							/>
						</Typography>
					</Stack>
				</CardContent>
				<CardActions disableSpacing sx={{ mt: "auto" }}>
					<Button
						size="medium"
						href="https://knowint.zendesk.com/"
						target="_blank"
						rel="noopener"
					>
						<Typography variant="cardActionText">
							{t("support.submit_ticket")}
						</Typography>
					</Button>
				</CardActions>
			</Card>
			<Card
				elevation={3}
				sx={{
					p: 3,
					backgroundColor: "primary.landingCard",
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CardContent>
					<Stack direction="column" spacing={3}>
						<CardMedia sx={{ justifyContent: "center", display: "flex" }}>
							{websiteURL ? (
								<a href={websiteURL}>
									<Box
										component="img"
										src={isEmpty(aboutImageURL) ? fallbackAbout : aboutImageURL}
										alt={String(t("ui.logo", { owner: displayName }))}
										title={String(t("ui.logo", { owner: displayName }))}
										sx={{
											height: 48,
											width: 180,
											objectFit: "contain",
										}}
									/>
								</a>
							) : (
								<Box
									component="img"
									src={isEmpty(aboutImageURL) ? fallbackAbout : aboutImageURL}
									alt={String(t("ui.logo", { owner: displayName }))}
									title={String(t("ui.logo", { owner: displayName }))}
									sx={{
										height: 48,
										width: 180,
										objectFit: "contain",
									}}
								/>
							)}
						</CardMedia>
						<Typography variant="h2" sx={{ fontSize: 32 }}>
							{displayName !== "OpenRS Consortium"
								? t("consortium.about", { consortium: displayName })
								: t("consortium.about_generic")}
						</Typography>

						{isEmpty(description) ? (
							<Typography variant="loginCardText" component="div">
								<Trans
									i18nKey="consortium.description_generic"
									t={t}
									components={{ paragraph: <p /> }}
								/>
							</Typography>
						) : (
							<ReactMarkdown
								components={{
									p: ({ children }) => (
										<Typography variant="loginCardText">{children}</Typography>
									),
								}}
							>
								{description || ""}
							</ReactMarkdown>
						)}
					</Stack>
				</CardContent>

				{catalogueSearchURL && (
					<CardActions disableSpacing sx={{ mt: "auto" }}>
						<Button
							size="medium"
							href={catalogueSearchURL}
							target="_blank"
							rel="noopener"
						>
							<Typography variant="cardActionText">
								{t("consortium.search", { consortium: displayName })}
							</Typography>
						</Button>
					</CardActions>
				)}
			</Card>
		</Stack>
	);
}
