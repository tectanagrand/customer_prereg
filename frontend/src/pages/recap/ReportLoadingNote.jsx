import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";
import TableReportLN from "../../component/table/TableReportLN";

export default function RecapLoadingNote() {
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(false);

    const [filterData, setFilter] = useState({});

    const _setFilter = values => {
        setFilter(values);
    };
    return (
        <>
            <Toaster />

            <TableReportLN onsetFilterData={_setFilter} isLoading={loading} />
        </>
    );
}
