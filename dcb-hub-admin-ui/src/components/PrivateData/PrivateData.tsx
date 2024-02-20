import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { InputAdornment, InputLabel, Stack, Box, IconButton, Input, FormControl, styled, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";

interface PrivateDataProps {
    hiddenTextValue: string;
    clientConfigType: string;
    id: string;
  }

export default function PrivateData({hiddenTextValue, clientConfigType, id}: PrivateDataProps) {
  const { t } = useTranslation();
  const [showPrivateData, setShowPrivateData] = useState(false);

  const handleMouseDownPrivateData = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
        <Stack>
          <Box sx={{display: "flex", alignItems: "center", width: "100%"}}>
            <InputLabel htmlFor={id} sx={{color:'inherit', fontWeight: 'bold'}}>{clientConfigType}</InputLabel>
            <InputAdornment position="start">
              <IconButton
                aria-label={t('ui.toggle_visibility')}
                // may be replaced with custom tooltip component in the future
                title={t('ui.toggle_visibility')}
                onClick={() => setShowPrivateData((show) => !show)}
                onMouseDown={handleMouseDownPrivateData}
              >
                {showPrivateData ? <MdVisibilityOff /> : <MdVisibility />}
              </IconButton>
            </InputAdornment>
          </Box>
          <FormControl sx={{ width: "100%" }} variant="standard">
            {showPrivateData? (
              <Typography
                id={id}
                sx={{
                  wordBreak: 'break-word'
                }}
                aria-hidden={false}
              >
                {hiddenTextValue}
              </Typography>
            ) : (
              <Input
              // pass in a value for the id for each instance
              // this solves issues with duplicate ids
                id={id}
                type="password"
                defaultValue={hiddenTextValue}
                disableUnderline
                inputProps={{
                  readOnly: true,
                }}
                aria-hidden={true}
              />
            )}
            
          </FormControl>
        </Stack>
    </Box>
  );
}
