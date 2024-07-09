import React from "react";
import {
    DateField,
    DatePicker,
    LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

const DatePickerNoComp = ({ value, onChange, label, ...props }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
                label={label}
                value={value}
                onChange={onChange}
                {...props}
            />
        </LocalizationProvider>
    );
};

export default DatePickerNoComp;
