import { TextField } from "@mui/material";
import { useState } from "react";
import { debounce } from "lodash";

export function FilterTextFieldComp({ column }) {
    const [value, setValue] = useState("");

    const debouncedSetFilterValue = debounce(newValue => {
        column.setFilterValue(newValue);
    }, 500);

    return (
        <>
            <TextField
                placeholder={column.columnDef.header}
                onChange={e => {
                    setValue(e.target.value);
                    debouncedSetFilterValue(e.target.value);
                }}
                value={value}
            />
        </>
    );
}
