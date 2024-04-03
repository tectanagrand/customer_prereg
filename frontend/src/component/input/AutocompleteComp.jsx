import { TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import { Controller } from "react-hook-form";

export default function AutocompleteComp({
    name,
    control,
    rules,
    options,
    label,
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
                        onChange={(e, newValue) => onChange(newValue)}
                        value={value}
                        error={!!error}
                        fullWidth
                        getOptionLabel={option => {
                            if (
                                option !== null &&
                                option !== undefined &&
                                option !== ""
                            )
                                return option.label;
                            return "";
                        }}
                        isOptionEqualToValue={(option, value) => {
                            return true;
                        }}
                        renderInput={params => (
                            <TextField
                                {...params}
                                error={error}
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
