import { put } from "@vercel/blob";
import type { NextApiResponse, NextApiRequest, PageConfig } from "next";

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
