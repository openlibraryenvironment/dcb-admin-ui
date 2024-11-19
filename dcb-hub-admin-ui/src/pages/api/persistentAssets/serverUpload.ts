import { put } from "@vercel/blob";
import type { NextApiResponse, NextApiRequest, PageConfig } from "next";
// Handles the upload of images and other assets to Vercel Blob.
// Note that uploader information and image URLs are saved to DCB's DB,
// but the images themselves are stored in Vercel Blob.
// See consortium/index.tsx for more on the upload process
export default async function handler(
	request: NextApiRequest,
	response: NextApiResponse,
) {
	const blob = await put(request.query.filename as string, request, {
		access: "public",
	});
	console.log("Blob upload:" + response.status);

	return response.status(200).json(blob);
}

export const config: PageConfig = {
	api: {
		bodyParser: false,
	},
};
