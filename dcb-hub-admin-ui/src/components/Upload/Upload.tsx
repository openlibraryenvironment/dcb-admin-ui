import { Button, Stack } from "@mui/material";
import { useState } from "react";
import Alert from "@components/Alert/Alert";
import { fileSizeConvertor } from "src/helpers/fileSizeConverter";
import { useTranslation } from 'next-i18next';
import Uppy from "@uppy/core";
import XHR from '@uppy/xhr-upload';
import getConfig from "next/config";
import { DragDrop } from "@uppy/react";
import '@uppy/core/dist/style.min.css';
import DragDropLocale from "@uppy/drag-drop/types/generatedLocale";
import useCode from "@hooks/useCode";
import TimedAlert from "@components/TimedAlert/TimedAlert";

// These are the restrictions for files to pass client-side validation.
// TSV and CSV are the allowed file types
// 1B minimum file size to prevent empty files from being uploaded.
// 1 MB max file size (can be altered if requirement changes)

const uppy = new Uppy({
  restrictions: {
    allowedFileTypes: ['.tsv', '.csv'],
    minFileSize: 1,
    maxFileSize: 1 * 1024 * 1024, // 1 MB,
    // maxNumberOfFiles: 1 // Can only drag-and-drop one file at a time
  },
  meta: {
    category: "",
}
})
// Replace meta.category with category prop - potentially with uppy.setMeta

// This defines the URL to upload to - currently set to a placeholder.
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



// Upload component
const UppyFileUpload = ({ category }: any) => {
  const { t } = useTranslation();
  uppy.setMeta({category: category});
  const xhrplug = uppy.getPlugin('XHRUpload');

  // State management - mostly for the displaying of messages
  const [isErrorDisplayed, setErrorDisplayed] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [isAdded, setAdded] = useState(false);
  const code = useCode((state) => state.code);
  console.log(uppy.getState());


  // const [isDisabled, setDisabled] = useState(true);

  // set different kinds of errors
  const [validationErrorMessage, setValidationErrorMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const [addedFile, setAddedFile] = useState({name: "", size: 0});
  const [failedFile, setFailedFile] = useState({name: "", size: 0});

  const dismissError = () => {
    setErrorDisplayed(false);
  };

  xhrplug?.setOptions({
    getResponseError (responseText: string, response: any) {
      setErrorDisplayed(true);
      console.log("Dynamically setting options now!")
      console.log("Response is", response);
      setUploadErrorMessage("Error: "+responseText);
      // Obtains error message from the response.
      return new Error(responseText)}
  });

  const handleUpload = () => {
    uppy.upload();
  }

  const handleReset = () => {
    uppy.resetProgress();
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
    // can also supply size etc if we need to. Remove logging after QA.
  });

  // This is triggered when the upload is successful. Make sure uppy is reset on a completed upload (or even a failed one, maybe?)
  uppy.on('upload-success', (file: any, response: any) => {
    setSuccess(true);
    setSuccessCount(response?.body?.recordsImported);
    uppy.removeFile(file.id);
  })

  // This is triggered if there's an upload error
  uppy.on('error', (error: any) => {
    console.log(error);
    setErrorDisplayed(true);
    console.log(uploadErrorMessage);
    
  });
  uppy.on('upload-error', (file:any, error, response) => {
    setErrorDisplayed(true);
    setUploadErrorMessage(error.message);
    setFailedFile({name: file.name, size: file.size});
    uppy.removeFile(file.id);
  });

  // Maps all added files to display them as alerts.
  const acceptedFileItems = uppy.getFiles().map(file => (
      <Alert severityType="info" alertText={t("mappings.add_success", {fileName: file.name})} key={file.size}/>
  ));

  // Used to conditionally render the UI depending on if accepted files exist (i.e. disabling buttons etc)
  const doFilesAcceptedExist = (uppy.getFiles().length > 0) ? true : false;
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
        <Stack spacing ={1} direction={"row"}>
          <Button variant="outlined" onClick={handleReset}> Cancel</Button>
          <div style={{flex: '1 0 0'}} />
          <Button disabled={!doFilesAcceptedExist} onClick = {handleUpload} color="primary" variant="contained" type="submit">
                    {t("mappings.import_file", "Import file")}            
          </Button>
        </Stack>

        {/* Need corresponding cancel button*/}
        {/* TODO: more dynamic error display, fix autohide behaviour*/}
        {acceptedFileItems}
        {(validationErrorMessage.includes("exceeds maximum allowed size") && isErrorDisplayed) && (<TimedAlert severityType="error" open={true} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.file_too_large", {fileName: failedFile.name, fileSize: fileSizeConvertor(failedFile.size), maxSize: 1})} key={"validation-upload-error-file-size"} onCloseFunc={dismissError}/>)}
        {(validationErrorMessage.includes("This file is smaller than the allowed size") && isErrorDisplayed) && (<TimedAlert severityType="error" open={true} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.file_empty", {fileName: failedFile.name})} key={"validation-upload-error-file-empty"} onCloseFunc={dismissError}/>)}
        {(validationErrorMessage.includes("Error: You can only upload") && isErrorDisplayed) && (<TimedAlert severityType="error" open={open} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.wrong_file_type", {fileName: failedFile.name, allowedFiles: ".csv, .tsv"})} key={"validation-upload-error-file-type"} onCloseFunc={dismissError}/>)}
        {(uploadErrorMessage.includes("Empty value") && isErrorDisplayed) && (<TimedAlert open={open} severityType="error" onClose={handleClose} autoHideDuration={3000} alertText={uploadErrorMessage} key={"validation-upload-error-missing"} onCloseFunc={dismissError}/>)}
        {(uploadErrorMessage.includes("expected headers") && isErrorDisplayed) && (<TimedAlert open={open} severityType="error" onClose={handleClose} autoHideDuration={3000} alertText={uploadErrorMessage} key={"validation-upload-error-headers"} onCloseFunc={dismissError}/>)}
        {isSuccess && (<TimedAlert severityType="success" open={open} onClose={handleClose} autoHideDuration={3000} alertText={t("mappings.upload_success", {category: category, count: successCount})} key={"upload-successful"}/>)}
    </Stack>
  );
};


export default function Upload() {
  return (
    // Can pass in category here as needed - right now it's set to CirculationStatus
    <UppyFileUpload category={"CirculationStatus"}/>
  )
}