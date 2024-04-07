import { useEffect, useRef, useCallback } from "react";
import { Checkbox } from "@mui/material";

export default function CheckUserPermission({
    value,
    index,
    columnId,
    row,
    table,
    onChange,
    getValue,
}) {
    const handleCheckChange = useCallback(() => {
        table.options.meta.checkedUserPermission(index, columnId, value, row);
    }, [index, columnId, row, table.options.meta, value]);
    // ref.current.checked = false;
    useEffect(() => {
        console.log("value changed");
    }, [value]);
    useEffect(() => {
        handleCheckChange();
    }, [getValue]);
    return (
        <>
            <Checkbox onChange={() => onChange()} checked={value} />
        </>
    );
}
