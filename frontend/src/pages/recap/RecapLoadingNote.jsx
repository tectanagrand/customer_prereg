import TableRecapReport from "../../component/table/TableRecapReport";
import TablePrintMultiLoadingNote from "./TablePrintMultiLoadingNote";
import { Box, Tabs, Tab } from "@mui/material";
import { useState } from "react";

export default function RecapLoadingNote() {
    const [value, setValue] = useState("single");
    const handleChange = (e, newValue) => {
        setValue(newValue);
    };
    return (
        <Box
            sx={{
                width: "98%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <Box sx={{ display: "flex" }}>
                <Tabs value={value} onChange={handleChange}>
                    <Tab label="Single" value={"single"} />
                    <Tab label="Multi" value={"multi"} />
                </Tabs>
            </Box>
            {value == "single" && <TableRecapReport />}
            {value == "multi" && <TablePrintMultiLoadingNote />}
        </Box>
    );
}
