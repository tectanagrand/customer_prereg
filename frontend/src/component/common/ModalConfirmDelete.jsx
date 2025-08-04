import React from "react";
import {
    Dialog,
    DialogTitle,
    Box,
    Typography,
    DialogActions,
    DialogContent,
    Button,
} from "@mui/material";
import TableSimple from "../table/TableSimple";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";

const ModalConfirmDelete = ({
    dataDeleteLN,
    deleteAction,
    open,
    setOpen,
    setRefresh,
    ...props
}) => {
    const [isLoading, setLoading] = useState(false);
    const delAction = async id => {
        setLoading(true);
        try {
            await deleteAction(id);
            setRefresh(true);
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: "Tanggal Request",
            accessorKey: "cre_date",
            cell: props => props.getValue(),
        },
        {
            header: "Tanggal Pengambilan / Muat",
            accessorKey: "tanggal_surat_jalan",
            cell: props => props.getValue(),
        },
        {
            header: "Driver",
            cell: ({ row }) =>
                row.original.driver_id + " - " + row.original.driver_name,
        },
        {
            header: "Vehicle",
            cell: ({ row }) => row.original.vhcl_id,
        },
        {
            header: "Contract Quantity",
            accessorKey: "plan_qty",
            cell: ({ row }) =>
                `${row.original.plan_qty?.replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ","
                )} ${row.original.uom}`,
        },
    ];
    return (
        <Dialog
            open={open}
            onClose={() => {
                setOpen(false);
            }}
            maxWidth="xl"
        >
            <DialogTitle>Cancel Loading Note</DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        p: 2,
                        mb: 3,
                    }}
                >
                    <Typography variant="h4">
                        Are you sure want to delete ?
                    </Typography>
                    <TableSimple
                        rowsData={dataDeleteLN}
                        sx={{ height: "15rem" }}
                        columns={columns}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setOpen(false);
                    }}
                >
                    Close
                </Button>
                <LoadingButton
                    color="error"
                    variant="contained"
                    loading={isLoading}
                    onClick={() => delAction(props.id)}
                >
                    Delete
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default ModalConfirmDelete;
