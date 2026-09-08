# DCB Admin 2.0 — what's new

Released 8 September 2026.

DCB Admin has been rebuilt. The console is faster, works properly with the keyboard and a
screen reader, and can be made to look and read the way you want it to. Your libraries, your
requests and your settings are all where you left them.

A few features appear only once the DCB service behind your console has been upgraded. Those
are marked **"needs a newer DCB service"** and your administrator switches them on — see the
end of this document.

If you are the one deploying DCB Admin rather than using it, you want
[release-notes-2.0.0.md](./release-notes-2.0.0.md) instead — configuration, the feature-flag
matrix and the upgrade steps.

---

## Setting up a consortium

First-run setup has been rewritten as a guided sequence rather than a set of forms you had to
find. [DCB-1992]

- **One way in.** Setup is now the only route into consortium configuration, so there is no
  longer a separate "new consortium" dialogue to hunt for.
- **You can see how much is left**, chapter by chapter, and a completed setup opens at your
  inventory rather than dropping you back at the beginning.
- **You can leave and come back.** Leaving the flow and skipping a chapter are now different
  things, and each says what it will do.
- **Your work is protected.** Navigating away from unsaved changes warns you — and, unlike
  before, it no longer warns about work you have just saved.
- **Consortium contacts can be created.** They could not be, previously.
- **Branding has its own tab** rather than being buried in the setup flow.
- A brand-new deployment no longer claims the appearance chapter is already finished.

## Signing in and who can get in

- **DCB Admin is for consortium staff.** A library account that signs in is now told, plainly,
  that it is in the wrong application — with a link to DCB Admin for Libraries where your
  deployment provides one. Previously it was told it lacked access, which was true but not
  useful. [DCB-1992]
- **Consortium administrators have two abilities on patron requests** that were previously
  only available to library administrators. [DCB-1992]
- **The consortium name in the header** no longer lingers after the consortium it belonged to
  has gone. [DCB-1992]

## Adding and managing libraries

- **You can add a library directly from DCB Admin.**
- **The new-library workflow is resumable** — you can stop part way and pick it up later.
- **It asks the right questions for the system you are connecting.** The steps now differ by
  ILS instead of presenting one form for every system.
- **Koha connections ask for the OAI details up front** that a harvest cannot run without,
  rather than accepting the library and failing later. [DCB-2146]
- **Environment information has its own tab**, separate from onboarding, so you can check what
  your deployment is running without walking through setup.

## Requests, searching and exports

Most of this sits behind [DCB-1971], which also carried a large part of the rebuild.

- **A new export wizard**, with a clearer path from what you are looking at to the file you
  want, and a number of smaller export improvements.
- **A pickup library filter** on requests.
- **Grids behave.** Pagination failures are fixed, an empty grid now looks empty rather than
  broken, and selecting rows is only offered where there is actually something to do with the
  selection.
- **Audit log navigation is fixed** — following an entry now takes you where it says.
- **Links go where they say they go.** A set of incorrect click-throughs has been corrected.
- **Quick walk-up requests explain themselves** with a tooltip.
- Assorted improvements to requesting and search, and to text throughout.

## Statistics and insights — _needs a newer DCB service_

A statistics and insights area, covering request volumes and outcomes, and including
collection, partner and supply figures your DCB service was already producing and nothing
displayed.

## Look, feel and accessibility

- **Six themes** — openRS, Evergreen, Koha, FOLIO, blue-and-white and MOBIUS — each in
  **light, dark and high-contrast**.
- **Five typefaces**, including Atkinson Hyperlegible and Lexend, both designed for easier
  reading.
- **Text size, spacing and animation are yours to set**, and stay set.
- **"Match my device"** follows your operating system — including its _contrast_ setting, not
  only light or dark. If you have told your computer you need higher contrast, DCB Admin now
  listens.
- **Windows High Contrast Mode is supported.**
- **Every journey works with the keyboard alone**, there is a skip link past the navigation,
  and headings, landmarks and live regions are announced properly. Reaching the content of a
  page used to take fifteen tab stops.
- **Tabs are real links.** Middle-click, ctrl-click, "open in new tab" and "copy link address"
  work throughout the console. None of them did before.
- The console is usable down to a 320-pixel-wide window.

FOLIO and Koha now show their true brand colours rather than darkened approximations.

## Also arriving with a newer DCB service

Your administrator switches these on when your DCB service supports them:

| Feature                                                                 |                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------- |
| Consortium branding — logos, header marks, patron welcome text          | needs DCB service 9.0.0                           |
| DCB NCIP onboarding                                                     | needs DCB service 9.0.0                           |
| Statistics and insights                                                 | needs DCB service 9.0.0                           |
| Maximum local holds per agency                                          | [DCB-1428] — needs a DCB service newer than 9.0.0 |
| Consortium patron support link                                          | needs a DCB service newer than 9.0.0              |
| Library accounts tab, for provisioning DCB Admin for Libraries accounts | [DCB-1992] — needs a DCB service newer than 9.0.0 |
| Audit explorer                                                          | not yet available in any DCB service              |

Until then those areas are simply not shown. Your existing consortium branding continues to
display as it always has.

## Known limitations

- **Display preferences live in your browser**, on the device you set them on, and are cleared
  when you sign out. They do not follow you to another computer yet.
- **A deployment cannot set a default theme** for everyone; each person chooses their own.

---

## Jira

| Ticket   | Link                                                        |
| -------- | ----------------------------------------------------------- |
| DCB-1428 | https://openlibraryfoundation.atlassian.net/browse/DCB-1428 |
| DCB-1971 | https://openlibraryfoundation.atlassian.net/browse/DCB-1971 |
| DCB-1992 | https://openlibraryfoundation.atlassian.net/browse/DCB-1992 |
| DCB-2146 | https://openlibraryfoundation.atlassian.net/browse/DCB-2146 |

Changes above without a ticket were tracked outside Jira — chiefly the rebuild itself, the
accessibility and theming work, and the statistics area.
