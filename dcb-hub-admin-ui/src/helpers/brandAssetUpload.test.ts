import { describe, expect, it, vi } from "vitest";
import {
	BrandUploadError,
	hasStagedImages,
	uploadStagedBrandImages,
} from "./brandAssetUpload";

const FALLBACK = "The image could not be uploaded.";

const png = (name: string) =>
	new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], name, {
		type: "image/png",
	});

describe("uploadStagedBrandImages", () => {
	it("uploads nothing when nothing is staged", async () => {
		const post = vi.fn();

		const urls = await uploadStagedBrandImages(
			{ brandLogoUrl: null },
			{ post },
			FALLBACK,
		);

		expect(urls).toEqual({});
		expect(post).not.toHaveBeenCalled();
	});

	it("returns the stored URL against the field it belongs to", async () => {
		const post = vi
			.fn()
			.mockResolvedValue({ data: { url: "/discovery/brand-assets/abc.png" } });

		const urls = await uploadStagedBrandImages(
			{ brandLogoUrl: png("logo.png") },
			{ post },
			FALLBACK,
		);

		expect(urls).toEqual({ brandLogoUrl: "/discovery/brand-assets/abc.png" });
		expect(post).toHaveBeenCalledWith("/brand-assets", expect.any(FormData));
	});

	it("uploads every staged image, keyed separately", async () => {
		const post = vi
			.fn()
			.mockResolvedValueOnce({
				data: { url: "/discovery/brand-assets/one.png" },
			})
			.mockResolvedValueOnce({
				data: { url: "/discovery/brand-assets/two.png" },
			});

		const urls = await uploadStagedBrandImages(
			{ brandLogoUrl: png("logo.png"), brandHeaderIconUrl: png("icon.png") },
			{ post },
			FALLBACK,
		);

		expect(urls).toEqual({
			brandLogoUrl: "/discovery/brand-assets/one.png",
			brandHeaderIconUrl: "/discovery/brand-assets/two.png",
		});
	});

	/**
	 * dcb-service writes its refusals for a person. Losing that sentence and showing a
	 * status code instead undoes the whole argument for validating on the server.
	 */
	it("carries the server's own words, and the field they belong to", async () => {
		const post = vi.fn().mockRejectedValue({
			response: {
				data: {
					message:
						"the image is 6000x4000; the limit is 4096 pixels on either edge",
				},
			},
		});

		const failure = await uploadStagedBrandImages(
			{ brandHeaderIconUrl: png("icon.png") },
			{ post },
			FALLBACK,
		).catch((error: unknown) => error);

		expect(failure).toBeInstanceOf(BrandUploadError);
		expect((failure as BrandUploadError).field).toBe("brandHeaderIconUrl");
		expect((failure as BrandUploadError).message).toContain("6000x4000");
	});

	/** A 404 means uploads are off on this deployment, and carries no message. */
	it("falls back when the failure carries no message", async () => {
		const post = vi.fn().mockRejectedValue({ response: { status: 404 } });

		const failure = await uploadStagedBrandImages(
			{ brandLogoUrl: png("logo.png") },
			{ post },
			FALLBACK,
		).catch((error: unknown) => error);

		expect((failure as BrandUploadError).message).toBe(FALLBACK);
	});

	/**
	 * Sequential on purpose: nothing after the first refusal is stored, so there is less
	 * left unreferenced and nothing to explain.
	 */
	it("stops at the first refusal rather than uploading the rest", async () => {
		const post = vi
			.fn()
			.mockRejectedValueOnce({ response: { data: { message: "no" } } })
			.mockResolvedValue({ data: { url: "/discovery/brand-assets/two.png" } });

		await expect(
			uploadStagedBrandImages(
				{ brandLogoUrl: png("logo.png"), brandHeaderIconUrl: png("icon.png") },
				{ post },
				FALLBACK,
			),
		).rejects.toBeInstanceOf(BrandUploadError);

		expect(post).toHaveBeenCalledTimes(1);
	});
});

describe("hasStagedImages", () => {
	it("is false for empty and for cleared fields", () => {
		expect(hasStagedImages({})).toBe(false);
		expect(hasStagedImages({ brandLogoUrl: null })).toBe(false);
	});

	it("is true when anything is waiting", () => {
		expect(hasStagedImages({ brandLogoUrl: png("logo.png") })).toBe(true);
	});
});
