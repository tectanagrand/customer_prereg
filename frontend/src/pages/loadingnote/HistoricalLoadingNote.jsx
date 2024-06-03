import TablePaginate from "../../component/table/TablePaginate";
import { useEffect, useState, useMemo } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import moment from "moment";
import { useTheme } from "@mui/material/styles";
import { Box, TextField } from "@mui/material";
import { debounce } from "lodash";

const HistoricalLoadingNote = () => {
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [query, setQuery] = useState("");
    const [value, setValue] = useState("");
    const [dateRange, setDateRange] = useState({
        start: "",
        end: "",
    });
    const changeQuery = debounce(newValue => {
        setQuery(newValue);
    }, 300);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 7,
    });
    const column = useMemo(
        () => [
            {
                header: "SO Num.",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "Plant",
                accessorKey: "plant",
                cell: props => props.getValue(),
            },
            {
                header: "Inco.",
                accessorKey: "inco_1",
                cell: props => props.getValue(),
            },
            {
                header: "Tgl Surat Jalan",
                accessorKey: "tanggal_surat_jalan",
                cell: props => moment(props.getValue()).format("DD-MM-YYYY"),
            },
            {
                header: "Driver",
                cell: ({ row }) => {
                    return `${row.original.driver_name} (${row.original.driver_id})`;
                },
            },
            {
                header: "Vehicle",
                accessorKey: "vhcl_id",
                cell: ({ getValue }) => getValue(),
            },
            {
                header: "Media TP",
                accessorKey: "media_tp",
                cell: ({ getValue }) => getValue(),
            },
            {
                header: "Planning Qty",
                accessorKey: "plan_qty",
                cell: ({ row }) =>
                    `${row.original.plan_qty?.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                    )} ${row.original.uom}`,
            },
            {
                header: "Fac. Plant",
                accessorKey: "fac_plant",
                cell: props => props.getValue(),
            },
            {
                header: "Oth. Plant",
                accessorKey: "oth_plant",
                cell: props => props.getValue(),
            },
            {
                header: "Fac. Batch",
                accessorKey: "fac_batch",
                cell: props => props.getValue(),
            },
            {
                header: "Oth. Batch",
                accessorKey: "fac_batch",
                cell: props => props.getValue(),
            },
            {
                header: "Fac. Val. Type",
                accessorKey: "fac_valtype",
                cell: props => props.getValue(),
            },
            {
                header: "Oth. Val. Type",
                accessorKey: "oth_valtype",
                cell: props => props.getValue(),
            },
            {
                header: "Status",
                accessorKey: "is_active",
                cell: ({ getValue }) => {
                    return (
                        <div
                            style={{
                                background: getValue()
                                    ? theme.palette.primary.main
                                    : theme.palette.error.main,
                                borderRadius: "12px",
                                width: "fit-content",
                                padding: "0.5rem 0.5rem 0.5rem 0.5rem",
                                color: "white",
                            }}
                        >
                            {getValue() ? "Active" : "Inactive"}
                        </div>
                    );
                },
            },
        ],
        []
    );
    const [histori, setHistori] = useState({ data: [], count: 0 });

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get(
                    `/ln/history?q=${query}&limit=${pagination.pageSize}&offset=${pagination.pageSize * pagination.pageIndex}&start=${dateRange.start}&end=${dateRange.end}`
                );
                setHistori(data);
            } catch (error) {
                toast.error(error.response.data.message);
            }
        })();
    }, [query, dateRange, pagination.pageIndex]);

    return (
        <Box
            sx={{
                maxHeight: "60%",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                gap: 1,
            }}
        >
            <h2 style={{ margin: "0 0 0 0" }}>
                Historical Loading Note Request
            </h2>
            <TextField
                variant="filled"
                value={value}
                onChange={e => {
                    setValue(e.target.value);
                    changeQuery(e.target.value ?? "");
                }}
                label="Search..."
                sx={{ width: "30rem" }}
            />
            <TablePaginate
                data={histori}
                columns={column}
                paginate={pagination}
                setPaginate={setPagination}
                sx={{
                    height: "34rem",
                    maxWidth: "98%",
                    overflowX: "scroll",
                }}
            />
        </Box>
    );
};

export default HistoricalLoadingNote;
