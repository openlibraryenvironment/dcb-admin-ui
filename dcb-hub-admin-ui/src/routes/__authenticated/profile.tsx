import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import {
	List,
	ListItemIcon,
	ListItemText,
	Typography,
	ListSubheader,
	ListItem,
	useTheme,
	Box,
} from "@mui/material";
import {
	PersonOutline,
	MailOutline,
	MarkEmailReadOutlined,
	ThumbUpOffAlt,
	SupervisorAccountOutlined,
} from "@mui/icons-material";

import AdminLayout from "@layout/AdminLayout/AdminLayout";
import FormatArrayAsList from "@components/FormatArrayAsList/FormatArrayAsList";

export const Route = createFileRoute("/__authenticated/profile")({
	component: Profile,
});

function Profile() {
	const { t } = useTranslation();
	const theme = useTheme();

	const auth = useAuth();
	const profile = auth.user?.profile;

	const emailVerified =
		profile?.email_verified ?? "Cannot fetch verified email status.";

	return (
		<AdminLayout title={t("nav.profile")} hideTitleBox={true}>
			<Typography variant="h2" sx={{ pl: 2, fontSize: 32 }}>
				{t("nav.profile")}
			</Typography>
			<List className="list-profile">
				<ListSubheader sx={{ backgroundColor: "transparent" }}>
					<Typography variant="h6">{t("profile.details")}</Typography>
				</ListSubheader>
				<ListItem>
					<ListItemIcon>
						<PersonOutline />
					</ListItemIcon>
					<ListItemText>
						<Typography variant="attributeTitle">
							{t("profile.name")}
						</Typography>
						{profile?.name || profile?.given_name || "N/A"}
					</ListItemText>
				</ListItem>
				<ListItem>
					<ListItemIcon>
						<MailOutline />
					</ListItemIcon>
					<ListItemText>
						<Typography variant="attributeTitle">
							{t("profile.email")}
						</Typography>
						{profile?.email || "N/A"}
					</ListItemText>
				</ListItem>
				<ListItem>
					<ListItemIcon>
						<MarkEmailReadOutlined />
					</ListItemIcon>
					<ListItemText>
						<Typography variant="attributeTitle">
							{t("profile.email_verified")}
						</Typography>
						{emailVerified.toString()}
					</ListItemText>
				</ListItem>
				<ListItem>
					<ListItemIcon>
						<ThumbUpOffAlt />
					</ListItemIcon>
					<ListItemText>
						<Typography variant="attributeTitle">
							{t("profile.prefered_username")}
						</Typography>
						{profile?.preferred_username || "N/A"}
					</ListItemText>
				</ListItem>
				<ListItem>
					<ListItemIcon>
						<SupervisorAccountOutlined />
					</ListItemIcon>
					<Box>
						<Typography variant="attributeTitle">
							{t("profile.roles")}
						</Typography>
						<FormatArrayAsList roles={profile?.roles as string[] | undefined} />
					</Box>
				</ListItem>
			</List>
		</AdminLayout>
	);
}
