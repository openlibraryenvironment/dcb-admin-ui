import {
	CardContent,
	CardMedia,
	Stack,
	Typography,
	CardActions,
	Button,
	Card,
	useTheme,
} from "@mui/material";
import { Trans, useTranslation } from "next-i18next"; //localisation
import Image from "next/image";
import Link from "@components/Link/Link";
import kIntLogo from "public/assets/brand/Knowledge-Integration_48px.png";
import openRSLogo from "public/assets/brand/OpenRS_48px.png";
import fallbackAbout from "public/assets/brand/fallback-about.png";
import { useConsortiumInfoStore } from "@hooks/consortiumInfoStore";
import ReactMarkdown from "react-markdown";
import { isEmpty } from "lodash";

// This component holds the UI elements shared between the 'landing' pages (login and logout)
// It holds the 'three cards' and associated info.

export default function LandingCard() {
	const { t } = useTranslation();
	const theme = useTheme();
	// Elevation of 3 applied to the cards for drop shadows: content spaced by '4' - 32 px
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
			p={"16px"}
			pt={"48px"}
			pb={"48px"}
		>
			<Card
				elevation={3}
				sx={{
					p: 3,
					backgroundColor: theme.palette.primary.landingCard,
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CardContent>
					<Stack direction={"column"} spacing={3}>
						<CardMedia sx={{ justifyContent: "center", display: "flex" }}>
							<a href="https://www.openrs.org/">
								<Image
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
						<Typography variant="loginCardText">
							<Trans
								i18nKey={"openrs.description"}
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
						type="text"
						href="https://www.openrs.org/"
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
					backgroundColor: theme.palette.primary.landingCard,
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CardContent>
					<Stack direction={"column"} spacing={3}>
						<CardMedia sx={{ justifyContent: "center", display: "flex" }}>
							<a href="https://www.k-int.com/">
								<Image
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
						<Typography variant="loginCardText">
							<Trans
								i18nKey={"openrs.dcb.description"}
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
						type="text"
						href="https://knowint.zendesk.com/"
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
					backgroundColor: theme.palette.primary.landingCard,
					width: "100%",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<CardContent>
					<Stack direction={"column"} spacing={3}>
						<CardMedia sx={{ justifyContent: "center", display: "flex" }}>
							{websiteURL ? (
								<a href={websiteURL}>
									<Image
										src={isEmpty(aboutImageURL) ? fallbackAbout : aboutImageURL}
										height={48}
										width={180}
										alt={t("ui.logo", { owner: { displayName } })}
										title={t("ui.logo", { owner: { displayName } })}
									/>
								</a>
							) : (
								<Image
									src={isEmpty(aboutImageURL) ? fallbackAbout : aboutImageURL}
									height={48}
									width={180}
									alt={t("ui.logo", { owner: { displayName } })}
									title={t("ui.logo", { owner: { displayName } })}
								/>
							)}
						</CardMedia>
						<Typography variant="h2" sx={{ fontSize: 32 }}>
							{!(displayName == "OpenRS Consortium")
								? t("consortium.about", { consortium: displayName })
								: t("consortium.about_generic")}
						</Typography>
						{description == "" ? (
							<Typography variant="loginCardText">
								<Trans
									i18nKey={"consortium.description_generic"}
									t={t}
									components={{
										paragraph: <p />,
									}}
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
				{catalogueSearchURL ? (
					<CardActions disableSpacing sx={{ mt: "auto" }}>
						<Button
							size="medium"
							type="text"
							href={catalogueSearchURL}
							rel="noopener"
						>
							<Typography variant="cardActionText">
								{t("consortium.search", { consortium: displayName })}
							</Typography>
						</Button>
					</CardActions>
				) : null}
			</Card>
		</Stack>
	);
}
