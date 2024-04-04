import { TextField } from "@mui/material";
import { Controller } from "react-hook-form";

export const TextFieldComp = ({
    control,
    label,
    name,
    rules,
    valueovr,
    readOnly,
    onChangeovr,
    toUpperCase,
    toLowerCase,
    sx,
    endAdornment,
    thousandSeparator,
    ...props
}) => {
    return (
        <>
            <Controller
                name={name}
                control={control}
                rules={rules}
                defaultValue={valueovr}
                render={({
                    field: { onChange, value, ref },
                    fieldState: { error },
                }) => (
                    <TextField
                        helperText={error ? error.message : null}
                        error={!!error}
                        onChange={e => {
                            if (toUpperCase) {
                                onChange(e.target.value.toUpperCase());
                            } else if (toLowerCase) {
                                onChange(e.target.value.toLowerCase());
                            } else {
                                onChange(e);
                            }
                        }}
                        onBlur={e => {
                            if (onChangeovr !== undefined) {
                                onChangeovr(e.target.value);
                            }
                        }}
                        inputRef={ref}
                        value={value}
                        label={label}
                        sx={{ ...sx }}
                        {...props}
                        variant="outlined"
                        inputProps={{
                            readOnly: readOnly,
                            disabled: props?.disabled,
                        }}
                        InputProps={{
                            endAdornment: endAdornment,
                        }}
                        fullWidth
                    />
                )}
            />
        </>
    );
};
