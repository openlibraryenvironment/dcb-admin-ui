import { describe, expect, it, vi } from "vitest";
import type { AxiosInstance } from "axios";

import { bibAuditLogQuery } from "./bibAuditLog";

describe("bibAuditLogQuery", () => {
	// As text, "…14:00:00.5Z" sorts before "…14:00:00Z" though it is later
	it("orders entries by when they happened, not by their text", async () => {
		const get = vi.fn().mockResolvedValue({
			data: {
				ingest: [
					{
						id: "later",
						processType: "ingest",
						message: "",
						timestamp: "2026-11-01T14:00:00.500Z",
					},
					{
						id: "earlier",
						processType: "ingest",
						message: "",
						timestamp: "2026-11-01T14:00:00Z",
					},
				],
			},
		});
		const query = bibAuditLogQuery(
			{ get } as unknown as AxiosInstance,
			"b1",
			true,
		);

		const entries = await (query.queryFn as any)({ signal: undefined });

		expect(entries.map((entry: { id: string }) => entry.id)).toEqual([
			"earlier",
			"later",
		]);
	});
});
