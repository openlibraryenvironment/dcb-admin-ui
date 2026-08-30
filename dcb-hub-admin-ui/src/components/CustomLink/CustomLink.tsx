import { createLink } from "@tanstack/react-router";
import { Button, Link as MUILink } from "@mui/material";

export const CustomLink = createLink(MUILink);

/**
 * A MUI Button that IS a link — W-12.
 *
 * `<Button component={CustomLink} to=… params=…>` does not type-check: Button's
 * polymorphic overloads cannot see through to the router's `to`/`params` pair, so `params`
 * is reported as unknown and the route type safety is lost exactly where it matters.
 * `createLink` around Button gives the same button, styled the same way, with the router's
 * own typing on the destination.
 *
 * It also renders a real `<a>`. A navigation drawn as a button but implemented as an
 * onClick is not openable in a new tab, is announced as a button rather than a link, and
 * never appears in a screen reader's list of links.
 */
export const CustomLinkButton = createLink(Button);
