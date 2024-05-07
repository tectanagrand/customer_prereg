import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import TableRecapReport from "../../component/table/TableRecapReport";
import { Button } from "@mui/material";
import { useState } from "react";
import { TableView, CloudSync } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";

export default function RecapLoadingNote() {
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(false);
    const generateExcel = async () => {
        try {
            const response = await axiosPrivate.post("/ln/genxls", filterData, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // Create a link element and simulate a click to trigger the download
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "ReportLoadingNote.xlsx");
            document.body.appendChild(link);
            link.click();

            // Cleanup
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        }
    };

    const [filterData, setFilter] = useState({});

    const syncWBData = async () => {
        try {
            setLoading(true);
            const { data } = await axiosPrivate.get("/ln/syncwb");
            toast.success(data.message);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const _setFilter = values => {
        setFilter(values);
    };
    return (
        <>
            <Toaster />
            <Button
                onClick={async () => {
                    await generateExcel();
                }}
                variant="contained"
                sx={{
                    minWidth: "12rem",
                    mb: 1,
                    color: theme.palette.success.contrastText,
                    backgroundColor: theme.palette.success.main,
                    ":hover": {
                        backgroundColor: theme.palette.success.light,
                    },
                }}
            >
                <TableView></TableView> Generate Excel
            </Button>
            <LoadingButton
                loading={loading}
                onClick={async () => {
                    await syncWBData();
                }}
                variant="contained"
                sx={{
                    minWidth: "12rem",
                    mb: 1,
                    ml: 1,
                    color: theme.palette.success.contrastText,
                    backgroundColor: theme.palette.success.main,
                    ":hover": {
                        backgroundColor: theme.palette.success.light,
                    },
                }}
            >
                <CloudSync></CloudSync> Sync WB Data
            </LoadingButton>
            <div
                style={{
                    display: "flex",
                    minWidth: "100%",
                    minHeight: "100%",
                    width: 0,
                    height: 0,
                }}
            >
                <TableRecapReport
                    onsetFilterData={_setFilter}
                    isLoading={loading}
                />
            </div>
        </>
    );
}
