import { Tab } from "@mui/material";
import { createLink } from "@tanstack/react-router";

/**
 * A tab that is a real anchor, for the six tab bars that navigate between routes.
 *
 * `createLink`, not `<Tab component={Link}>`: the second form renders correctly and loses
 * the router's typing on `to`.
 *
 * See docs/accessibility.md for what this does and does not buy — it is less than it looks.
 */
export const TabLink = createLink(Tab);
