import { Button, Divider, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import getConfig from "next/config";
import useCode from "@hooks/useCode";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { useSession } from "next-auth/react";
import Confirmation from "./Confirmation/Confirmation";
import { useLazyQuery } from "@apollo/client/react";
import {
	checkExistingLocations,
	checkExistingMappings,
	checkExistingNumericRangeMappings,
} from "src/queries/queries";
import { MdCloudUpload } from "react-icons/md";
import { fileSizeConvertor } from "src/helpers/fileSizeConverter";
import { getErrorMessageKey } from "src/helpers/MappingsImport/getErrorMessageKey";
import Link from "next/link";
import { checkValidFileType } from "src/helpers/checkValidFileType";
import { getSuccessKey } from "src/helpers/MappingsImport/getSuccessMessageKey";

// WIP: Re-implementing what was previously done for us by Uppy.
// Long-term aim: feature parity with Uppy for what we need and a better UI.
const { publicRuntimeConfig } = getConfig();
const url = publicRuntimeConfig.DCB_API_BASE + "/uploadedMappings/upload";

const locationUrl = publicRuntimeConfig.DCB_API_BASE + "/locations/upload";
const ALLOWED_FILE_TYPES = {
	"text/csv": [".csv"],
	"text/tab-separated-values": [".tsv"],
};

const FileUpload = ({
	category,
	onCancel,
	type,
	presetHostLmsId,
	libraryName,
}: {
	category: string;
	onCancel: () => void;
	type: "Reference value mappings" | "Numeric range mappings" | "Locations";
	presetHostLmsId?: string;
	libraryName?: string;
}) => {
	const { t } = useTranslation();
	const { data } = useSession();
	const [isErrorDisplayed, setErrorDisplayed] = useState(false);
	const [isValidationErrorDisplayed, setValidationErrorDisplayed] =
		useState(false);
	const [isSuccess, setSuccess] = useState(false);
	const [replacement, setReplacement] = useState(false);
	const [existingMappingCount, setExistingMappingCount] = useState(0);
	const [isConfirmOpen, setConfirmOpen] = useState(false);
	const { code, resetAll } = useCode();
	const [uploadErrorMessage, setUploadErrorMessage] = useState("");
	const [validationErrorMessage, setValidationErrorMessage] = useState("");
	const [successCount, setSuccessCount] = useState(0);
	const [ignoredCount, setIgnoredCount] = useState(0);
	const [deletedCount, setDeletedCount] = useState(0);
	const [lineNumber, setLineNumber] = useState(0);
	const [addedFile, setAddedFile] = useState<File | null>(null);
	const [failedFile, setFailedFile] = useState<File | null>(null);
	const [uploadButtonClicked, setUploadButtonClicked] = useState(false);
	const headers = { Authorization: `Bearer ${data?.accessToken}` };

	const refVariablesAll = {
		query:
			"(toContext:" +
			code +
			" OR fromContext: " +
			code +
			") AND NOT deleted:true",
		pagesize: 200,
	};

	const refVariablesCategory = {
		query:
			"(toContext:" +
			code +
			" OR fromContext: " +
			code +
			") AND (fromCategory: " +
			category +
			" OR toCategory: " +
			category +
			") AND NOT deleted:true",
		pagesize: 200,
	};

	const numRangeVariablesAll = {
		query: "context:" + code + " AND NOT deleted:true",
		pagesize: 200,
	};

	const numRangeVariablesDomain = {
		query:
			"context:" + code + " AND domain:" + category + " AND NOT deleted:true",
		pagesize: 200,
	};

	const locationVariables = {
		query: "hostSystem:" + presetHostLmsId,
		pagesize: 200,
	};

	const [checkMappingsPresent] = useLazyQuery(checkExistingMappings, {
		variables: category == "all" ? refVariablesAll : refVariablesCategory,
		fetchPolicy: "network-only", // This stops it relying on cache, as mappings data needs to be up-to-date and could have changed in the last few seconds.
		onCompleted: (data) => {
			setExistingMappingCount(data?.referenceValueMappings?.totalSize);
			if (uploadButtonClicked) {
				if (data?.referenceValueMappings?.totalSize == 0 || data.isEmpty) {
					setConfirmOpen(false);
					console.log(
						"DEV: Upload file activated in non-replacement condition",
					);
					uploadFile();
				} else {
					setConfirmOpen(true);
					setReplacement(true);
				}
			}
		},
	});

	const [checkNumericRangeMappingsPresent] = useLazyQuery(
		checkExistingNumericRangeMappings,
		{
			fetchPolicy: "network-only", // This stops it relying on cache, as mappings data needs to be up-to-date and could have changed in the last few seconds.
			onCompleted: (data) => {
				setExistingMappingCount(data?.numericRangeMappings?.totalSize);
				if (uploadButtonClicked) {
					// Add this condition
					if (data?.numericRangeMappings?.totalSize == 0 || data.isEmpty) {
						setConfirmOpen(false);
						uploadFile();
					} else {
						setConfirmOpen(true);
						setReplacement(true);
					}
				}
			},
		},
	);

	const [checkLocationsPresent] = useLazyQuery(checkExistingLocations, {
		fetchPolicy: "network-only",
		onCompleted: (data) => {
			setExistingMappingCount(data?.locations?.totalSize);
			if (uploadButtonClicked) {
				// Add this condition
				if (data?.locations?.totalSize == 0 || data.isEmpty) {
					setConfirmOpen(false);
					uploadFile();
				} else {
					setConfirmOpen(true);
					setReplacement(true);
				}
			}
		},
	});
	const handleFileChange = (event: any) => {
		const file = event.target.files[0];
		if (file) {
			if (file.size > 1 * 1024 * 1024) {
				// 1 MB size limit
				setFailedFile(file);
				setErrorDisplayed(true);
				setValidationErrorDisplayed(true);
				setValidationErrorMessage("File size exceeds the limit");
				return;
			} else if (file.size == 0) {
				setFailedFile(file);
				setErrorDisplayed(true);
				setValidationErrorDisplayed(true);
				setValidationErrorMessage("File is empty");
				return;
			} else if (checkValidFileType(file, ALLOWED_FILE_TYPES) == false) {
				setFailedFile(file);
				setErrorDisplayed(true);
				setValidationErrorDisplayed(true);
				setValidationErrorMessage(
					"Invalid file type. Only CSV and TSV files are allowed.",
				);

				return;
			}
			setAddedFile(file);
			setErrorDisplayed(false);
		}
	};

	const handleConfirmUpload = (
		reason: string,
		changeCategory?: string,
		changeReferenceUrl?: string,
	) => {
		setConfirmOpen(false);
		uploadFile(reason, changeCategory, changeReferenceUrl);
	};

	const handleCancelUpload = () => {
		setConfirmOpen(false);
		setUploadButtonClicked(false); // Reset uploadButtonClicked when cancelling
	};

	const handleReset = () => {
		onCancel();
	};

	const uploadFile = (
		reason?: string,
		changeCategory?: string,
		changeReferenceUrl?: string,
	) => {
		console.log(
			"DEV: Upload file method triggered, replacement:" +
				replacement +
				" and UBC" +
				uploadButtonClicked,
		);
		if (!addedFile) {
			setErrorDisplayed(true);
			setUploadErrorMessage("No file selected for upload.");
			setUploadButtonClicked(false);
			setConfirmOpen(false);
			return;
		}
		const formData = new FormData();
		formData.append("file", addedFile);
		formData.append("code", code);
		if (type != "Locations") {
			formData.append("category", category);
		}
		formData.append("type", type);
		if (reason) {
			formData.append("reason", reason);
		} else {
			formData.append("reason", "Initial upload of mappings");
		}
		if (changeCategory) {
			formData.append("changeCategory", changeCategory);
		} else {
			formData.append("changeCategory", "Initial mappings upload");
		}
		if (changeReferenceUrl) {
			formData.append("changeReferenceUrl", changeReferenceUrl);
		}

		axios
			.post(type == "Locations" ? locationUrl : url, formData, {
				headers,
			})
			.then((response) => {
				// Handle successful upload response
				setSuccess(true);
				setSuccessCount(response.data.recordsImported ?? 0);
				setDeletedCount(response.data.recordsDeleted ?? 0);
				setIgnoredCount(response.data.recordsIgnored ?? 0);
				setUploadButtonClicked(false);
				setTimeout(() => {
					onCancel(); // Close the modal
					resetAll(); // Clear all selected values
					setAddedFile(null);
					// Reset file input
					const fileInput = document.getElementById(
						"file-upload",
					) as HTMLInputElement;
					if (fileInput) {
						fileInput.value = "";
					}
				}, 3000);
			})
			.catch((error) => {
				// Error handling
				setUploadButtonClicked(false);
				console.error("Axios error:", error);
				if (error.response) {
					// The request was made and the server responded with a non-2xx status code
					console.error("Server responded with status:", error.response.status);
					console.error("Response data:", error.response.data);
					setUploadErrorMessage(error.response.data);
					const lineNoMatch1 = error.response.data.match(/line (\d+)/i) ?? "";
					setLineNumber(lineNoMatch1[1]);
					setErrorDisplayed(true);
				} else if (error.request) {
					// The request was made but no response was received
					console.error("No response received:", error.request);
					setErrorDisplayed(true);
				} else {
					// Something happened in setting up the request that triggered an error
					console.error("Error making the upload request:", error.message);
					setErrorDisplayed(true);
				}
			});
	};

	useEffect(() => {
		setUploadButtonClicked(false);
		setConfirmOpen(false);
	}, [code, category]);

	const filesAdded = addedFile !== null;

	const handleUpload = () => {
		if (!addedFile) {
			setErrorDisplayed(true);
			setUploadErrorMessage("No file selected for upload.");
			return;
		}
		setUploadButtonClicked(true);
		if (code && category) {
			if (type === "Reference value mappings") {
				checkMappingsPresent({
					variables:
						category === "all" ? refVariablesAll : refVariablesCategory,
				});
			} else if (type == "Locations" && presetHostLmsId) {
				checkLocationsPresent({
					variables: locationVariables,
				});
			} else {
				checkNumericRangeMappingsPresent({
					variables:
						category === "all" ? numRangeVariablesAll : numRangeVariablesDomain,
				});
			}
		} else {
			setConfirmOpen(false);
			setUploadButtonClicked(false); // Reset if there's no code
		}
	};

	return (
		<Stack spacing={1}>
			<input
				type="file"
				accept=".tsv,.csv"
				onChange={handleFileChange}
				style={{ display: "none" }}
				id="file-upload"
			/>
			<Stack direction={"column"} alignContent={"center"} spacing={1} pb={3}>
				<Typography variant="h3" sx={{ fontWeight: "bold" }}>
					{t("mappings.file")}
				</Typography>
				<Typography sx={{ fontWeight: "bold" }}>
					{filesAdded ? addedFile.name : t("mappings.no_file_selected")}
				</Typography>
				<Trans
					i18nKey={"mappings.import_body_warning"}
					t={t}
					components={{
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
						paragraph: <p />,
					}}
				/>
				<Typography>{t("mappings.file_type_requirements")}</Typography>
				<Typography> {t("mappings.file_size_requirements")}</Typography>
				<label htmlFor="file-upload">
					<Button
						startIcon={<MdCloudUpload />}
						variant="outlined"
						component="span"
					>
						{t("mappings.select_file")}
					</Button>
				</label>
			</Stack>
			<Divider aria-hidden="true"></Divider>
			<Stack spacing={1} direction={"row"}>
				<Button variant="outlined" onClick={handleReset}>
					{t("mappings.cancel")}
				</Button>
				<div style={{ flex: "1 0 0" }} />
				{/* // Button should be enabled only if category, code, filesAdded all true */}
				<Button
					disabled={!filesAdded || !code || !category}
					onClick={handleUpload}
					color="primary"
					variant="contained"
					type="submit"
				>
					{t("mappings.import_file")}
				</Button>
			</Stack>
			<Confirmation
				open={isConfirmOpen}
				onClose={handleCancelUpload}
				onConfirm={(reason, changeCategory, changeReferenceUrl) =>
					handleConfirmUpload(reason, changeCategory, changeReferenceUrl)
				}
				existingMappingCount={existingMappingCount}
				fileName={addedFile?.name}
				code={code}
				type={type == "Locations" ? "locations" : "mappings"}
				mappingCategory={category}
				mappingType={type}
				entity={
					type == "Reference value mappings"
						? t("mappings.ref_value_one")
						: type == "Numeric range mappings"
							? t("mappings.num_range_one")
							: t("locations.location_one")
				}
				gridEdit={false}
				libraryName={libraryName}
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
				autoHideDuration={6000}
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
						components={{ bold: <strong />, paragraph: <p /> }}
					/>
				}
				key={"upload-successful"}
				onCloseFunc={() => setSuccess(false)}
			/>
		</Stack>
	);
};

export default FileUpload;
