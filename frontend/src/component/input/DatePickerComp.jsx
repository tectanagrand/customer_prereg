import { DatePicker } from "@mui/x-date-pickers";
import moment from "moment";
import { Controller } from "react-hook-form";

export default function DatePickerComp({
    name,
    label,
    control,
    rules,
    ...props
}) {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <DatePicker
                    {...props}
                    onChange={onChange}
                    format="MM-DD-YYYY"
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
    );
}
