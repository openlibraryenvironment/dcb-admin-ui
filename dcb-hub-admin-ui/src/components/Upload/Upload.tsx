import { Button } from "@mui/material";
import { useState } from "react";
import Alert from "@components/Alert/Alert";
import { fileSizeConvertor } from "src/helpers/fileSizeConverter";
import { useTranslation } from 'next-i18next';
import Uppy from "@uppy/core";
import XHR from '@uppy/xhr-upload';
import getConfig from "next/config";
import { DragDrop } from "@uppy/react";
import '@uppy/core/dist/style.min.css';

// These are the restrictions for files to pass client-side validation.
// TSV and CSV are the allowed file types
// 1B minimum file size to prevent empty files from being uploaded.
// 10 MB max file size (can be altered if requirement changes)

const uppy = new Uppy({
  restrictions: {
    allowedFileTypes: ['.tsv', '.csv'],
    minFileSize: 1,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },
})

// This defines the URLto upload to - currently set to a placeholder.
const { publicRuntimeConfig } = getConfig();
const url = publicRuntimeConfig.DCB_API_BASE + '/uploadMappingsPlaceholder'
// Using Uppy XHR plugin to manage the upload
uppy.use(XHR, { endpoint: url });


// Upload component
const UppyFileUpload = ({ onFileUpload }: any) => {
  const { t } = useTranslation();

  // This function (will) handle the actual upload and should create an error for each failure
  // File sizes are also translated to MB (to 2dp)

  const handleUpload = () => {
    uppy.upload().then((result) => {
      console.info('Successful uploads:', result.successful);
      if (result.failed.length > 0) {
          setError(true);
          setErrorMessage("File failed to upload, please retry.")
          result.failed.forEach((file) => {
              console.error("This file failed: ", file.name, "and it was of size: ", fileSizeConvertor(file.size), " MB, with error: ", file.error);
          });
      }
  });
  }
  // State management - mostly for the displaying of messages
  const [isError, setError] = useState(false);
  const [isSuccess, setSuccess] = useState(false);
  const [isAdded, setAdded] = useState(false);
  // const [isDisabled, setDisabled] = useState(true);

  // set different kinds of errors
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [addedFile, setAddedFile] = useState("");
  const [failedFile, setFailedFile] = useState({name: "", size: 0});


  // Uppy has events that we can listen for and act accordingly.
  // This is for when validation fails / file doesn't pass a restriction.
  uppy.on('restriction-failed', (file: any, error: any) => {
    console.log("Restriction for", file.name, "failed with", error)
    // We save the name and size of the failed file, as well as error data.
    setFailedFile({name: file.name, size: file.size});
    setError(true);
    setErrorMessage("Validation on "+ file.name+ " failed with "+ error)
    // Can set error conditionally if needs be - file size, file type etc
  });

  // This gets triggered when a file passes validation
  uppy.on('file-added', (file: any) => {
    setAdded(true);
    setAddedFile(file);
    setError(false);
    // can also supply size etc if we need to. Remove logging after QA.
    console.log("File is added?: "+isAdded);
  });

  // This is triggered whn the upload is successful.
  uppy.on('upload-success', (file: any, response: any) => {
    setSuccess(true);
    setSuccessMessage("Upload successful for "+file.name);
  })
  // This is triggered if there's an upload error
  uppy.on('error', (error) => {
    setError(true);
    setErrorMessage("File failed to upload, please retry."+ error);
  });

  // Maps all added files to display them as alerts.
  const acceptedFileItems = uppy.getFiles().map(file => (
    <li key={file.name} style={{ listStyleType: 'none' }}> 
      <Alert severityType="info" alertText={t("mappings.add_success", {fileName: file.name})} key={file.size}/>
   </li>
  ));

  // Used to conditionally render the UI depending on if accepted files exist (i.e. disabling buttons etc)
  const doFilesAcceptedExist = (uppy.getFiles().length > 0) ? true : false;

  // for testing - remove after QA
  console.log("Do accepted files exist? " + doFilesAcceptedExist);
  console.log(uppy.getFiles());

  return (
    <div>
        <DragDrop className="uppy-DragDrop--isDragDropSupported"
            uppy={uppy}
            note="Allowed file types: .tsv and .csv, Max file size: 50 MB"
        />
        <Button disabled={!doFilesAcceptedExist} onClick = {handleUpload} color="primary" variant="contained" fullWidth type="submit">
                  {t("general.submit")}            
        </Button>        
        {/* // Replace with a button that uploads the files instead using upload API
        // Change colour / disabled on zero accepted files ^^
        https://uppy.io/docs/uppy/#upload */}
        <ul>{acceptedFileItems}</ul>
        {errorMessage.includes("exceeds maximum allowed size") && (<Alert severityType="error" alertText={t("mappings.file_too_large", {fileName: failedFile.name, fileSize: fileSizeConvertor(failedFile.size), maxSize: 10})} key={"validation-upload-error-file-size"}/>)}
        {errorMessage.includes("This file is smaller than the allowed size") && (<Alert severityType="error" alertText={t("mappings.file_empty", {fileName: failedFile.name})} key={"validation-upload-error-file-empty"}/>)}
        {errorMessage.includes("Error: You can only upload") && (<Alert severityType="error" alertText={t("mappings.wrong_file_type", {fileName: failedFile.name, allowedFiles: ".csv, .tsv"})} key={"validation-upload-error-file-type"}/>) }
        {errorMessage.includes("Upload failed") && (<Alert severityType="error" alertText={t("mappings.upload_failed", {fileName: failedFile.name})} key={"validation-upload-error"}/>)}
        {isSuccess && (<Alert severityType="success" alertText={t("mappings.upload_failed", {fileName: addedFile})} key={"upload-successful"}/>)}
    </div>
  );
};


export default function Upload() {
  return (
    // Undefined is a placeholder until we have an actual endpoint available and can model upload behaviour accordingly.
    <UppyFileUpload onFileUpload={undefined}/>
  )
}