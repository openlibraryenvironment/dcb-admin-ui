import { NextPage } from "next";
import {
	List,
	ListItemIcon,
	ListItemText,
	Typography,
	ListSubheader,
	ListItem,
	useTheme,
} from "@mui/material";
import {
	PersonOutline,
	MailOutline,
	MarkEmailReadOutlined,
	ThumbUpOffAlt,
	SupervisorAccountOutlined,
} from "@mui/icons-material";
//localisation
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { AdminLayout } from "@layout";
import { useSession } from "next-auth/react";
import FormatArrayAsList from "@components/FormatArrayAsList/FormatArrayAsList";

const Profile: NextPage = () => {
	const { data: session }: { data: any } = useSession();
	const emailVerified =
		session?.profile?.email_verified ?? "Cannot fetch verified email status.";

	const { t } = useTranslation();
	const theme = useTheme();
	return (
		<AdminLayout title={t("nav.profile")} hideTitleBox={true}>
			<Typography variant="h2" sx={{ pl: 2, fontSize: 32 }}>
				{t("nav.profile")}
			</Typography>
			<List className="list-profile">
				<ListSubheader
					sx={{ backgroundColor: theme.palette.background.default }}
				>
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
						{session?.user?.name}
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
						{session?.user?.email}
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
						{session?.profile?.preferred_username}
					</ListItemText>
				</ListItem>
				<ListItem>
					<ListItemIcon>
						<SupervisorAccountOutlined />
					</ListItemIcon>
					<Typography variant="attributeTitle">{t("profile.roles")}</Typography>
					<FormatArrayAsList roles={session?.profile?.roles} />
				</ListItem>
			</List>
		</AdminLayout>
	);
};

export async function getServerSideProps({ locale }: { locale: string }) {
	return {
		props: {
			...(await serverSideTranslations(locale, [
				"application",
				"common",
				"validation",
			])),
		},
	};
}
export default Profile;
