# Knowledge Integration Accessibility Conformance Report

**WCAG Edition**

**(Based on VPAT**® **Version 2.5Rev)**

**Name of Product/Version**

DCB Admin / v1.58.0

**Report Date**

This report was last updated on 16/03/26.

**Product Description**

DCB Admin is a modern web application for consortium staff managing the OpenRS DCB resource sharing software.

**Contact Information**

dcb@k-int.com

**Notes**

DCB Admin is open-source software. It utilises the Material UI open-source component library and benefits from many of its accessibility features, while also extending these to go beyond the standard.

**Evaluation Methods Used:**  

Scenarios were tested using a range of manual and automated testing methods, such as keyboard-only interactions, testing with screen readers, and colour contrast analysis.

Automated testing was undertaken with Axe Dev-Tools to the WCAG 2.2 AA standard. Further automated testing was undertaken to evaluate compliance with RGAA AAA criteria. For ease of access, we have added a column to our WCAG reporting tables that details shared or equivalent criteria across accessibility guidelines. 

**Applicable Standards/Guidelines**

This report covers the degree of conformance for the following accessibility standard/guidelines \- WCAG 2.2 AA. It also evaluates the corresponding RGAA criteria, where applicable, and extends to evaluating WCAG 2.2 AAA criteria as well as RGAA AAA criteria.

| Standard/Guideline | Included In Report |
| :---- | :---: |
| [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/) | Level A \- **Yes** Level AA \- **Yes** Level AAA \- **Yes** |

## **Terms**

The terms used in the Conformance Level information are defined as follows:

* **Supports**: The functionality of the product has at least one method that meets the criterion without known defects or meets with equivalent facilitation.

* **Partially Supports**: Some functionality of the product does not meet the criterion.

* **Does Not Support**: The majority of product functionality does not meet the criterion.

* **Not Applicable**: The criterion is not relevant to the product.

* **Not Evaluated**: The product has not been evaluated against the criterion. This can only be used in WCAG Level AAA criteria.

## **WCAG 2.2 Report**

### **Table 1: Success Criteria, Level A**

Notes:

