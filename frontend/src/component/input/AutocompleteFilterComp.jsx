import { Autocomplete, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { debounce } from "lodash";
import { useMemo, useState } from "react";

const StyledTextfield = styled(TextField)(({ theme }) => ({
    "& .MuiOutlinedInput-root": {
        backgroundColor: theme.palette.grey[100],
        width: "10rem",
        height: "3rem",
        fontSize: "10pt",
    },
}));

export default function AutocompleteFilter({ column, ...props }) {
    const [value, setValue] = useState("");

    const uniqueValues = useMemo(() => {
        const data = Array.from(column.getFacetedUniqueValues().keys()).sort();
        if (data[0] === null) {
            return [];
        } else {
            return data;
        }
    }, [column.getFacetedUniqueValues()]);

    return (
        <>
            <Autocomplete
                options={uniqueValues.map(item => ({
                    value: item,
                    label: item,
                }))}
                value={value}
                onChange={(e, newValue) => {
                    setValue(newValue);
                    console.log(newValue);
                    column.setFilterValue(newValue ? newValue.value : "");
                }}
                renderInput={params => <StyledTextfield {...params} />}
            />
        </>
    );
}
