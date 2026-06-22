import { PropsWithChildren, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { Stack, Typography, Box, Button } from "@mui/material";
import { BookOutlined } from "@mui/icons-material";

import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import PageActionsMenu from "@components/PageActionsMenu/PageActionsMenu";
import Link from "@components/Link/Link";
import { adminOrConsortiumAdmin } from "@constants/roles";

interface PageContainerProps {
	title?: string;
	hideTitleBox?: boolean;
	hideBreadcrumbs?: boolean;
	pageActions?: any;
	mode?: "edit" | "view";
	link?: string;
	docLink?: string;
	subtitle?: string;
}

export default function PageContainer({
	title,
	children,
	hideTitleBox,
	hideBreadcrumbs,
	pageActions,
	mode,
	link,
	docLink,
	subtitle,
}: PropsWithChildren<PageContainerProps>) {
	const auth = useAuth();
	const userRoles = (auth?.user?.profile?.roles as string[]) || [];
	const isAnAdmin = userRoles.some((role) =>
		adminOrConsortiumAdmin.includes(role),
	);

	useEffect(() => {
		const baseAppTitle = "DCB Admin";
		document.title = title ? `${title} | ${baseAppTitle}` : baseAppTitle;
		return () => {
			document.title = baseAppTitle;
		};
	}, [title]);

	const renderTitle = () => {
		if (!link || !title)
			return (
				<Typography id="page-title" variant="h1">
					{title}
				</Typography>
			);

		const dcbMatch = title.match(/(DCB-\d+)/);
		if (dcbMatch) {
			const [dcbPart] = dcbMatch;
			const beforeDcb = title.slice(0, dcbMatch.index);
			const afterDcb = title.slice((dcbMatch.index ?? 0) + dcbPart.length);

			return (
				<Typography id="page-title" variant="h1">
					{beforeDcb}
					{dcbPart !== "DCB-????" ? (
						<Link href={link}>{dcbPart}</Link>
					) : (
						dcbPart
					)}
					{afterDcb}
				</Typography>
			);
		}
		return (
			<Typography id="page-title" variant="h1">
				{title}
			</Typography>
		);
	};

	return (
		<Stack spacing={2} sx={{ height: "100%", width: "100%" }}>
			{!hideBreadcrumbs && title && (
				<Box>
					<Breadcrumbs titleAttribute={title} />
				</Box>
			)}

			{!hideTitleBox && (
				<Box
					sx={{
						my: 1,
						height: "100%",
						flex: "0",
						backgroundColor: "primary.titleArea",
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
						sx={{ p: 3, pb: 0 }}
					>
						{title && (
							<Stack direction="column" spacing={1} alignItems="baseline">
								{renderTitle()}
								{docLink && (
									<Button
										variant="outlined"
										startIcon={<BookOutlined />}
										href={docLink}
										size="small"
									>
										{subtitle || docLink}
									</Button>
								)}
							</Stack>
						)}
						{pageActions && isAnAdmin && (
							<PageActionsMenu actions={pageActions} mode={mode || "view"} />
						)}
					</Stack>
				</Box>
			)}

			<Box sx={{ px: 3, pb: 3, height: "100%" }}>{children}</Box>
		</Stack>
	);
}
