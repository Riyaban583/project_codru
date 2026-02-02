import React from "react";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createTheme, ThemeProvider, useTheme } from "@mui/material/styles";

// Create RTL cache
const cacheRtl = createCache({
  key: "pickers-rtl-demo",
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function FunDatePicker() {
  // Inherit the theme from the docs site (dark/light mode)
  const existingTheme = useTheme();

  const theme = React.useMemo(
    () => createTheme(existingTheme, { direction: "rtl" }),
    [existingTheme]
  );

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <div dir="rtl">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              sx={{
                width: "100%", // Set the custom width here
              }}
              slotProps={{
                desktopPaper: {
                  dir: "rtl",
                },
                mobilePaper: {
                  dir: "rtl",
                },
              }}
            />
          </LocalizationProvider>
        </div>
      </ThemeProvider>
    </CacheProvider>
  );
}