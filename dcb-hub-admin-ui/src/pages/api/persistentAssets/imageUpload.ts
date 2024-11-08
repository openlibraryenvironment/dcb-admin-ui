import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextApiResponse, NextApiRequest } from "next";

export default async function handler(
	request: NextApiRequest,
	response: NextApiResponse,
) {
	const body = request.body as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				// Generate a client token for the browser to upload the file
				// ⚠️ Authenticate and authorize users before generating the token.
				// Otherwise, you're allowing anonymous uploads.
				console.log(clientPayload);

				return {
					allowedContentTypes: ["image/jpeg", "image/png", "image/gif"],
					tokenPayload: JSON.stringify({
						// optional, sent to your server on upload completion
						// you could pass a user id from auth, or a value from clientPayload
						// figure out how to pass user ID
						userInfo: clientPayload,
					}),
				};
			},
			onUploadCompleted: async ({ blob, tokenPayload }) => {
				// Get notified of client upload completion
				// ⚠️ This will not work on `localhost` websites,
				// Use ngrok or similar to get the full upload flow

				console.log("blob upload completed", blob, tokenPayload);

				try {
					// Run any logic after the file upload completed
					// const { userId } = JSON.parse(tokenPayload);
					// await db.update({ avatar: blob.url, userId });
				} catch (error) {
					throw new Error("Could not update user");
				}
			},
		});

		return response.status(200).json(jsonResponse);
	} catch (error) {
		// The webhook will retry 5 times waiting for a 200
		return response.status(400).json({ error: (error as Error).message });
	}
}
