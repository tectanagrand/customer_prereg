import { Controller } from "react-hook-form";
import ReactInputMask from "react-input-mask";
import { TextField } from "@mui/material";

export default function PatternInputComp({
    name,
    label,
    control,
    mask,
    maskPlaceholder,
    formatChars,
    onChangeovr,
    rules,
    ...props
}) {
    return (
        <>
            <Controller
                name={name}
                control={control}
                rules={rules}
                render={({
                    field: { value, onChange, ref },
                    fieldState: { error },
                }) => (
                    <ReactInputMask
                        mask={mask}
                        value={value}
                        maskPlaceholder={maskPlaceholder}
                        onChange={e => {
                            if (onChangeovr) {
                                onChangeovr(e.target.value);
                            }
                            onChange(e);
                        }}
                        formatChars={formatChars}
                    >
                        {inputProps => (
                            <TextField
                                {...inputProps}
                                label={label}
                                inputRef={ref}
                                error={!!error}
                                {...props}
                            />
                        )}
                    </ReactInputMask>
                )}
            />
        </>
    );
}
