import { useState, useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import axios from "axios";
import { Box, Button, Divider, Link, Stack, Typography } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";

import useCode from "@hooks/useCode";
import { useGraphQLClient } from "@hooks/useGraphQLClient";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import Confirmation from "../Confirmation/Confirmation";

import { checkExistingMappings } from "@queries/checkExistingMappings";

import { fileSizeConvertor } from "@helpers/fileSizeConverter";
import { checkValidFileType } from "@helpers/checkValidFileType";
import { getErrorMessageKey } from "@helpers/MappingsImport/getErrorMessageKey";
import { getSuccessKey } from "@helpers/MappingsImport/getSuccessMessageKey";
import { checkExistingLocations } from "@queries/checkExistingLocations";
import { checkExistingNumericRangeMappings } from "@queries/checkExistingNumericRangeMappings";

const ALLOWED_FILE_TYPES = {
	"text/csv": [".csv"],
	"text/tab-separated-values": [".tsv"],
};

interface FileUploadProps {
	category: string;
	onCancel: () => void;
	type: "Reference value mappings" | "Numeric range mappings" | "Locations";
	presetHostLmsId?: string;
	libraryName?: string;
}

export default function FileUpload({
	category,
	onCancel,
	type,
	presetHostLmsId,
	libraryName,
}: FileUploadProps) {
	const { t } = useTranslation();
	const auth = useAuth();
	const gqlClient = useGraphQLClient();
	const { code, resetAll } = useCode();

	const [addedFile, setAddedFile] = useState<File | null>(null);
	const [failedFile, setFailedFile] = useState<File | null>(null);

	const [isConfirmOpen, setConfirmOpen] = useState(false);
	const [replacement, setReplacement] = useState(false);
	const [existingMappingCount, setExistingMappingCount] = useState(0);

	const [isErrorDisplayed, setErrorDisplayed] = useState(false);
	const [uploadErrorMessage, setUploadErrorMessage] = useState("");
	const [lineNumber, setLineNumber] = useState("0");

	const [isValidationErrorDisplayed, setValidationErrorDisplayed] =
		useState(false);
	const [validationErrorMessage, setValidationErrorMessage] = useState("");

	const [isSuccess, setSuccess] = useState(false);
	const [successCount, setSuccessCount] = useState(0);
	const [ignoredCount, setIgnoredCount] = useState(0);
	const [deletedCount, setDeletedCount] = useState(0);

	const uploadUrl =
		import.meta.env.VITE_DCB_API_BASE +
		(type === "Locations" ? "/locations/upload" : "/uploadedMappings/upload");
	const headers = { Authorization: `Bearer ${auth.user?.access_token}` };

	useEffect(() => {
		setConfirmOpen(false);
	}, [code, category]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.size > 1 * 1024 * 1024) {
			setFailedFile(file);
			setValidationErrorDisplayed(true);
			setValidationErrorMessage("File size exceeds the limit");
			return;
		}

		if (file.size === 0) {
			setFailedFile(file);
			setValidationErrorDisplayed(true);
			setValidationErrorMessage("File is empty");
			return;
		}

		if (!checkValidFileType(file, ALLOWED_FILE_TYPES)) {
			setFailedFile(file);
			setValidationErrorDisplayed(true);
			setValidationErrorMessage(
				"Invalid file type. Only CSV and TSV files are allowed.",
			);
			return;
		}

		setAddedFile(file);
		setErrorDisplayed(false);
		setValidationErrorDisplayed(false);
	};

	const handleUploadCheck = async () => {
		if (!addedFile) {
			setUploadErrorMessage("No file selected for upload.");
			setErrorDisplayed(true);
			return;
		}

		if (!code || !category) return;

		try {
			let totalSize = 0;

			if (type === "Reference value mappings") {
				const queryVars =
					category === "all"
						? {
								query: `(toContext:${code} OR fromContext:${code}) AND NOT deleted:true`,
								pagesize: 1,
							}
						: {
								query: `(toContext:${code} OR fromContext:${code}) AND (fromCategory:${category} OR toCategory:${category}) AND NOT deleted:true`,
								pagesize: 1,
							};
				const res = await gqlClient.request<any>(
					checkExistingMappings,
					queryVars,
				);
				totalSize = res?.referenceValueMappings?.totalSize ?? 0;
			} else if (type === "Locations" && presetHostLmsId) {
				const res = await gqlClient.request<any>(checkExistingLocations, {
					query: `hostSystem:${presetHostLmsId}`,
					pagesize: 1,
				});
				totalSize = res?.locations?.totalSize ?? 0;
			} else if (type === "Numeric range mappings") {
				const queryVars =
					category === "all"
						? { query: `context:${code} AND NOT deleted:true`, pagesize: 1 }
						: {
								query: `context:${code} AND domain:${category} AND NOT deleted:true`,
								pagesize: 1,
							};
				const res = await gqlClient.request<any>(
					checkExistingNumericRangeMappings,
					queryVars,
				);
				totalSize = res?.numericRangeMappings?.totalSize ?? 0;
			}

			setExistingMappingCount(totalSize);

			if (totalSize === 0) {
				uploadFile();
			} else {
				setReplacement(true);
				setConfirmOpen(true);
			}
		} catch (error) {
			console.error("Error checking existing entities:", error);
			setErrorDisplayed(true);
		}
	};

	const uploadFile = async (
		reason?: string,
		changeCategory?: string,
		changeReferenceUrl?: string,
	) => {
		if (!addedFile) return;

		const formData = new FormData();
		formData.append("file", addedFile);
		formData.append("code", code);
		formData.append("type", type);

		if (type !== "Locations") formData.append("category", category);
		formData.append(
			"reason",
			reason ||
				(type === "Locations"
					? "Pickup locations upload"
					: "Initial upload of mappings"),
		);
		formData.append(
			"changeCategory",
			changeCategory ||
				(type === "Locations"
					? "Pickup locations upload"
					: "Initial mappings upload"),
		);
		if (changeReferenceUrl)
			formData.append("changeReferenceUrl", changeReferenceUrl);

		try {
			const response = await axios.post(uploadUrl, formData, { headers });

			setSuccess(true);
			setSuccessCount(response.data.recordsImported ?? 0);
			setDeletedCount(response.data.recordsDeleted ?? 0);
			setIgnoredCount(response.data.recordsIgnored ?? 0);

			setTimeout(() => {
				onCancel();
				resetAll();
				setAddedFile(null);
			}, 6000);
		} catch (error: any) {
			if (error.response) {
				setUploadErrorMessage(error.response.data);
				const match = error.response.data.match(/line (\d+)/i);
				if (match) setLineNumber(match[1]);
			}
			setErrorDisplayed(true);
		}
	};

	const docLink =
		type === "Locations"
			? "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/3411804195/Importing+pickup+locations+in+DCB+Admin"
			: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/3201400850/Importing+mappings+in+DCB+Admin";

	const filesAdded = addedFile !== null;

	return (
		<Stack spacing={1}>
			<input
				type="file"
				accept=".tsv,.csv"
				onChange={handleFileChange}
				style={{ display: "none" }}
				id="file-upload"
			/>
			<Stack direction="column" alignContent="center" spacing={1} pb={3}>
				<Typography variant="h3" sx={{ fontWeight: "bold" }}>
					{t("mappings.file")}
				</Typography>
				<Typography sx={{ fontWeight: "bold" }}>
					{filesAdded ? addedFile.name : t("mappings.no_file_selected")}
				</Typography>
				<Trans
					i18nKey="mappings.import_body_warning"
					components={{
						linkComponent: (
							<a href={docLink} target="_blank" rel="noopener noreferrer" />
						),
						paragraph: <p />,
					}}
				/>
				<Typography>{t("mappings.file_type_requirements")}</Typography>
				<Typography>{t("mappings.file_size_requirements")}</Typography>
				<label htmlFor="file-upload">
					<Button
						startIcon={<CloudUpload />}
						variant="outlined"
						component="span"
					>
						{t("mappings.select_file")}
					</Button>
				</label>
			</Stack>

			<Divider aria-hidden="true" />

			<Stack spacing={1} direction="row">
				<Button variant="outlined" onClick={onCancel}>
					{t("mappings.cancel")}
				</Button>
				<Box sx={{ flex: 1 }} />
				<Button
					disabled={!filesAdded || !code || !category}
					onClick={handleUploadCheck}
					color="primary"
					variant="contained"
				>
					{t("mappings.import_file")}
				</Button>
			</Stack>

			<Confirmation
				open={isConfirmOpen}
				onClose={() => setConfirmOpen(false)}
				onConfirm={(reason, changeCategory, changeReferenceUrl) => {
					setConfirmOpen(false);
					uploadFile(reason, changeCategory, changeReferenceUrl);
				}}
				action="uploadReplacement"
				entityName={
					type === "Reference value mappings"
						? t("mappings.ref_value_one")
						: type === "Numeric range mappings"
							? t("mappings.num_range_one")
							: t("locations.location_one")
				}
				customWarningText={
					<Trans
						i18nKey="mappings.replacement_warning_text"
						values={{
							count: existingMappingCount,
							fileName: addedFile?.name,
							code,
							category,
							type,
							libraryName,
						}}
						components={{ bold: <strong /> }}
					/>
				}
			/>
			<TimedAlert
				open={isErrorDisplayed}
				severityType="error"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey={getErrorMessageKey(uploadErrorMessage, type)}
						components={{ bold: <strong />, paragraph: <p /> }}
						values={{
							fileName: addedFile?.name,
							category:
								category == "all"
									? type?.toLowerCase()
									: category + " " + type?.toLowerCase(),
							count: successCount,
							code: code,
							deletedMappingCount: deletedCount, // existingMappingCount
							addedCount: successCount,
							lineNumber: lineNumber,
						}}
					/>
				}
				key={"upload-error"}
				onCloseFunc={() => setErrorDisplayed(false)}
			/>
			<TimedAlert
				severityType="error"
				open={isValidationErrorDisplayed}
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey={
							failedFile
								? getErrorMessageKey(validationErrorMessage, type)
								: "mappings.file_size_generic"
						}
						components={{ bold: <strong />, paragraph: <p /> }}
						values={{
							fileName: failedFile ? failedFile.name : "",
							fileSize: failedFile ? fileSizeConvertor(failedFile.size) : 0,
							maxSize: 1,
						}}
					/>
				}
				key={"validation-error"}
				onCloseFunc={() => setValidationErrorDisplayed(false)}
			/>
			<TimedAlert
				severityType="success"
				open={isSuccess}
				autoHideDuration={12000}
				alertText={
					<Trans
						i18nKey={getSuccessKey(type, replacement, ignoredCount)}
						values={{
							count: successCount,
							code: code,
							ignoredCount: ignoredCount,
							deletedMappingCount: deletedCount,
							addedCount: successCount,
							category:
								category == "all"
									? type?.toLowerCase()
									: category + " " + type?.toLowerCase(),
							libraryName: libraryName,
						}}
						components={{
							bold: <strong />,
							paragraph: <p />,
							linkComponent: (
								<Link
									key="import-user-guide"
									href={
										type == "Locations"
											? "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/3411804195/Importing+pickup+locations+in+DCB+Admin"
											: "https://openlibraryfoundation.atlassian.net/wiki/spaces/DCB/pages/3201400850/Importing+mappings+in+DCB+Admin"
									}
								/>
							),
						}}
					/>
				}
				key={"upload-successful"}
				onCloseFunc={() => setSuccess(false)}
			/>
		</Stack>
	);
}
