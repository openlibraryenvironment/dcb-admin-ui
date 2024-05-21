import { ListItemText } from "@mui/material";

export default function FormatRoles({ roles }: any) {
	const formattedRoles = roles && roles.join(", ");
	return <ListItemText>{formattedRoles}</ListItemText>;
}
