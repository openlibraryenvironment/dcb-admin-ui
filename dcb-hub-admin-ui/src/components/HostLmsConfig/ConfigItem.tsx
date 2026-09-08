import RenderAttribute from "@components/RenderAttribute/RenderAttribute";
import { Grid, Stack, Typography } from "@mui/material";

export default function ConfigItem({
	title,
	value,
	tooltip,
	type,
}: {
	title: string;
	value: any;
	tooltip?: string;
	type?: string;
}) {
	if (value == null || value === "undefined") return null;
	return (
		<Grid size={{ xs: 2, sm: 4, md: 4 }}>
			<Stack direction="column">
				<Typography variant="attributeTitle">{title}</Typography>
				<Typography variant="attributeText">
					<RenderAttribute
						attribute={value}
						title={tooltip || value}
						type={type}
					/>
				</Typography>
			</Stack>
		</Grid>
	);
}
