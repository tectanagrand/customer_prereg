import React from "react";
import { DateField, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";

const DateFieldComp = ({ value, onChange, label, ...props }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <DateField
                label={label}
                value={value}
                onChange={onChange}
                {...props}
            />
        </LocalizationProvider>
    );
};

export default DateFieldComp;
