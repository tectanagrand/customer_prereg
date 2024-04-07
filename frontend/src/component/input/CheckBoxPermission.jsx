import { Checkbox } from "@mui/material";
import { useRef, useEffect } from "react";

export default function CheckBoxPermission({ indeterminate, ...props }) {
    const ref = useRef(null);
    useEffect(() => {
        if (typeof indeterminate === "boolean") {
            ref.current.indeterminate = !props.checked && indeterminate;
        }
    }, [ref, indeterminate]);

    return <Checkbox {...props} ref={ref} />;
}
