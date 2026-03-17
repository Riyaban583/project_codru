import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { CalendarToday } from "@mui/icons-material";

interface FunDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

export default function FunDatePicker({ value, onChange }: FunDatePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          onChange(newValue ? newValue.toISOString() : null);
        }}
        slots={{
          openPickerIcon: CalendarToday,
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            label: "Date of Birth", // 🚨 CHANGED from placeholder to label to make it float!
            sx: {
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "white",
              },
            },
          },
          inputAdornment: {
            position: "start",
            // This line styles the icon wrapper with your brand blue!
            className: "text-brand-blue", 
          },
          openPickerIcon: {
            // We ensure the icon itself uses your specific blue shade
            className: "text-brand-blue", 
          }
        }}
      />
    </LocalizationProvider>
  );
}