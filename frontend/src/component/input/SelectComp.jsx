import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    FormHelperText,
} from "@mui/material";
import { Controller } from "react-hook-form";

export default function SelectComp({
    name,
    control,
    label,
    options,
    onChangeovr,
    rules,
    disabled,
    readOnly,
    valueovr,
    onOpen,
    lazy,
    ...props
}) {
    const generateSingleOptions = () => {
        if (lazy) {
            let optionses = options.map(item => {
                return (
                    <MenuItem key={item.value} value={item.value}>
                        {item.label}
                    </MenuItem>
                );
            });
            if (props.isLoading) {
                optionses.unshift(
                    <MenuItem key="loading" value="">
                        Loading...
                    </MenuItem>
                );
            }
            return optionses;
        } else {
            return options.map(item => {
                return (
                    <MenuItem key={item.value} value={item.value}>
                        {item.label}
                    </MenuItem>
                );
            });
        }
    };
    return (
        <FormControl {...props} disabled={disabled}>
            <Controller
                render={({
                    field: { onChange, value, ref },
                    fieldState: { error },
                }) => {
                    if (disabled) {
                        value = "";
                    }
                    return (
                        <>
                            <InputLabel error={!!error}>{label}</InputLabel>
                            <Select
                                {...props}
                                error={!!error}
                                label={label}
                                value={value}
                                inputRef={ref}
                                inputProps={{
                                    readOnly: readOnly,
                                    disabled: disabled,
                                }}
                                onChange={e => {
                                    onChange(e);
                                    if (onChangeovr != undefined) {
                                        onChangeovr(e.target.value);
                                    }
                                }}
                                onOpen={onOpen}
                            >
                                {generateSingleOptions()}
                            </Select>
                            <FormHelperText error={!!error}>
                                {error?.message}
                            </FormHelperText>
                        </>
                    );
                }}
                control={control}
                name={name}
                rules={rules}
                defaultValue={valueovr}
            />
        </FormControl>
    );
}
