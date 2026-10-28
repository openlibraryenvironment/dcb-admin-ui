# Attribute help

An info button beside an attribute that explains what it means. The first one is beside
**Current status** on a patron request. Each status gets its own explanation.

Two components, in `src/components/HelpPopover/`:

- **`HelpPopover`**: the button and the popover. Use it directly when the explanation has
  structure of its own, as Insights' `MetricInfo` does.
- **`AttributeHelp`**: `HelpPopover` filled from the catalogue, for an attribute on a
  details page. Use this one for anything new.

DCB Admin for Libraries has the same two components and the same `help` keys. Its text
names its own actions. Keep the two catalogues saying the same thing.

## Adding one

1. Add a topic to `HelpTopic` in `AttributeHelp.tsx`.
2. Add a `help.<topic>` block to `src/locales/en-GB/application.json`. Every key is
   optional:
   - `about`: what the attribute is. Shown on its own when the attribute has no fixed
     set of values. Otherwise it is shown under the value's text.
   - `values.<VALUE>`: what the value means, keyed by the value as the API returns it.
     Shown under **What it means**.
   - `waiting.<VALUE>`: what it means when a record stays at this value, and where on the
     page to look. Shown under **If it stays here**. Leave it out for a final value.
3. Put the component beside the value. Use the same row `Stack` that the page already uses
   for the copy button:

   ```tsx
   <Stack direction="row" sx={{ alignItems: "center" }} spacing={0.5}>
   	<RenderAttribute attribute={patronRequest?.renewalStatus} />
   	<AttributeHelp
   		topic="renewal_status"
   		label={t("patron_request.renewal_status")}
   		value={patronRequest?.renewalStatus}
   	/>
   </Stack>
   ```

   `valueLabel` is optional. It is the value as a person reads it, used in the heading.
   Without it, the heading shows the raw value.

4. If the values come from an enum, add a test like the one in `AttributeHelp.test.tsx`
   that compares the enum with the catalogue in both directions. The keys are built at
   runtime, so `translationKeys.test.ts` cannot see them.

5. Run `npx vitest run src/locales`. The en-US overlay gate fails if an en-GB string uses a
   British spelling, such as "finalises" or "cancelled", without an en-US override.

With no text for the value and no `about`, the component renders nothing. A status the
service adds before the catalogue has a description shows no button, rather than a raw
key.

## Rules

- **Click, not hover.** WCAG 2.2 SC 1.4.13 rules out several sentences behind a tooltip.
  The popover is a labelled `dialog`. Escape closes it and focus goes back to the button.
  `e2e/attribute-help.spec.ts` covers that, and runs an axe scan with the popover open in
  both themes.
- **The button names what it explains**: "About Current status", not "Info".
- **Write for systems librarians and consortium administrators.** Name the host LMS
  status that moves a record on, and the field or tab on this page that shows it. Quote
  the page's own names for fields, tabs, statuses and actions.
- **Describe what the service does, not what the label suggests.** The status texts were
  written from the `dcb-service` transitions that enter and leave each status, in
  `org.olf.dcb.request.workflow`. Each "If it stays here" line names the condition that
  moves the request on. When a transition changes, change the text.
- **Every explanation adds to every page's download.** en-GB is bundled into `i18n.js`.
  The status texts, with their "If it stays here" lines, added 2,110 bytes gzipped. Lighthouse `total-byte-weight` on `/login`
  measures that cost. See `docs/performance-budget.md`.
- Spanish (`public/locales/es`) falls back to English for these keys until they are
  translated.
