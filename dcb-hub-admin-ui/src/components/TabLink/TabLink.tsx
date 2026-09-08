import { Tab } from "@mui/material";
import { createLink } from "@tanstack/react-router";

/**
 * A tab that IS a link.
 *
 * <h2>What was wrong</h2>
 *
 * All six tab bars in this application navigate between ROUTES, and all six were built as
 * `<Tab>` buttons with an `onChange` that called `router.navigate`. `ConsortiumTabs`'s own
 * doc comment claimed this had been fixed — it said the tabs "could not be opened in a new
 * tab, was not announced as a link, and did not appear in a screen reader's link list", and
 * then fixed only the separate defect of selecting by index rather than by path. The
 * elements stayed buttons. A comment that says a defect is fixed when it is not is worse
 * than no comment, because it stops the next reader looking.
 *
 * A middle-click, a ctrl-click, "open in new tab" and "copy link address" all did nothing,
 * on every tab bar in the application.
 *
 * <h2>createLink, not `component={Link}`</h2>
 *
 * `<Tab component={Link} to=…>` renders correctly but loses the router's typing on `to`:
 * MUI's polymorphic overloads cannot see through to the `to`/`params` pair. This is the
 * same reason `CustomLinkButton` exists, and the same remedy.
 *
 * <h2>Why role="tab" is kept, and where the limit is</h2>
 *
 * `SetupRail` records that wrapping MUI's `StepButton` in `createLink` produced an
 * `<a role="tab">` with no `role="tablist"` parent, which the axe gate caught as a critical
 * `aria-required-parent`. That failure was about the ORPHAN, not about the combination:
 * here the parent really is a `<Tabs>`, so the required structure is present and the gate
 * stays green.
 *
 * Be clear about what this does and does not buy, though. These are anchors, so pointer
 * and keyboard users get every browser affordance a link has. They are still announced as
 * TABS rather than links, and still absent from a screen reader's link list, because
 * `role="tab"` overrides the implicit role of the `<a>`. The ARIA authoring practices would
 * have cross-document navigation be a `nav` of links rather than a tablist at all — that is
 * a bigger change than a release week wants, and it would give up the scrollable overflow,
 * the indicator and the roving focus that `Tabs` provides correctly today. Recorded here so
 * the next person weighing it has the argument rather than having to rediscover it.
 */
export const TabLink = createLink(Tab);
