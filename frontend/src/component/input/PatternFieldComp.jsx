import { Controller } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { TextField, FormHelperText, FormControl } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

const HelperText = ({ message }) => {
    const theme = useTheme();
    const helperText = useMemo(() => {
        if (message !== undefined) {
            return message;
        }
        return "";
    }, [message]);
    return (
        <FormHelperText sx={{ color: theme.palette.error.main }}>
            {helperText}
        </FormHelperText>
    );
};

export default function PatternFieldComp({
    name,
    control,
    rules,
    label,
    format,
    onChangeovr,
    readOnly,
    isNumString,
    patternChar,
    ...props
}) {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth>
                    <PatternFormat
                        value={field.value}
                        format={format}
                        valueIsNumericString={isNumString}
                        onChange={e => {
                            if (onChangeovr !== undefined) {
                                onChangeovr(e.target.value);
                            }
                            field.onChange(e.target.value);
                        }}
                        label={label}
                        error={!!error}
                        inputRef={field.ref}
                        customInput={TextField}
                        patternChar={patternChar}
                        inputProps={{
                            readOnly: readOnly,
                        }}
                        fullWidth
                        {...props}
                    />
                    <HelperText message={error?.message} />
                </FormControl>
            )}
        />
    );
}
