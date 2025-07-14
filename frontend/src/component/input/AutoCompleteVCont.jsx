import { Controller } from "react-hook-form";
import React from "react";
import AutoCompleteVirtDemo from "./AutoCompleteVirtDemo";
import { TextField } from "@mui/material";
import AutoCompleteVirtualize from "./AutoCompleteVirtualize";

const AutoCompleteVCont = ({ control, name, label, options, sx }) => (
    <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => {
            // Destructure field props properly, including ref
            const { onChange, value } = field;

            return (
                <AutoCompleteVirtualize
                    options={options}
                    onChange={(event, newValue) => {
                        // Pass the new value to react-hook-form's onChange
                        onChange(newValue);
                    }}
                    // Use the field value from react-hook-form
                    label={label}
                    value={value}
                    getOptionLabel={option => {
                        if (typeof option === "string") {
                            return option;
                        }
                        if (
                            option !== null &&
                            option !== undefined &&
                            option !== ""
                        )
                            return option.label;
                        if (option.inputValue) {
                            return option.inputValue;
                        }
                        return option.title;
                    }}
                    isOptionEqualToValue={(option, val) => {
                        let value = val?.value ?? val;
                        return option?.value === value;
                        // return true;
                    }}
                    sx={sx}
                />
            );
        }}
    />
);

export default AutoCompleteVCont;
