import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { Controller } from "react-hook-form";

export default function AutocompleteComp({
    name,
    control,
    rules,
    options,
    label,
    freeSolo,
    ...props
}) {
    return (
        <>
            <Controller
                name={name}
                control={control}
                rules={rules}
                onChange={([, data]) => data}
                render={({
                    field: { onChange, value, ref },
                    fieldState: { error },
                }) => (
                    <Autocomplete
                        options={options}
                        onChange={(e, newValue) => {
                            // console.log(newValue);
                            if (freeSolo) {
                                if (typeof newValue === "object") {
                                    onChange(newValue);
                                } else {
                                    onChange(newValue);
                                }
                            } else {
                                onChange(newValue);
                            }
                        }}
                        value={value}
                        error={!!error}
                        freeSolo={freeSolo}
                        autoSelect={freeSolo}
                        fullWidth
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
                        isOptionEqualToValue={(option, value) => {
                            return true;
                        }}
                        renderInput={params => (
                            <TextField
                                {...params}
                                error={!!error}
                                helperText={!!error && error.message}
                                label={label}
                                inputRef={ref}
                            />
                        )}
                        {...props}
                    />
                )}
            />
        </>
    );
}
