import { Controller } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";

export default function NumericFieldComp({
    name,
    label,
    control,
    currency,
    format,
    rules,
    readOnly,
    disabled,
    thousandSeparator,
    ...props
}) {
    return (
        <>
            <Controller
                control={control}
                name={name}
                rules={rules}
                render={({
                    field: { onChange, value, ref },
                    fieldState: { error },
                }) => (
                    <NumericFormat
                        onChange={onChange}
                        value={value}
                        label={label}
                        thousandSeparator={thousandSeparator}
                        inputRef={ref}
                        customInput={TextField}
                        prefix={currency && `${currency} `}
                        error={!!error}
                        fullWidth
                        inputProps={{
                            readOnly: readOnly,
                            disabled: disabled,
                        }}
                        sx={props.sx}
                        InputProps={{
                            endAdornment: props.endAdornment,
                        }}
                        helperText={error?.message}
                    />
                )}
            />
        </>
    );
}
