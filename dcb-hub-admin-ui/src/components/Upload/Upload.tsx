import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useState } from "react";
import Alert from "@components/Alert/Alert";
import { fileSizeConvertor } from "src/helpers/fileSizeConverter";
import { Trans, useTranslation } from 'next-i18next';
import Uppy from "@uppy/core";
import XHR from '@uppy/xhr-upload';
import getConfig from "next/config";
import { DragDrop } from "@uppy/react";
import '@uppy/core/dist/style.min.css';
import DragDropLocale from "@uppy/drag-drop/types/generatedLocale";
import useCode from "@hooks/useCode";
import TimedAlert from "@components/TimedAlert/TimedAlert";
import axios from "axios";
import { useSession } from "next-auth/react";
import { isEmpty } from 'lodash'
import Confirmation from "./Confirmation/Confirmation";

// These are the restrictions for files to pass client-side validation.
// TSV and CSV are the allowed file types
// 1B minimum file size to prevent empty files from being uploaded.
// 1 MB max file size (can be altered if requirement changes)

const uppy = new Uppy({
  restrictions: {
    allowedFileTypes: ['.tsv', '.csv'],
    minFileSize: 1,
    maxFileSize: 1 * 1024 * 1024, // 1 MB,
    maxNumberOfFiles: 1 // Can only drag-and-drop one file at a time
  },
  meta: {
    category: "",
}
})

const { publicRuntimeConfig } = getConfig();

const componentText:DragDropLocale = { strings: {
  // Text to show on the droppable area - see https://uppy.io/docs/drag-drop/#locale
  // `%{browse}` is replaced with a link that opens the system file selection dialog.
  dropHereOr: 'Drag and drop or %{browse}',
  // Used as the label for the link that opens the system file selection dialog.
  browse: 'select a file',
}};
const url = publicRuntimeConfig.DCB_API_BASE + '/uploadedMappings/upload'
// Using Uppy XHR plugin to manage the upload
// Make sure this isn't happening twice
uppy.use(XHR, { endpoint: url,
  getResponseError (responseText, response) {
  // this will get the message
  return new Error(responseText)
} });

