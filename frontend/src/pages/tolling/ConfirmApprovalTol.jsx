import { Box } from "@mui/material";
import TableSelected from "../../component/table/TableSelected";
import { formatNumber } from "../../helper/formatting";
import { useMemo } from "react";

import React from "react";

export default function ConfirmApprovalTol({ rows }) {
    const columns = useMemo(() => [
        {
            header: "Batch Code",
            accessorKey: "batch_code",
            cell: props => props.getValue(),
        },
        {
            header: "STO Number",
            accessorKey: "id_sto",
            cell: props => props.getValue(),
        },
        {
            header: "Plant",
            accessorKey: "plant",
            cell: props => props.getValue(),
        },
        {
            header: "Material",
            accessorKey: "material",
            cell: props => props.getValue(),
        },
        {
            header: "Customer",
            accessorKey: "cust_code",
            cell: ({ row }) => {
                if (row.original.cust_code) {
                    return (
                        row.original.cust_code + " - " + row.original.cust_name
                    );
                } else if (row.original.intr_code) {
                    return (
                        row.original.intr_code + " - " + row.original.intr_name
                    );
                } else {
                    return (
                        row.original.ven_code + " - " + row.original.ven_name
                    );
                }
            },
        },
        {
            header: "Driver",
            accessorKey: "driver",
            cell: props => props.getValue(),
        },
        {
            header: "Vehicle",
            accessorKey: "vhcl_id",
            cell: props => props.getValue(),
        },
        {
            header: "Tanggal Pengambilan / Muat",
            accessorKey: "tanggal_surat_jalan",
            cell: props => props.getValue(),
        },
        {
            header: "Planned Qty",
            accessorKey: "plan_qty",
            cell: ({ row: { original } }) => {
                return formatNumber(original.plan_qty, original.uom);
            },
        },
        {
            header: "UOM",
            accessorKey: "uom",
            cell: props => props.getValue(),
        },
    ]);
    return (
        <Box
            sx={{
                width: "fit",
                height: "30rem",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                p: 2,
                mb: 3,
            }}
        >
            <h3>Selected Approval Tolling : </h3>
            <TableSelected
                rowsData={rows ?? []}
                columns={columns}
                sx={{ height: "20rem", maxWidth: "100%" }}
            />
        </Box>
    );
}
