import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import fileDownload from "js-file-download";
import { IconButton, Tooltip, Typography } from "@mui/material";
import TablePaginate from "./TablePaginate";
import { useState, useEffect, useMemo, useRef } from "react";
import { Edit, Delete } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import toast from "react-hot-toast";
// import PaginationActionButton from "./PaginationActionButton";

export default function TableVehicle({ refresh, editData, deleteData }) {
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [rows, setRows] = useState({ data: [], count: 0 });
    const source = useRef("");
    const [paginate, setPaginate] = useState({
        pageIndex: 0,
        pageSize: 5,
    });

    // const { onPaginationChange, pagination, limit, skip } = usePagination();
    // const { sorting, onSortingChange, order, field } = useSorting();
    // const { filters, onColumnFilterChange } = useFilter();
    const columns = useMemo(
        () => [
            {
                header: "Plat Nomor",
                accessorKey: "vhcl_id",
                cell: props => props.getValue(),
            },
            {
                header: "File STNK",
                accessorKey: "foto_stnk",
                cell: props => {
                    return (
                        <a
                            onClick={async () => {
                                try {
                                    const { data } = await axiosPrivate.post(
                                        `/file/download`,
                                        {
                                            filename: props.getValue(),
                                            type: "stnk",
                                        }
                                    );
                                    fileDownload(data, props.getValue());
                                } catch (error) {
                                    toast.error(error.response.data.message);
                                    console.error(response.error.data.message);
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            {props.getValue()}
                        </a>
                    );
                },
            },
            {
                header: "Status",
                accessorKey: "is_send",
                cell: ({ row }) => {
                    if (row.original.is_send) {
                        return <p>Sudah Dikirim Email</p>;
                    } else {
                        return "";
                    }
                },
            },
            {
                id: "action",
                cell: ({ row }) => {
                    let buttons = [];
                    if (!row.original.is_send) {
                        buttons.push(
                            <Tooltip
                                key={row.id + "-edit"}
                                title={<Typography>Edit</Typography>}
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "primary.main",
                                        color: theme.palette.primary
                                            .contrastText,
                                        ":hover": {
                                            color: theme.palette.grey[800],
                                        },
                                        mx: 1,
                                    }}
                                    onClick={() => editData(row.original.id)}
                                >
                                    <Edit></Edit>
                                </IconButton>
                            </Tooltip>
                        );
                        buttons.push(
                            <Tooltip
                                key={row.id + "-delete"}
                                title={<Typography>Delete</Typography>}
                            >
                                <IconButton
                                    sx={{
                                        backgroundColor: "error.main",
                                        color: theme.palette.error.contrastText,
                                        ":hover": {
                                            color: theme.palette.grey[800],
                                        },
                                        mx: 1,
                                    }}
                                    onClick={() => deleteData(row.original.id)}
                                >
                                    <Delete></Delete>
                                </IconButton>
                            </Tooltip>
                        );
                    }
                    return buttons;
                },
            },
        ],
        []
    );

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get(
                    `/master/vhcl?limit=${paginate.pageSize}&offset=${paginate.pageIndex * paginate.pageSize}`
                );
                source.current = data.source;
                setRows(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [refresh, paginate.pageIndex]);

    // useEffect(() => {
    //     console.log(rows);
    // }, [rows]);

    return (
        <TablePaginate
            data={rows}
            columns={columns}
            paginate={paginate}
            setPaginate={setPaginate}
            sx={{
                flexGrow: 1,
                width: "100%",
                height: "60vh",
                boxSizing: "border-box",
            }}
        />
    );
}
