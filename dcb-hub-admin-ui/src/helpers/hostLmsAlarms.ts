import { toLuceneTerm } from "@helpers/dataGrid/buildFilterQuery";

/**
 * The alarms raised for one Host LMS. dcb-service codes each of them "ILS.<host LMS code>.<what>",
 * and matches a wildcard case-insensitively.
 */
export const hostLmsAlarmsQuery = (hostLmsCode: string): string =>
	`code:ILS.${toLuceneTerm(hostLmsCode)}.*`;
