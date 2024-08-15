import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import TableRecapReport from "../../component/table/TableRecapReport";
import { Box, Button } from "@mui/material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import toast, { Toaster } from "react-hot-toast";

export default function RecapLoadingNote() {
    return (
        <Box
            sx={{
                width: "98%",
                height: "100%",
            }}
        >
            <Toaster />
            <TableRecapReport />
        </Box>
    );
}
