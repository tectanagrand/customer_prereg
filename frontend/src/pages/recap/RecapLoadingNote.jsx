import { Axios } from "../../api/axios";
import TableRecapReport from "../../component/table/TableRecapReport";
import { Button } from "@mui/material";
import { useState } from "react";
import { TableView } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

export default function RecapLoadingNote() {
    const theme = useTheme();
    const generateExcel = async () => {
        try {
            const response = await Axios.post("/ln/genxls", filterData, {
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

    const _setFilter = values => {
        setFilter(values);
    };
    return (
        <>
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
            <div
                style={{
                    display: "flex",
                    minWidth: "100%",
                    minHeight: "100%",
                    width: 0,
                    height: 0,
                }}
            >
                <TableRecapReport onsetFilterData={_setFilter} />
            </div>
        </>
    );
}
