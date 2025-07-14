import { Autocomplete, TextField, IconButton, Box } from "@mui/material";
import { Close } from "@mui/icons-material";
import TableSimple from "../table/TableSimple";
import { Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import useFetchData from "../../hooks/useFetchData";

export default function AutoCompleteMultiSelectCust({
    name,
    control,
    label,
    sx,
    roleSelected,
    disabled,
}) {
    const [end_value, setEndValue] = useState([]);
    const { data: cust_data, loading: loading_cust } = useFetchData({
        initData: { data: [], count: 0 },
        url: "/master/cust",
    });
    const { data: ven_data, loading: loading_ven } = useFetchData({
        initData: { data: [], count: 0 },
        url: "/master/ven",
    });
    const custOp = useMemo(
        () =>
            cust_data.data.length > 0
                ? cust_data.data.map(value => ({
                      label: value.name,
                      value: value.kunnr,
                      ...value,
                  }))
                : [],
        [cust_data]
    );
    const venOp = useMemo(
        () =>
            ven_data.data.length > 0
                ? ven_data.data.map(value => ({
                      label: value.name,
                      value: value.lifnr,
                      ...value,
                  }))
                : [],
        [ven_data]
    );
    const [options, setOptions] = useState([]);
    const deleteValue = val => {
        const new_value = end_value.filter(value => value.value != val);
        setEndValue(new_value);
    };

    const columnTable = useMemo(
        () => [
            {
                header: "Customer Code",
                accessorKey: "code",
                cell: props => props.getValue(),
            },
            {
                header: "Name",
                accessorKey: "name_1",
                cell: props => props.getValue(),
            },
            {
                id: "action",
                cell: ({ row }) => {
                    return (
                        <>
                            <IconButton
                                onClick={() => {
                                    deleteValue(row.original.value);
                                }}
                            >
                                <Close />
                            </IconButton>
                        </>
                    );
                },
            },
        ],
        [roleSelected, end_value]
    );
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => {
                useEffect(() => {
                    onChange(end_value);
                }, [end_value]);
                return (
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            border: "solid",
                            borderWidth: "2px",
                            p: 2,
                            borderRadius: "6px",
                            gap: 2,
                        }}
                    >
                        <Autocomplete
                            disabled={disabled}
                            multiple
                            value={value}
                            options={
                                roleSelected == "LOG_KRANI" ? venOp : custOp
                            }
                            getOptionLabel={option => option.label}
                            renderInput={params => (
                                <TextField {...params} label={label} />
                            )}
                            limitTags={1}
                            sx={sx}
                            onChange={(event, newValue) => {
                                setEndValue(newValue);
                            }}
                            disableCloseOnSelect={true}
                            isOptionEqualToValue={(option, value) => {
                                return option.value === value.value;
                            }}
                        />
                        {!disabled && (
                            <TableSimple
                                sx={{ height: "20rem" }}
                                rowsData={value}
                                columns={columnTable}
                                active_search
                                stickyHeader
                            />
                        )}
                    </Box>
                );
            }}
        />
    );
}
