import { Checkbox, FormControlLabel } from "@mui/material";
import { Controller } from "react-hook-form";

export default function CheckBoxComp({
    control,
    name,
    label,
    index,
    onChangeOvr,
    ...props
}) {
    return (
        <>
            <Controller
                name={name}
                control={control}
                render={({ field, fieldState: { error } }) => (
                    <FormControlLabel
                        control={
                            <Checkbox
                                {...field}
                                checked={field.value}
                                onChange={e => {
                                    if (onChangeOvr) {
                                        onChangeOvr(index, e.target.checked);
                                    }
                                    field.onChange(e);
                                }}
                                {...props}
                            />
                        }
                        label={label}
                    />
                )}
            />
        </>
    );
}
