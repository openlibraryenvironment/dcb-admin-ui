import { Circle } from "@mui/icons-material";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";

type FormatArrayAsListType = {
	roles: any;
	context?: string;
};
export default function FormatArrayAsList({
	roles,
	context,
}: FormatArrayAsListType) {
	const formattedRoles = roles && roles.join(", ");
	switch (context) {
		case "editSummary":
			return (
				<List>
					{roles.map((item: any, index: number) => (
						<ListItem key={index}>
							<ListItemIcon>
								{index}
								<Circle />
							</ListItemIcon>
							<ListItemText primary={item} />
						</ListItem>
					))}
				</List>
			);
		default:
			return <ListItemText>{formattedRoles}</ListItemText>;
	}
}