// Upload component, using Uppy - docs at https://uppy.io/docs/ 
const UppyFileUpload = ({ category, onCancel }: any) => {
  const { t } = useTranslation();
  uppy.setMeta({category: category});
  const xhrplug = uppy.getPlugin('XHRUpload');
  const { data, status } = useSession();
  // State management - mostly for the displaying of messages
  const [isErrorDisplayed, setErrorDisplayed] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [mappingsExist, setMappingsExist] = useState(false);
  const [replacement, setReplacement] = useState(false);
  const [existingMappingCount, setExistingMappingCount] = useState(0);
  // this is re-defining on re-render, very annoying
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isAdded, setAdded] = useState(false);
  const code = useCode((state) => state.code);
  // set different kinds of errors
  const [validationErrorMessage, setValidationErrorMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [generalErrorMessage, setGeneralErrorMessage] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const [addedFile, setAddedFile] = useState({name: "", size: 0});
  const [failedFile, setFailedFile] = useState({name: "", size: 0});

  const dismissError = () => {
    setErrorDisplayed(false);
  };

  // TODO: Make this adaptable to different categories
  const checkMappingsExist: any = async () => {
    const existenceUrl =
      publicRuntimeConfig.DCB_API_BASE + '/uploadedMappings/CirculationStatus/'+code;

    const response = await axios.get<any>(existenceUrl, {
      headers: { Authorization: `Bearer ${data?.accessToken}` },
    });
    const doMappingsExist = !isEmpty(response?.data);
    setMappingsExist(doMappingsExist);
    // Check if mappings exist or not.
    if (!isEmpty(response?.data))
    {
      setExistingMappingCount(response?.data?.length);
      return true;
    }
    // Mappings don't exist, so return false (count is irrelevant as no modal is shown in this instance.)
    return false;
  };
  const headers = { Authorization: `Bearer ${data?.accessToken}` };
  
  xhrplug?.setOptions({
    headers,
    getResponseError (responseText: string, response: any) {
      setErrorDisplayed(true);
      setUploadErrorMessage("Error: "+responseText);
      // Obtains error message from the response.
      return new Error(responseText)}
  });

  const handleUpload = async () => {
    // Wait for the asynchronous checkMappingsExist to complete
    const mappingsExistResult = await checkMappingsExist();
  
    // If mappings exist, show our modal for confirming the upload
    if (mappingsExistResult) {
      setConfirmOpen(true);
      setReplacement(true);
    } else {
      // If mappings don't exist, proceed with the upload, no need to show the modal
      uppy.upload();
    }
  };
  
  // Functions to regulate the confirm modal's visibility - may be able to refactor

  const handleConfirmUpload = () => {
    setConfirmOpen(false);
    uppy.upload();
  };

  const handleCancelUpload = () => {
    setConfirmOpen(false);
  };

  const handleReset = () => {
    // this needs to clean-up, and then close the modal.
    uppy.resetProgress();
    onCancel();
  }

  // Uppy has events that we can listen for and act accordingly.
  // This is for when validation fails / file doesn't pass a restriction.
  uppy.on('restriction-failed', (file: any, error: any) => {
    console.log("Restriction for", file.name, "failed with", error)
    // We save the name and size of the failed file, as well as error data.
    setFailedFile({name: file.name, size: file.size});
    setErrorDisplayed(true);
    setValidationErrorMessage("Validation on "+ file.name+ " failed with "+ error)
  });

  // This gets triggered when a file passes validation
  uppy.on('file-added', (file: any) => {
    setAdded(true);
    setAddedFile({name: file.name, size: file.size});
    setErrorDisplayed(false);
    uppy.setFileMeta(file.id, {
      code: code,
      mappingCategory: category
    });
  });

  // This is triggered when the upload is successful. Make sure uppy is reset on a completed upload (or even a failed one, maybe?)
  uppy.on('upload-success', (file: any, response: any) => {
    setSuccess(true);
    setSuccessCount(response?.body?.recordsImported);
    setDeletedCount(response?.body?.recordsDeleted);
    uppy.removeFile(file.id);
  })

  // This is triggered if there's an upload error
  uppy.on('error', (error: any) => {
    console.log("Error information", error);
    setErrorDisplayed(true);
    setGeneralErrorMessage(error.message);
    console.log(uploadErrorMessage);
    
  });
  uppy.on('upload-error', (file:any, error, response) => {
    setErrorDisplayed(true);
    setUploadErrorMessage(error.message);
    setFailedFile({name: file.name, size: file.size});
    uppy.removeFile(file.id);
  });

  // Used to conditionally render the UI depending on if accepted files exist (i.e. disabling buttons etc)
  const filesAdded = (uppy.getFiles().length > 0) ? true : false;
  const noteText = "Supported file types: TSV and CSV \n Maximum file size: 1 MB";

  const [open, setOpen] = useState(true);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  
  return (
    <Stack spacing={1}>
        <DragDrop className="uppy-DragDrop--isDragDropSupported"
            uppy={uppy}
            note={noteText}
            locale={componentText}
        />
        <Stack spacing={1} direction={"row"}>
          <Button variant="outlined" onClick={handleReset}> {t("mappings.cancel", "Cancel")}</Button>
          {/* This makes the Cancel and Import buttons left and right aligned, respectively*/}
          <div style={{flex: '1 0 0'}} />
          <Button disabled={!filesAdded && (code == ''  || code == undefined)} onClick = {handleUpload} color="primary" variant="contained" type="submit">
                    {t("mappings.import_file", "Import file")}            
          </Button>
        </Stack>
        <Confirmation
            open={isConfirmOpen}
            onClose={handleCancelUpload}
            onConfirm={handleConfirmUpload}
            existingMappingCount={existingMappingCount}
            fileName={addedFile.name}
            code={code}
          />
        {/* TODO: more dynamic error display, fix autohide behaviour
        Alert will be replaced in DCB-535*/}

        {filesAdded? <Card>
          <Alert severityType="info" alertText={t("mappings.add_success", {fileName: addedFile.name})} key={addedFile.size}/>
        </Card>:null}
        {(validationErrorMessage.includes("exceeds maximum allowed size") && isErrorDisplayed) && (<TimedAlert severityType="error" open={true} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.file_too_large", {fileName: failedFile.name, fileSize: fileSizeConvertor(failedFile.size), maxSize: 1})} key={"validation-upload-error-file-size"} onCloseFunc={dismissError}/>)}
        {(validationErrorMessage.includes("This file is smaller than the allowed size") && isErrorDisplayed) && (<TimedAlert severityType="error" open={true} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.file_empty", {fileName: failedFile.name})} key={"validation-upload-error-file-empty"} onCloseFunc={dismissError}/>)}
        {(validationErrorMessage.includes("Error: You can only upload") && isErrorDisplayed) && (<TimedAlert severityType="error" open={open} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.wrong_file_type", {fileName: failedFile.name, allowedFiles: "CSV, TSV"})} key={"validation-upload-error-file-type"} onCloseFunc={dismissError}/>)}
        {(uploadErrorMessage.includes("Empty value") && isErrorDisplayed) && (<TimedAlert open={open} severityType="error" onClose={handleClose} autoHideDuration={3000} alertText={<Trans i18nKey="mappings.validation_missing_values">
                The columns <strong>“Local code”</strong> and <strong>“Local meaning”</strong> must contain data. One or more cells in these columns is empty. Please fix and retry.
                </Trans>} key={"validation-upload-error-missing"} onCloseFunc={dismissError}/>)}
        {(uploadErrorMessage.includes("expected headers") && isErrorDisplayed) && (<TimedAlert open={open} severityType="error" onClose={handleClose} autoHideDuration={3000} alertText={<Trans i18nKey ="mappings.validation_expected_headers" values={{fileName: addedFile.name}}>
                The column headers in <strong>filename</strong> do not match the expected headers. The first three columns must be named “Local code”, “Local meaning” and “DCB code”. Please correct the column headers and retry.
                </Trans>} key={"validation-upload-error-headers"} onCloseFunc={dismissError}/>)}
        {(uploadErrorMessage.includes("provide a Host LMS") && isErrorDisplayed) && (<TimedAlert open={open} severityType="error" onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.validation_no_hostlms")} key={"validation-no-hostlms"} onCloseFunc={dismissError}/>)}
        {(uploadErrorMessage.includes("DCB code is invalid") && isErrorDisplayed) && (<TimedAlert open={open} severityType="error" onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.validation_invalid_dcb_code")} key={"validation-invalid-dcb-code"} onCloseFunc={dismissError}/>)}
        {(isSuccess && !replacement) && (<TimedAlert severityType="success" open={open} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.upload_success", {category: category, count: successCount, code: code})} key={"upload-successful"}/>)}
        {(isSuccess && replacement) && (<TimedAlert severityType="success" open={open} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.upload_success_replacement", {category: category, addedCount: successCount, code: code, deletedMappingCount: existingMappingCount})} key={"upload-successful"}/>)}
    </Stack>
  );
};

export default function Upload({onCancel}: any) {
  return (
    // Can pass in category here as needed - right now it's set to CirculationStatus
    <UppyFileUpload category={"CirculationStatus"} onCancel = {onCancel}/>
  )
}