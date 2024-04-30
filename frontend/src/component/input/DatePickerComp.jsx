import { DatePicker } from "@mui/x-date-pickers";
import moment from "moment";
import { Controller } from "react-hook-form";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

export default function DatePickerComp({
    name,
    label,
    control,
    rules,
    ...props
}) {
    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <Controller
                control={control}
                name={name}
                rules={rules}
                render={({
                    field: { onChange, value },
                    fieldState: { error },
                }) => (
                    <DatePicker
                        {...props}
                        onChange={onChange}
                        format="DD-MM-YYYY"
                        value={moment(value)}
                        label={label}
                        slotProps={{
                            textField: {
                                error: !!error,
                                helperText: error?.message,
                            },
                        }}
                    />
                )}
            ></Controller>
        </LocalizationProvider>
    );
}
