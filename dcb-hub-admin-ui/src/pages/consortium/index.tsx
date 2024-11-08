import { AdminLayout } from "@layout";
import { Box, Button, Tab, Tabs, Typography } from "@mui/material";
import { PutBlobResult } from "@vercel/blob";
import { upload } from "@vercel/blob/client";
import { GetServerSideProps, GetServerSidePropsContext, NextPage } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { adminOrConsortiumAdmin } from "src/constants/roles";

const Consortium: NextPage = () => {
	const { t } = useTranslation();
	const [tabIndex, setTabIndex] = useState(0);
	const { data: session } = useSession();
	const router = useRouter();
	const inputFileRef = useRef<HTMLInputElement>(null);
	const [blob, setBlob] = useState<PutBlobResult | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const isAnAdmin = session?.profile?.roles?.some((role: string) =>
		adminOrConsortiumAdmin.includes(role),
	);

	console.log(session);

	const username = session?.user?.name;
	const userId = session?.user?.id;
	const email = session?.user?.email ?? "No email provided";

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
		switch (newValue) {
			case 0:
				router.push("/consortium");
				break;
			case 1:
				router.push("/consortium/policies");
				break;
			case 2:
				router.push("/consortium/onboarding");
				break;
			case 3:
				router.push("/consortium/contacts");
				break;
		}
	};

	return (
		<AdminLayout title={t("nav.consortium.name")}>
			<Tabs
				value={tabIndex}
				onChange={handleTabChange}
				aria-label="Consortium Navigation"
			>
				<Tab label={t("nav.consortium.profile")} />
				<Tab label={t("nav.consortium.policies")} />
				<Tab label={t("nav.consortium.onboarding")} />
				<Tab label={t("nav.consortium.contacts")} />
			</Tabs>
			{tabIndex === 0 && (
				<Box sx={{ py: 4 }}>
					<Typography variant="h4" gutterBottom>
						{t("consortium.header_title")}
					</Typography>
					<Typography>{t("consortium.body")}</Typography>
				</Box>
			)}
			{t("consortium.upload_image_header")}

			<form
				onSubmit={async (event) => {
					setIsUploading(true);
					event.preventDefault();

					if (!inputFileRef.current?.files) {
						throw new Error("No file selected");
					}

					const file = inputFileRef.current.files[0];

					const newBlob = await upload(file.name, file, {
						access: "public",
						handleUploadUrl: "/api/persistentAssets/imageUpload",
						clientPayload: `Uploaded by user with userId: ${userId}, username: ${username} and email : ${email}`,
					});

					setBlob(newBlob);
				}}
			>
				<input name="file" ref={inputFileRef} type="file" required />
				<Button
					variant="contained"
					type="submit"
					disabled={isUploading || !isAnAdmin}
					sx={{ mt: 2 }}
				>
					{isUploading ? "Uploading..." : "Upload"}
				</Button>
			</form>
			{blob && (
				<Box sx={{ mt: 3 }}>
					<Typography variant="subtitle1">Uploaded Image:</Typography>
					<img
						src={blob.url}
						alt="Uploaded content"
						style={{
							maxWidth: "200px",
							maxHeight: "200px",
							objectFit: "contain",
							marginTop: "8px",
						}}
					/>
				</Box>
			)}
		</AdminLayout>
	);
};

export const getServerSideProps: GetServerSideProps = async (
	context: GetServerSidePropsContext,
) => {
	const { locale } = context;
	let translations = {};
	if (locale) {
		translations = await serverSideTranslations(locale as string, [
			"common",
			"application",
			"validation",
		]);
	}
	return {
		props: {
			...translations,
		},
	};
};

export default Consortium;
