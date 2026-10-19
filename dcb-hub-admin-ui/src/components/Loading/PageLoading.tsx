import { ComponentProps } from "react";
import { Box } from "@mui/material";

import Loading from "./Loading";
import { VIEWPORT_BELOW_HEADER } from "@constants/layout";

/**
 * Loading for a route whose loaded page is taller than the viewport - see
 * VIEWPORT_BELOW_HEADER. A route whose loaded page can be short uses Loading: holding the
 * viewport there pulls the footer up into view when the data lands, the same shift.
 */
export default function PageLoading(props: ComponentProps<typeof Loading>) {
	return (
		<Box sx={{ display: "flex", minHeight: VIEWPORT_BELOW_HEADER }}>
			<Loading {...props} />
		</Box>
	);
}
