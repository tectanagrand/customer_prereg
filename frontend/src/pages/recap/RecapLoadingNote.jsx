import TableRecapReport from "../../component/table/TableRecapReport";
import { Box } from "@mui/material";

export default function RecapLoadingNote() {
    return (
        <Box
            sx={{
                width: "98%",
                height: "100%",
            }}
        >
            <TableRecapReport />
        </Box>
    );
}
