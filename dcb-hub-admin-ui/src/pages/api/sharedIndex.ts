import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const { query, offset, limit } = req.query;
	const accessToken = req.headers.authorization?.split(" ")[1];

	if (!accessToken) {
		return res.status(401).json({ error: "No access token provided" });
	}

	if (!query) {
		return res.status(400).json({ error: "No search query provided" });
	}

	try {
		const response = await axios.get(
			`${process.env.DCB_SEARCH_BASE}/search/instances`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				params: {
					query: query,
					offset: offset,
					limit: limit,
					expandAll: true,
				},
			},
		);

		res.status(200).json(response.data);
	} catch (error) {
		console.error("Error proxying request to DCB Locate:", error);
		if (axios.isAxiosError(error) && error.response) {
			// Log more details about the error
			console.error("DCB Locate API error status:", error.response.status);
			console.error("DCB Locate error data:", error.response.data);
		}
		res.status(500).json({
			error: "An error occurred while fetching data from DCB locate.",
		});
	}
}
