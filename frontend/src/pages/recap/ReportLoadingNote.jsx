import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";
import TableReportLN from "../../component/table/TableReportLN";

export default function RecapLoadingNote() {
    return (
        <>
            <Toaster />

            <TableReportLN />
        </>
    );
}
