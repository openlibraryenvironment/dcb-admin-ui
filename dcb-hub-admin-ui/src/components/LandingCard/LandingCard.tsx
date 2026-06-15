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

export default function LandingCard() {
	const { t } = useTranslation();

	const {
		displayName,
		aboutImageURL,
		catalogueSearchURL,
		websiteURL,
		description,
	} = useConsortiumInfoStore();

	// Serve standard static assets from Vite's public folder
	const kIntLogo = "/assets/brand/Knowledge-Integration_48px.png";
	const openRSLogo = "/assets/brand/OpenRS_48px.png";
	const fallbackAbout = "/assets/brand/fallback-about.png";

	return (
		<Stack
			direction={{ xs: "column", sm: "column", md: "row", lg: "row" }}
			spacing={4}
			p={"16px"}
			pt={"48px"}
			pb={"48px"}
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
									height={48}
									alt={t("ui.logo", { owner: "OpenRS" })}
									title={t("ui.logo", { owner: "OpenRS" })}
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
									height={48}
									alt={t("ui.logo", { owner: "Knowledge Integration" })}
									title={t("ui.logo", { owner: "Knowledge Integration" })}
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
										height={48}
										width={180}
										sx={{ objectFit: "contain" }}
										alt={t("ui.logo", { owner: { displayName } })}
										title={t("ui.logo", { owner: { displayName } })}
									/>
								</a>
							) : (
								<Box
									component="img"
									src={isEmpty(aboutImageURL) ? fallbackAbout : aboutImageURL}
									height={48}
									width={180}
									sx={{ objectFit: "contain" }}
									alt={t("ui.logo", { owner: { displayName } })}
									title={t("ui.logo", { owner: { displayName } })}
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
