import { Button, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import getConfig from "next/config";
import useCode from "@hooks/useCode";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import { useSession } from "next-auth/react";
import Confirmation from "./Confirmation/Confirmation";
import { useLazyQuery } from "@apollo/client/react";
import {
	checkExistingMappings,
	checkExistingNumericRangeMappings,
} from "src/queries/queries";
import { MdCloudUpload } from "react-icons/md";
import { fileSizeConvertor } from "src/helpers/fileSizeConverter";

// WIP: Re-implementing what was previously done for us by Uppy.
// Long-term aim: feature parity with Uppy for what we need and a better UI.
const { publicRuntimeConfig } = getConfig();
const url = publicRuntimeConfig.DCB_API_BASE + "/uploadedMappings/upload";

const FileUpload = ({ category, onCancel }: any) => {
	const { t } = useTranslation();
	const { data } = useSession();
	const [isErrorDisplayed, setErrorDisplayed] = useState(false);
	const [isValidationErrorDisplayed, setValidationErrorDisplayed] =
		useState(false);
	const [isSuccess, setSuccess] = useState(false);
	const [replacement, setReplacement] = useState(false);
	const [existingMappingCount, setExistingMappingCount] = useState(0);
	const [isConfirmOpen, setConfirmOpen] = useState(false);
	const code = useCode((state) => state.code);
	const [uploadErrorMessage, setUploadErrorMessage] = useState("");
	const [validationErrorMessage, setValidationErrorMessage] = useState("");
	const [successCount, setSuccessCount] = useState(0);
	const [addedFile, setAddedFile] = useState<File | null>(null);
	const [failedFile, setFailedFile] = useState<File | null>(null);
	const [uploadButtonClicked, setUploadButtonClicked] = useState(false);
	const headers = { Authorization: `Bearer ${data?.accessToken}` };

	const getErrorMessageKey = (message: string): string => {
		switch (true) {
			case message.includes("exceeds maximum allowed size"):
				if (failedFile) {
					return t("mappings.file_too_large", {
						fileName: failedFile.name,
						fileSize: fileSizeConvertor(failedFile.size),
						maxSize: 1,
					});
				}
				return "mappings.file_size_generic";
			case message.includes("smaller than the allowed size"):
				return "mappings.file_empty";
			case message.includes("You can only upload"):
				return "mappings.wrong_file_type";
			case message.includes("Empty value"):
				return "mappings.validation_missing_values";
			case message.includes("expected headers"):
				return "mappings.validation_expected_headers";
			case message.includes("provide a Host LMS"):
				return "mappings.validation_no_hostlms";
			case message.includes("fromContext or toContext"):
				return "mappings.mismatched_context";
			default:
				return "mappings.unknown_error";
		}
	};

	const [checkMappingsPresent] = useLazyQuery(checkExistingMappings, {
		variables: {
			query:
				"(toContext:" +
				code +
				" OR fromContext: " +
				code +
				") AND deleted: false",
			pagesize: 200,
		},
		fetchPolicy: "network-only", // This stops it relying on cache, as mappings data needs to be up-to-date and could have changed in the last few seconds.
		onCompleted: (data) => {
			setExistingMappingCount(data?.referenceValueMappings?.totalSize);
			if (uploadButtonClicked) {
				// Add this condition
				if (data?.referenceValueMappings?.totalSize == 0 || data.isEmpty) {
					setConfirmOpen(false);
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
			variables: {
				query: "context:" + code + " AND deleted: false",
				pagesize: 200,
			},
			fetchPolicy: "network-only",
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
			}
			setAddedFile(file);
			setErrorDisplayed(false);
		}
	};

	const handleConfirmUpload = () => {
		setConfirmOpen(false);
		uploadFile();
	};

	const handleCancelUpload = () => {
		setConfirmOpen(false);
	};

	const handleReset = () => {
		onCancel();
	};

	const uploadFile = () => {
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
		formData.append("mappingCategory", category);

		axios
			.post(url, formData, { headers })
			.then((response) => {
				// Handle successful upload response
				setSuccess(true);
				setSuccessCount(response.data.recordsImported || 0);
			})
			.catch((error) => {
				// Error handling
				console.error("Axios error:", error);
				if (error.response) {
					// The request was made and the server responded with a non-2xx status code
					console.error("Server responded with status:", error.response.status);
					console.error("Response data:", error.response.data);
					setUploadErrorMessage(error.response.data);
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
	}, [code]);

	const filesAdded = addedFile !== null;

	const handleUpload = useCallback(() => {
		if (!addedFile) {
			setErrorDisplayed(true);
			setUploadErrorMessage("No file selected for upload.");
			return;
		}

		setUploadButtonClicked(true);

		if (code && category) {
			if (category === "Reference value mappings") {
				checkMappingsPresent();
			} else {
				checkNumericRangeMappingsPresent();
			}
		} else {
			setConfirmOpen(false); // Close the confirmation modal if any condition is not met
		}
	}, [
		addedFile,
		code,
		category,
		checkMappingsPresent,
		checkNumericRangeMappingsPresent,
	]);

	return (
		<Stack spacing={1}>
			<input
				type="file"
				accept=".tsv,.csv"
				onChange={handleFileChange}
				style={{ display: "none" }}
				id="file-upload"
			/>
			<Stack direction={"column"} alignContent={"center"} spacing={2}>
				<Typography variant="h3" sx={{ fontWeight: "bold" }}>
					{t("mappings.file")}
				</Typography>
				<Typography sx={{ fontWeight: "bold" }}>
					{filesAdded ? addedFile.name : "No file selected"}
				</Typography>
				<Typography>{t("mappings.file_type_requirements")}</Typography>
				<Typography> {t("mappings.file_size_requirements")}</Typography>
				<label htmlFor="file-upload">
					<Button
						startIcon={<MdCloudUpload />}
						variant="contained"
						component="span"
					>
						{t("mappings.select_file")}
					</Button>
				</label>
			</Stack>
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
				onConfirm={handleConfirmUpload}
				existingMappingCount={existingMappingCount}
				fileName={addedFile?.name}
				code={code}
				type="mappings"
				mappingCategory={category}
			/>
			<TimedAlert
				open={isErrorDisplayed}
				severityType="error"
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey={getErrorMessageKey(uploadErrorMessage)}
						components={{ bold: <strong />, paragraph: <p /> }}
						values={{
							fileName: addedFile?.name,
							category: category,
							count: successCount,
							code: code,
							deletedMappingCount: existingMappingCount,
							addedCount: successCount,
						}}
					/>
				}
				key={"validation-upload-error-missing"}
				onCloseFunc={() => setErrorDisplayed(false)}
			/>
			<TimedAlert
				severityType="error"
				open={isValidationErrorDisplayed}
				autoHideDuration={3000}
				alertText={getErrorMessageKey(validationErrorMessage)}
				key={"validation-upload-error-file-size"}
				onCloseFunc={() => setValidationErrorDisplayed(false)}
			/>
			<TimedAlert
				severityType="success"
				open={isSuccess}
				autoHideDuration={6000}
				alertText={
					<Trans
						i18nKey={
							isSuccess && !replacement
								? t("mappings.upload_success", {
										category: category.toLowerCase(),
										count: successCount,
										code: code,
									})
								: t("mappings.upload_success_replacement", {
										category: category.toLowerCase(),
										addedCount: successCount,
										code: code,
										deletedMappingCount: existingMappingCount,
									})
						}
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
