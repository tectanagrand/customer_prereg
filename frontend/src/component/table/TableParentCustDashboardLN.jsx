import {
    flexRender,
    getCoreRowModel,
    useReactTable,
    getExpandedRowModel,
} from "@tanstack/react-table";
import {
    TableContainer,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Typography,
    Box,
    Button,
} from "@mui/material";
import {
    KeyboardArrowRight,
    KeyboardArrowDown,
    Edit,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { Axios } from "../../api/axios";
import toast, { Toaster } from "react-hot-toast";
import TableChildCustLN from "./TableChildCustLN";
import { useNavigate } from "react-router-dom";
import { Fragment } from "react";

export default function TableParentCustDashboard() {
    const [dataCust, setDataCust] = useState([]);
    const navigate = useNavigate();

    const buttonAction = async (action, data) => {
        if (action === "edit") {
            navigate(
                {
                    pathname: "./create",
                    search: `?idloadnote=${data.id}`,
                },
                {
                    state: {
                        page: "user",
                    },
                }
            );
        }
    };

    const buttonNewUser = () => {
        navigate("./create");
    };

    const columns = useMemo(
        () => [
            {
                id: "expand",
                cell: ({ row }) => {
                    return row.getCanExpand() ? (
                        <>
                            <IconButton
                                {...{ onClick: row.getToggleExpandedHandler() }}
                            >
                                {row.getIsExpanded() ? (
                                    <KeyboardArrowDown />
                                ) : (
                                    <KeyboardArrowRight />
                                )}
                            </IconButton>
                        </>
                    ) : (
                        ""
                    );
                },
            },
            {
                header: "DO Number",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "Contract Number",
                accessorKey: "con_num",
                cell: props => props.getValue(),
            },
            {
                header: "Contract Quantity",
                accessorKey: "con_qty",
                cell: props => props.getValue(),
            },
            {
                header: "Plant",
                accessorKey: "plant",
                cell: props => props.getValue(),
            },
            {
                header: "Company",
                accessorKey: "company",
                cell: props => props.getValue(),
            },
            {
                id: "action_but",
                cell: props => {
                    let buttons = [];
                    console.log(props);
                    buttons.push(
                        <Tooltip title={<Typography>Edit</Typography>}>
                            <IconButton
                                sx={{ backgroundColor: "primary.light", mx: 1 }}
                                onClick={() =>
                                    buttonAction("edit", {
                                        id: props.row.original.hd_id,
                                    })
                                }
                            >
                                <Edit></Edit>
                            </IconButton>
                        </Tooltip>
                    );
                    return buttons;
                },
            },
        ],
        []
    );

    const table = useReactTable({
        columns,
        data: dataCust,
        getRowCanExpand: () => true,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get("/ln/lnuser", {
                    withCredentials: true,
                });
                setDataCust(data);
            } catch (error) {
                console.error(error);
                toast.error(error.response.data.message);
            }
        })();
    }, []);

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                    sx={{ width: 200, heigth: 50, margin: 2 }}
                    variant="contained"
                    onClick={buttonNewUser}
                >
                    <Typography>Request New</Typography>
                </Button>
            </Box>
            <TableContainer sx={{ height: "60vh" }}>
                <Table stickyHeader>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        return (
                                            <TableCell
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div>
                                                        <div>
                                                            {flexRender(
                                                                header.column
                                                                    .columnDef
                                                                    .header,
                                                                header.getContext()
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.map(row => {
                            return (
                                <Fragment key={row.id}>
                                    <TableRow>
                                        {row.getVisibleCells().map(cell => {
                                            console.log(cell);
                                            return (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef
                                                            .cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                    {row.getIsExpanded() && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    row.getVisibleCells().length
                                                }
                                            >
                                                {
                                                    <TableChildCustLN
                                                        dataChild={
                                                            row.original
                                                                .sub_table
                                                        }
                                                    />
                                                }
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </Fragment>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}
