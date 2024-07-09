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
        // console.log(data);
        if (data[0] === null) {
            return [];
        } else {
            return data;
        }
    }, [column.getFacetedUniqueValues()]);

    return (
        <>
            <Autocomplete
                options={uniqueValues.map(item => {
                    if (item !== null) {
                        return { value: item, label: item };
                    } else {
                        return { value: "", label: "" };
                    }
                })}
                value={value}
                onChange={(e, newValue) => {
                    setValue(newValue);
                    column.setFilterValue(newValue ? newValue.value : "");
                }}
                isOptionEqualToValue={(value, label) => true}
                renderInput={params => <StyledTextfield {...params} />}
                {...props}
            />
        </>
    );
}