| Criteria | Conformance Level | Remarks and Explanations |
| ----- | ----- | ----- |
| [**1.1.1 Non-text Content**](http://www.w3.org/TR/WCAG20/#text-equiv-all) (Level A) |  Supports | Any non-text content provided to the user has a name that details its purpose for assistive technology. |
| [**1.2.1 Audio-only and Video-only (Prerecorded)**](http://www.w3.org/TR/WCAG20/#media-equiv-av-only-alt) (Level A) | Not applicable | No audio/video present in the app. |
| [**1.2.2 Captions (Prerecorded)**](http://www.w3.org/TR/WCAG20/#media-equiv-captions) (Level A) | Not applicable | No audio/video present in the app. |
| [**1.2.3 Audio Description or Media Alternative (Prerecorded)**](http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc) (Level A) | Not applicable | No audio/video present in the app. |
| [**1.3.1 Info and Relationships**](http://www.w3.org/TR/WCAG20/#content-structure-separation-programmatic) (Level A) | Supports | DCB Admin page elements use WAI-ARIA roles so that information, structure, and relationships can be understood independently of presentation. ARIA roles are also used to provide landmarks. |
| [**1.3.2 Meaningful Sequence**](http://www.w3.org/TR/WCAG20/#content-structure-separation-sequence) (Level A) | Supports | For sequence-based operations the DOM order matches the visual order. |
| [**1.3.3 Sensory Characteristics**](http://www.w3.org/TR/WCAG20/#content-structure-separation-understanding) (Level A) | Supports | DCB Admin pages do not depend solely on sensory characteristics such as shape, size, visual location, orientation, or sound to understand content. Icons may be displayed to control functionality, but adjacent visible text labels or WAI-ARIA labels are also provided to ensure that relationships are available to assistive technologies.  |
| [**1.4.1 Use of Color**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-without-color) (Level A) | Supports | Tested via automated colour contrast checking with AXE dev tools |
| [**1.4.2 Audio Control**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-dis-audio) (Level A) | Not applicable | No audio/video present in the app. |
| [**2.1.1 Keyboard**](http://www.w3.org/TR/WCAG20/#keyboard-operation-keyboard-operable) (Level A) | Supports | At the time of writing, all components in this application are accessible by keyboard alone. We continue to test releases to identify any regressions. |
| [**2.1.2 No Keyboard Trap**](http://www.w3.org/TR/WCAG20/#keyboard-operation-trapping) (Level A) | Supports | Keyboard trapping is rare: if it does happen, focus can be moved away using tab or other standard keystrokes. |
| [**2.1.4 Character Key Shortcuts**](https://www.w3.org/TR/WCAG21/#character-key-shortcuts) (Level A 2.1 and 2.2) | Not applicable |  This app doesn’t implement character key shortcuts. |
| [**2.2.1 Timing Adjustable**](http://www.w3.org/TR/WCAG20/#time-limits-required-behaviors) (Level A) | Supports | This occurs when a user places a ‘staff request’, and an alert pops up with a link to the newly placed request. While this timing isn’t adjustable, the user can easily navigate using the sidebar to the placed request if they miss the initial alert. By default the most recently placed request is at the top of the page. |
| [**2.2.2 Pause, Stop, Hide**](http://www.w3.org/TR/WCAG20/#time-limits-pause) (Level A) | Supports | There is no automatically moving, blinking or scrolling content, with the exception of progress bars for certain operations, which can be hidden. |
| [**2.3.1 Three Flashes or Below Threshold**](http://www.w3.org/TR/WCAG20/#seizure-does-not-violate) (Level A) | Supports | DCB Admin does not contain any content that flashes. |
| [**2.4.1 Bypass Blocks**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-skip) (Level A) | Supports |  |
| [**2.4.2 Page Titled**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-title) (Level A) | Supports | All pages have unique titles that describe the purpose of the page. |
| [**2.4.3 Focus Order**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-order) (Level A) | Supports | The meaning and/or operation of the content in DCB Admin is generally unaffected by focus order. |
| [**2.4.4 Link Purpose (In Context)**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-refs) (Level A) | Supports | The purpose of all links can be determined by their labels, which are available to assistive tech such as screen readers. |
| [**2.5.1 Pointer Gestures**](https://www.w3.org/TR/WCAG21/#pointer-gestures) (Level A 2.1 and 2.2) | Not applicable | DCB Admin does not contain any functionality that uses multipoint or path-based gestures for operation. |
| [**2.5.2 Pointer Cancellation**](https://www.w3.org/TR/WCAG21/#pointer-cancellation) (Level A 2.1 and 2.2) |  Supports |  All functionality that can be single pointer operated in DCB Admin can also be cancelled using standard browser and operating system methods. |
| [**2.5.3 Label in Name**](https://www.w3.org/TR/WCAG21/#label-in-name) (Level A 2.1 and 2.2) |  Supports |  Where controls contain visible text, that text is also the label for the control in DCB Admin. When we become aware of deficiencies, we work to repair instances that do not meet this criterion. We conduct regular testing to catch regressions. |
| [**2.5.4 Motion Actuation**](https://www.w3.org/TR/WCAG21/#motion-actuation) (Level A 2.1 and 2.2) |  Supports | DCB Admin does not contain any functionality that can be operated by device motion or user motion. |
| [**3.1.1 Language of Page**](http://www.w3.org/TR/WCAG20/#meaning-doc-lang-id) (Level A) | Supports | The primary language of this product is English and this can be programmatically determined. For each new language added, we will continue to test this criterion. |
| [**3.2.1 On Focus**](http://www.w3.org/TR/WCAG20/#consistent-behavior-receive-focus) (Level A) | Supports | DCB Admin components that receive focus do not initiate a change of context. |
| [**3.2.2 On Input**](http://www.w3.org/TR/WCAG20/#consistent-behavior-unpredictable-change) (Level A) | Supports | Generally, changing the setting of any DCB Admin UI component doesn’t automatically trigger a change of context. |
| [**3.2.6 Consistent Help**](https://www.w3.org/TR/WCAG22/#consistent-help) (Level A 2.2 only) | Not applicable | A wide-ranging helper component is on the schedule but was not in this release, and will meet this criterion. |
| [**3.3.1 Error Identification**](http://www.w3.org/TR/WCAG20/#minimize-error-identified) (Level A) | Supports | All input errors are described to the user in text, and in a way which can be picked up by assistive technology such as screen readers. |
| [**3.3.2 Labels or Instructions**](http://www.w3.org/TR/WCAG20/#minimize-error-cues) (Level A) | Supports | Labels or instructions are always provided when user input is required. |
| [**3.3.7 Redundant Entry**](https://www.w3.org/TR/WCAG22/#redundant-entry) (Level A 2.2 only) | Supports | DCB Admin does not require users to enter information more than once in the process without the information being available for the user to select. |
| [**4.1.2 Name, Role, Value**](http://www.w3.org/TR/WCAG20/#ensure-compat-rsv) (Level A) | Supports | DCB Admin pages generally use standard HTML and WAI-ARIA attributes to describe the identity, operation, and state of user interface elements to assistive technologies. When we become aware of deficiencies in meeting this criterion, we work to repair them. |

### **Table 2: Success Criteria, Level AA**

Notes:

| Criteria | Conformance Level | Remarks and Explanations |
| ----- | ----- | ----- |
| **[1.2.4 Captions (Live)](http://www.w3.org/TR/WCAG20/#media-equiv-real-time-captions)** (Level AA) | Not applicable | We do not provide any live audio content in the application. |
| [**1.2.5 Audio Description (Prerecorded)**](http://www.w3.org/TR/WCAG20/#media-equiv-audio-desc-only) (Level AA) | Not applicable | We do not provide any pre-recorded audio content in the application. |
| [**1.3.4 Orientation**](https://www.w3.org/TR/WCAG21/#orientation) (Level AA 2.1 and 2.2) |  Supports |  We do not restrict to any display orientation. |
| [**1.3.5 Identify Input Purpose**](https://www.w3.org/TR/WCAG21/#identify-input-purpose) (Level AA 2.1 and 2.2) |  Supports |  Input fields provide information about their purpose that can be used by assistive technologies (i.e. a screen reader) |
| [**1.4.3 Contrast (Minimum)**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-contrast) (Level AA) | Supports | Text contrast ratio is at least 4:5:1 throughout. |
| [**1.4.4 Resize text**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-scale) (Level AA) | Supports | The pages of this product can be resized without Assistive Technology up to 200 percent without loss of content or functionality. |
| [**1.4.5 Images of Text**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-presentation) (Level AA) | Supports | The only images of text are logotypes, which are considered essential under WCAG 2.2 AA |
| [**1.4.10 Reflow**](https://www.w3.org/TR/WCAG21/#reflow) (Level AA 2.1 and 2.2) |  Supports | Most of the UX is responsive. Content is presented without loss of information or functionality, and without requiring scrolling in two dimensions, except where necessary or when the user has configured data tables to have a large number of columns. In these cases horizontal scrolling is used. A ‘master detail’ is also available as an alternative, as well as a full-screen click-through view for the data grid row in most cases. |
| [**1.4.11 Non-text Contrast**](https://www.w3.org/TR/WCAG21/#non-text-contrast) (Level AA 2.1 and 2.2) |  Supports |  3:1 contrast ratio met and verified with axe dev tools. |
| [**1.4.12 Text Spacing**](https://www.w3.org/TR/WCAG21/#text-spacing) (Level AA 2.1 and 2.2) |  Supports | There is no loss of content or functionality by setting the text spacing properties specified by this criterion anywhere in the application. |
| [**1.4.13 Content on Hover or Focus**](https://www.w3.org/TR/WCAG21/#content-on-hover-or-focus) (Level AA 2.1 and 2.2) |  Supports |  The main use case for this is alerts. These are built on the Material UI [Alert](https://mui.com/material-ui/react-alert/#accessibility) and [Snackbar](https://mui.com/material-ui/react-snackbar/) components. They are dismissable by keyboard navigation. Some of them are timed: however the action available (a link to a patron request page) is still accessible by navigation after the alert disappears.  |
| [**2.4.5 Multiple Ways**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-mult-loc) (Level AA) | Supports | Multiple ways of navigation are available to the user. There is a sidebar, breadcrumbs, and the data grids themselves can be used to navigate. On the ‘details’ pages, breadcrumbs are always available so the user can easily go back. |
| [**2.4.6 Headings and Labels**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-descriptive) (Level AA) | Supports | All headings and labels describe topic or purpose. |
| [**2.4.7 Focus Visible**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-focus-visible) (Level AA) | Supports | We have incorporated the existing Material UI X data grid focus indicator and extended it further to make the focus indicator even clearer. |
| [**2.4.11 Focus Not Obscured (Minimum)**](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum) (Level AA 2.2 only) | Supports | We are not aware of any instances of obscured focus, as detailed by this criterion, within this product. |
| [**2.5.7 Dragging Movements**](https://www.w3.org/TR/WCAG22/#dragging-movements) (Level AA 2.2 only) | Supports | There is no functionality in DCB Admin that requires dragging movements. All interactive elements are operable using single pointer actions. |
| [**2.5.8 Target Size (Minimum)**](https://www.w3.org/TR/WCAG22/#target-size-minimum) (Level AA 2.2 only) | Supports | All target areas meet the minimum size. |
| [**3.1.2 Language of Parts**](http://www.w3.org/TR/WCAG20/#meaning-other-lang-id) (Level AA) | Supports |  |
| [**3.2.3 Consistent Navigation**](http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-locations) (Level AA) | Supports | Navigation is consistent throughout. All ‘nested’ pages have breadcrumbs. The rest are accommodated via sidebar navigation. |
| [**3.2.4 Consistent Identification**](http://www.w3.org/TR/WCAG20/#consistent-behavior-consistent-functionality) (Level AA) | Supports |  |
| [**3.3.3 Error Suggestion**](http://www.w3.org/TR/WCAG20/#minimize-error-suggestions) (Level AA) | Supports | For editable elements where this is applicable (such as a library’s latitude or longitude), we use validation with Yup and react-hook-form to signal an error to the user and give them a chance to change their input. |
| [**3.3.4 Error Prevention (Legal, Financial, Data)**](http://www.w3.org/TR/WCAG20/#minimize-error-reversible) (Level AA) | Supports | No parts of this application cause legal or financial transactions for the user to occur. Where user-controllable data in data storage systems is modifiable (such as adding new mappings for a library’s configuration), the user is presented with a screen for reviewing their changes before making them. If server-side validation fails, the user is notified. And a data change log is available for the user to see a history of edits, so any unwanted changes can be rectified. |
| [**3.3.8 Accessible Authentication (Minimum)**](https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum) (Level AA 2.2 only) | Supports | We support password entry by password managers. |
| [**4.1.3 Status Messages**](https://www.w3.org/TR/WCAG21/#status-messages) (Level AA 2.1 and 2.2) | Supports | Status messages use an extended version of the Material UI Alert and Snackbar components mentioned in 1.4.13. The role of these can be programmatically determined.  |

### **Table 3: Success Criteria, Level AAA**

Notes: Where present, the relevant RGAA AAA criteria is mentioned in the “Equivalent” column. DCB Admin currently complies with **15** of the RGAA AAA criteria, and we aim to increase this number as we work to improve accessibility throughout the application.

| Criteria | Conformance Level | Equivalent | Remarks and Explanations |
| ----- | ----- | ----- | ----- |
| **[1.2.6 Sign Language (Prerecorded)](http://www.w3.org/TR/WCAG20/#media-equiv-sign)** (Level AAA) | Not applicable | RGAA (AAA) 4.9 \- not applicable 4.10 \- not applicable | There is no pre-recorded audio content in the application. |
| [**1.2.7 Extended Audio Description (Prerecorded)**](http://www.w3.org/TR/WCAG20/#media-equiv-extended-ad) (Level AAA) | Not applicable | RGAA (AAA) 4.12 \- not applicable | There is no pre-recorded video content in the application. |
| [**1.2.8 Media Alternative (Prerecorded)**](http://www.w3.org/TR/WCAG20/#media-equiv-text-doc) (Level AAA) | Not applicable | RGAA (AAA) 4.13 \- not applicable 4.14 \- not applicable | There is no time-based media in the application. |
| [**1.2.9 Audio-only (Live)**](http://www.w3.org/TR/WCAG20/#media-equiv-live-audio-only) (Level AAA) | Not applicable |  | There is no live audio-only content in the application. |
| [**1.3.6 Identify Purpose**](https://www.w3.org/TR/WCAG21/#identify-purpose) (Level AAA 2.1 and 2.2) | Partially Supports |  | Landmarks are generally used in the application to identify regions of a page: further work is required to fully support this criteria. |
| [**1.4.6 Contrast (Enhanced**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast7)) (Level AAA) | Does not support | RGAA (AAA) 1.4.6 \- Does not support | At this time, we do not meet the 7:1 ratio. |
| [**1.4.7 Low or No Background Audio**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-noaudio) (Level AAA) | Not applicable | RGAA (AAA) 4.19 \- not applicable | There is no audio content in the application. |
| [**1.4.8 Visual Presentation**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-visual-presentation) (Level AAA) | Partially supports | RGAA (AAA) 10.8 \- Partially supports 10.9 \- Does not support 10.10 \- Supports  10.11 \- Does not support 10.12 \- Supports | The user can select either a light or a dark background colour, but that is the only choice available. Text is generally not fully justified but there may be some exceptions present, so we cannot certify this for all text. Text is readable without the use of horizontal scrolling. Some lines of text exceed the 80 character limit. Line and paragraph spacing meets the criteria throughout. |
| [**1.4.9 Images of Text (No Exception)**](http://www.w3.org/TR/WCAG20/#visual-audio-contrast-text-images) (Level AAA) | Supports | RGAA (AAA) 1.9 \- Supports | The only images of text are logotypes, which are considered essential under WCAG 2.2 AAA |
| [**2.1.3 Keyboard (No Exception)**](http://www.w3.org/TR/WCAG20/#keyboard-operation-all-funcs) (Level AAA) | Partially supports |  | As far as we are aware, all functionality is operable through a keyboard interface without requiring specific keystrokes. However, we have an ongoing task to certify this is the case for every part of the app. Until that is complete, this should be considered “Partial Support”. |
| [**2.2.3 No Timing**](http://www.w3.org/TR/WCAG20/#time-limits-no-exceptions) (Level AAA) | Supports | RGAA (AAA) 13.4 \- supports | DCB Admin does not contain any situations where a time limit is imposed upon the user. |
| [**2.2.4 Interruptions**](http://www.w3.org/TR/WCAG20/#time-limits-postponed) (Level AAA) | Supports | RGAA (AAA) 7.5 \- supports |  |
| [**2.2.5 Re-authenticating**](http://www.w3.org/TR/WCAG20/#time-limits-server-timeout) (Level AAA) | Does not support | RGAA (AAA) 13.5 \- does not support | At present, the user is not returned to the page they were on when re-authenticating. This is a known issue and will be fixed in upcoming releases. Notably this has already been addressed in DCB Admin for Libraries. |
| [**2.2.6 Timeouts**](https://www.w3.org/TR/WCAG21/#timeouts) (Level AAA 2.1 and 2.2) | Does not support |   | Users are not currently warned about timeouts. |
| [**2.3.2 Three Flashes**](http://www.w3.org/TR/WCAG20/#seizure-three-times) (Level AAA) | Supports | RGAA (AAA) 13.16 \- supports | DCB Admin does not contain any content that flashes. |
| [**2.3.3 Animation from Interactions**](https://www.w3.org/TR/WCAG21/#animation-from-interactions) (Level AAA 2.1 and 2.2) | Does not support |  | DCB Admin does not contain any setting to turn off animations.  |
| [**2.4.8 Location**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-location) (Level AAA) | Supports | RGAA (AAA) 12.8 \- supports. 12.9 \- supports 12.12 \- supports  | Breadcrumb trails and navigation bars are provided throughout the application. They are always relevant, and breadcrumbs always represent the page’s position in the site structure. The current page is always specified in the navigation menu. |
| [**2.4.9 Link Purpose (Link Only)**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-link) (Level AAA) | Supports | RGAA (AAA) 6.3 \- supports | Met by the use of aria-label and link text throughout the app, used to explain the purpose of a given link. |
| [**2.4.10 Section Headings**](http://www.w3.org/TR/WCAG20/#navigation-mechanisms-headings) (Level AAA) | Supports |  | Pages are organised using heading elements. |
| [**2.4.12 Focus Not Obscured (Enhanced)**](https://www.w3.org/TR/WCAG22/#focus-not-obscured-enhanced) (Level AAA 2.2 only) | Does not support |  |  |
| [**2.4.13 Focus Appearance**](https://www.w3.org/TR/WCAG22/#focus-appearance) (Level AAA 2.2 only) | Supports |  | Custom focus indicator provided to meet this criteria. |
| [**2.5.5 Target Size**](https://www.w3.org/TR/WCAG21/#target-size) (Level AAA 2.1 and 2.2) | Supports |  | All target areas meet the minimum size. |
| [**2.5.6 Concurrent Input Mechanisms**](https://www.w3.org/TR/WCAG21/#concurrent-input-mechanisms) (Level AAA 2.1 and 2.2) | Does not support |  |  |
| [**3.1.3 Unusual Words**](http://www.w3.org/TR/WCAG20/#meaning-idioms) (Level AAA) | Partially supports | RGAA (AAA) 13.9 \- Does not support 13.10 \- supports | Generally, unusual words are avoided. However there are examples of terminology that would be difficult for cognitively impaired users to understand. While there are some explainers in the application to assist with this, they are not consistent. Where definitions are provided, they are relevant. |
| [**3.1.4 Abbreviations**](http://www.w3.org/TR/WCAG20/#meaning-located) (Level AAA) | Partially supports | RGAA (AAA) 9.4 \- does not support 9.5 \- supports | Where abbreviations are used, they are generally explained. However there are some examples \- particularly the use of “Host LMS” \- that could be improved and are not always explained. |
| [**3.1.5 Reading Level**](http://www.w3.org/TR/WCAG20/#meaning-supplements) (Level AAA) | Does not support |  | We do not currently provide supplemental content for lower reading levels. However this is something we will look at doing as we aim to fully meet 3.1.3 and 3.1.4. |
| [**3.1.6 Pronunciation**](http://www.w3.org/TR/WCAG20/#meaning-pronunciation) (Level AAA) | Does not support |  | We do not provide any guides for pronunciation. |
| [**3.2.5 Change on Request**](http://www.w3.org/TR/WCAG20/#consistent-behavior-no-extreme-changes-context) (Level AAA) | Partially supports |   | Some pages that receive updates (such as the patron request page) do provide a mechanism to request an update (“Check for Updates”). However they do also auto-update and there is currently no way to prevent this. We do aim to avoid page reloads wherever possible in this situation. |
| [**3.3.5 Help**](http://www.w3.org/TR/WCAG20/#minimize-error-context-help) (Level AAA) | Partially supports | RGAA (AAA) 11.14 \- supports. 11.15 \- supports (Note that RGAA criteria only cover forms, whereas the WCAG is all areas) | Some context-sensitive help is available in certain areas but not everywhere. All forms have some form of input assistance, alongside validation, and this assistance is always relevant to the form. |
| [**3.3.6 Error Prevention (All)**](http://www.w3.org/TR/WCAG20/#minimize-error-reversible-all) (Level AAA) | Supports | RGAA (AAA) 11.13 \- supports | Some submissions are reversible (i.e. the user can go to the data change log and use that to make a new change to revert their change). All submissions are checked and the user is provided an opportunity to correct errors, while also reviewing and confirming the information they have provided. |
| [**3.3.9 Accessible Authentication (Enhanced)**](https://www.w3.org/TR/WCAG22/#accessible-authentication-enhanced) (Level AAA 2.2 only) | Supports |  | We support password entry by password managers, as well as multiple MFA methods. |

