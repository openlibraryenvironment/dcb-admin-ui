import Link from "@components/Link/Link";
import { Stack, Typography, useTheme } from "@mui/material";
import { useTranslation } from "next-i18next";

export default function LinkedFooter() {
	const theme = useTheme();
	const { t } = useTranslation();

	interface LinkItem {
		href: string;
		text: string;
	}

	interface Section {
		title: string;
		links: LinkItem[];
	}

	const generateLinks = (links: LinkItem[]) => {
		return (
			<ul
				style={{
					listStyleType: "none",
					margin: 0,
					padding: 0,
					textWrap: "wrap",
					wordBreak: "break-word",
				}}
			>
				{links.map((link) => (
					<li
						key={link.text}
						style={{ paddingTop: "10px", lineHeight: "17px" }}
					>
						<Link
							variant="linkedFooterTextSize"
							href={link.href}
							sx={{
								color: theme.palette.primary.linkedFooterText,
								textDecoration: "none",
							}}
							underline="hover"
						>
							{link.text}
						</Link>
					</li>
				))}
			</ul>
		);
	};

	// sections repesents the three sections in LinkedFooter
	const sections: Section[] = [
		{
			title: t("openrs.dcb.about"),
			links: [
				{ href: "https://www.openrs.org/", text: t("openrs.name") },
				{
					href: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/",
					text: t("openrs.dcb.project"),
				},
				{
					href: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2826600457/",
					text: t("openrs.dcb.roadmap"),
				},
				{
					href: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2685698049",
					text: t("openrs.dcb.release_notes"),
				},
			],
		},
		{
			title: t("support.name"),
			links: [
				{
					href: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2826862596/",
					text: t("support.admin_user_guides"),
				},
				{
					href: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/2692939949/ ",
					text: t("support.docs"),
				},
				{
					href: "https://knowint.zendesk.com/",
					text: t("support.submit_ticket"),
				},
				{
					href: "/serviceInfo/serviceStatus",
					text: t("nav.serviceInfo.serviceStatus"),
				},
			],
		},
		{
			title: t("openrs.who.involved"),
			links: [
				{
					href: "https://openlibraryfoundation.org/",
					text: t("openrs.who.olf_full"),
				},
				{ href: "https://www.k-int.com/", text: t("openrs.who.kint_full") },
				{ href: "https://www.ebsco.com/ ", text: t("openrs.who.ebsco") },
			],
		},
	];

	return (
		<Stack
			direction={{ xs: "column", sm: "row", md: "row", lg: "row" }}
			justifyContent="center"
			alignItems={"stretch"}
		>
			{sections.map((section) => (
				<div
					key={section.title}
					style={{
						padding: 10,
						width: "250px",
						height: "100%",
						//shorthand for mt, mr, mb, ml
						margin: "0px 20px 0px 20px",
					}}
				>
					<Typography
						variant="linkedFooterHeader"
						sx={{
							color: theme.palette.primary.linkedFooterText,
							paddingBottom: "5px",
						}}
					>
						{section.title}
					</Typography>
					<br />
					{generateLinks(section.links)}
				</div>
			))}
		</Stack>
	);
}
