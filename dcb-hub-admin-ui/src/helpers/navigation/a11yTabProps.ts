// WCAG 2.2 Tab Linkage Helper
export function a11yTabProps(value: string) {
	return {
		id: `patron-tab-${value.replace(/\//g, "-")}`,
		"aria-controls": `patron-tabpanel-${value.replace(/\//g, "-")}`,
		value,
	};
}
