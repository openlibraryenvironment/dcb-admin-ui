import { Typography } from "@mui/material";
import { useDropzone } from 'react-dropzone';
import { useMemo } from "react";
import Alert from "@components/Alert/Alert";
import { fileSizeConvertor } from "src/helpers/fileSizeConverter";
import { useTranslation } from 'next-i18next';

type FileType = {
  size: number;
  name: string;
};
  
const maxSize = 20*1024*1024;
// 20 MB in bytes

const baseStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '20px',
    borderWidth: 2,
    borderRadius: 2,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    outline: 'none',
    transition: 'border .24s ease-in-out'
};
  
const focusedStyle = {
    borderColor: '#1769aa',
};
  
const acceptStyle = {
    borderColor: '#357a38',
};
  
const rejectStyle = {
    borderColor: '#aa2e25',
};
// see if this can be folded into the theme in future - doesn't happen automatically with non-MUI components

function fileSizeValidator(file: FileType) {
    if (file.size > maxSize) {
      return {
        code: "file-too-large",
        message: `File is larger than ${fileSizeConvertor(maxSize)}` 
      };
    }
  return null
}
  
function StyledDropzone(props: any) {
    const {
      getRootProps,
      getInputProps,
      isFocused,
      isDragAccept,
      isDragReject,
      fileRejections,
      acceptedFiles
    } = useDropzone({accept: {"text/csv": [".csv", ".tsv"]
        }, validator: fileSizeValidator});

    // See here for more on validation and how this works:
    // https://react-dropzone.js.org/#section-accepting-specific-file-types

    const style = useMemo(() => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {})
    }), [
      isFocused,
      isDragAccept,
      isDragReject
    ]);
    const { t } = useTranslation();

    // These two contain the rejected / accepted files and create alerts accordingly

    const fileRejectionItems = fileRejections.map(({ file, errors }) => (
      <li key={file.name} style={{ listStyleType: 'none' }}> 
          {errors.map(e => (
            <Alert severityType="error" alertText={e.message} key={e.code}/>
          ))}
      </li>
    ));

    const acceptedFileItems = acceptedFiles.map(file => (
      <li key={file.name} style={{ listStyleType: 'none' }}> 
        <Alert severityType="success" alertText={t("mappings.add_success", {fileName: file.name})} key={file.size}/>
     </li>
    ));

    return (
          <div className="container">
            <div {...getRootProps({style})}>
              <input {...getInputProps()} />
              <Typography variant="h6" color="black">{t("mappings.drag_n_drop", "Drag and drop or click to select a file.")} </Typography>
              <Typography variant = "body1" display="block" color="black"> 
                {t("mappings.suggested_formats", "Suggested formats: CSV, TSV")}
              </Typography>
              <Typography variant = "body1" display="block" color="black"> 
                {t("mappings.max_size", "Maximum size 100 MB")}
              </Typography>
            </div>
            <ul>{fileRejectionItems}</ul>
            <ul>{acceptedFileItems}</ul>
          </div>
        );
}

export default function Upload() {
  return (
    <StyledDropzone />
  )
}