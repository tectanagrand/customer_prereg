import { useForm } from "react-hook-form";
import TableSelect from "../../component/table/TableSelect";
import { formatNumber } from "../../helper/formatting";

import React, { useEffect, useMemo, useState } from "react";
import useFetchData from "../../hooks/useFetchData";
import RefreshButton from "../../component/common/RefreshButton";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    TextField,
    Tooltip,
    Dialog,
    DialogActions,
    DialogTitle,
} from "@mui/material";
import { Park } from "@mui/icons-material";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import { LoadingButton } from "@mui/lab";
import { createColumnHelper } from "@tanstack/react-table";
import moment from "moment/moment";
import { debounce, values } from "lodash";
import DialogFormConfirmation from "../../component/common/DialogFormConfirmation";
import TableSelected from "../../component/table/TableSelected";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { useSession } from "../../provider/sessionProvider";
import ModalSyncZWBPark from "../recap/ModalSyncZWBPark";
const columnHelper = createColumnHelper();

const DialogConfirPost = ({ selected }) => {
    const columns = useMemo(() => {
        return [
            columnHelper.accessor("cust_code", {
                header: "Customer",
                cell: ({ row }) => {
                    return `${row.original.cust_name} (${row.original.cust_code})`;
                },
            }),
            columnHelper.accessor("ln_num", {
                header: "Loading Note Num.",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("driver_name", {
                header: "Driver",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("vhcl_id", {
                header: "Plate Num.",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("tanggal_surat_jalan", {
                header: "Loading Date",
                cell: ({ getValue }) => {
                    const value = getValue();
                    return moment(value).format("YYYY-MM-DD");
                },
            }),
            columnHelper.accessor("plan_qty", {
                header: "Planning Quantity",
                cell: ({ getValue }) => {
                    return formatNumber(getValue(), "");
                },
            }),
            columnHelper.accessor("uom", {
                header: "UOM",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("desc_con", {
                header: "Material",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("start_from", {
                header: "Start From",
                cell: ({ getValue }) => getValue(),
            }),
        ];
    }, []);
    return (
        <Box>
            <TableSelected columns={columns} rowsData={selected} />
        </Box>
    );
};

export default function SinglePostZWB() {
    const axiosPrivate = useAxiosPrivate();
    const { session } = useSession();
    const [modalSync, setModalSync] = useState(false);
    const [modalAuth, setModalAuth] = useState(false);
    const [openConfir, setOpenConfir] = useState(false);
    const [selected, setSelect] = useState([]);
    const [cust_val, setCustVal] = useState(null);
    const [loadingPush, setLoadingPush] = useState(false);
    const [whereval, setWhereval] = useState("");
    const {
        handleSubmit,
        register,
        formState: { errors },
        getValues,
        setValue,
    } = useForm({
        defaultValues: {
            selected: [],
        },
    });

    const {
        control: controlAuth,
        handleSubmit: handleAuth,
        getValues: authValue,
        reset: resetAuth,
    } = useForm({
        defaultValues: {
            password: "",
        },
    });

    const { data, loading, error, refreshData } = useFetchData({
        url: whereval,
        initData: { data: [] },
    });
    const { data: list_cust_dt } = useFetchData({
        url: `/postzwb/cust`,
        initData: {
            data: [],
        },
    });
    const list_cust = useMemo(() => {
        return list_cust_dt.data.map(val => ({
            value: val.cust_code,
            label: `${val.cust_name} (${val.cust_code})`,
        }));
    }, [list_cust_dt]);

    const submitPostZWBPark = async () => {
        const value = getValues();
        try {
            setLoadingPush(true);
            const { data } = await axiosPrivate.post("/postzwb/post", {
                loading_notes: value.selected.map(item => ({
                    ln_num: item.ln_num,
                    is_multi: item.ln_type == "multi" ? true : false,
                    start_from: item.start_from,
                })),
                ...authValue(),
            });
            console.log(data);
            setOpenConfir(false);
            setModalAuth(false);
            setSelect([]);
            refreshData();
            toast.success("Success Posted");
        } catch (error) {
            if (
                [
                    "Provide password",
                    "SAP Credential Not Valid",
                    "Session Expired",
                ].includes(error.response?.data.message)
            ) {
                setModalAuth(true);
            }
            if (error.response) {
                toast.error(error.response.data.message);
            }
            console.error(error);
        } finally {
            setLoadingPush(false);
        }
    };

    const changeFetchUrl = debounce(() => {
        setWhereval(
            `/postzwb/${cust_val?.value ? `?cust_code=${cust_val?.value}` : ""}`
        );
        refreshData();
    }, 500);
    useEffect(() => {
        changeFetchUrl();
    }, [cust_val]);

    useEffect(() => {
        setValue("selected", selected);
    }, [selected]);

    const columns = [
        columnHelper.accessor("cust_code", {
            header: "Customer",
            cell: ({ row }) => {
                return `${row.original.cust_name} (${row.original.cust_code})`;
            },
        }),
        columnHelper.accessor("ln_num", {
            header: "Loading Note Num.",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("wb_ticket", {
            header: "WB Ticket",
            cell: ({ row }) => {
                const data = row.original;
                if (!data.wb_ticket) {
                    return (
                        <Chip
                            color={"error"}
                            variant="outlined"
                            label={"WB Ticket Not Synced"}
                        />
                    );
                }
                return data.wb_ticket;
            },
        }),
        columnHelper.accessor("driver_name", {
            header: "Driver",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("vhcl_id", {
            header: "Plate Num.",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("tanggal_surat_jalan", {
            header: "Loading Date",
            cell: ({ getValue }) => {
                const value = getValue();
                return moment(value).format("YYYY-MM-DD");
            },
        }),
        columnHelper.accessor("plan_qty", {
            header: "Planning Quantity",
            cell: ({ getValue }) => {
                return formatNumber(getValue(), "");
            },
        }),
        columnHelper.accessor("uom", {
            header: "UOM",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("desc_con", {
            header: "Material",
            cell: ({ getValue }) => getValue(),
        }),
        columnHelper.accessor("zwbs_trx_stat", {
            header: "Status ZWBS_TRX",
            cell: ({ getValue, row }) => {
                const value = getValue();
                const desc = row.original?.zwbs_trx_desc ?? "No Desc";
                let status = "";
                let color = "secondary";
                switch (value) {
                    case "0":
                        status = "Staged";
                        color = "primary";
                        break;
                    case "1":
                        status = "Success";
                        color = "success";
                        break;
                    case "2":
                        status = "Failed";
                        color = "error";
                        break;
                    default:
                        status = "Not Push";
                }
                return (
                    <Tooltip
                        title={
                            <Box sx={{ p: 2 }}>
                                <p>Cause :</p>
                                <p>{desc}</p>
                            </Box>
                        }
                        disableHoverListener={status != "Failed" ? true : false}
                    >
                        <Chip color={color} variant="outlined" label={status} />
                    </Tooltip>
                );
            },
        }),
        columnHelper.accessor("zwb_park_stat", {
            header: "Status ZWB_PARK",
            cell: ({ getValue, row }) => {
                const value = getValue();
                const desc = row.original?.zwb_park_desc ?? "No Desc";
                let status = "";
                let color = "secondary";
                switch (value) {
                    case "0":
                        status = "Staged";
                        color = "primary";
                        break;
                    case "1":
                        status = "Success";
                        color = "success";
                        break;
                    case "2":
                        status = "Failed";
                        color = "error";
                        break;
                    default:
                        status = "NA";
                }
                return (
                    <Tooltip
                        title={
                            <Box sx={{ p: 2 }}>
                                <p>Cause :</p>
                                <p>{desc}</p>
                            </Box>
                        }
                        disableHoverListener={status != "Failed" ? true : false}
                    >
                        <Chip color={color} variant="outlined" label={status} />
                    </Tooltip>
                );
            },
        }),
        columnHelper.accessor("zdo_trx_dopo_stat", {
            header: "Status ZDO_TRX_DOPO",
            cell: ({ getValue, row }) => {
                const value = getValue();
                const desc = row.original?.zdo_trx_dopo_desc ?? "No Desc";
                let status = "";
                let color = "secondary";
                switch (value) {
                    case "0":
                        status = "Staged";
                        color = "primary";
                        break;
                    case "1":
                        status = "Success";
                        color = "success";
                        break;
                    case "2":
                        status = "Failed";
                        color = "error";
                        break;
                    default:
                        status = "NA";
                }
                return (
                    <Tooltip
                        title={
                            <Box sx={{ p: 2 }}>
                                <p>Cause :</p>
                                <p>{desc}</p>
                            </Box>
                        }
                        disableHoverListener={status != "Failed" ? true : false}
                    >
                        <Chip color={color} variant="outlined" label={status} />
                    </Tooltip>
                );
            },
        }),
        columnHelper.accessor("zdo_trx_pgip_stat", {
            header: "Status ZDO_TRX_PGIP",
            cell: ({ getValue, row }) => {
                const value = getValue();
                const desc = row.original?.zdo_trx_pgip_desc ?? "No Desc";
                let status = "";
                let color = "secondary";
                switch (value) {
                    case "0":
                        status = "Staged";
                        color = "primary";
                        break;
                    case "1":
                        status = "Success";
                        color = "success";
                        break;
                    case "2":
                        status = "Failed";
                        color = "error";
                        break;
                    default:
                        status = "NA";
                }
                return (
                    <Tooltip
                        title={
                            <Box sx={{ p: 2 }}>
                                <p>Cause :</p>
                                <p>{desc}</p>
                            </Box>
                        }
                        disableHoverListener={status != "Failed" ? true : false}
                    >
                        <Chip color={color} variant="outlined" label={status} />
                    </Tooltip>
                );
            },
        }),
    ];
    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
            }}
        >
            <Box sx={{ display: "flex", gap: 2 }}>
                <Autocomplete
                    sx={{ width: "30rem" }}
                    value={cust_val}
                    options={list_cust}
                    onChange={(e, newValue) => {
                        setCustVal(newValue);
                    }}
                    renderInput={params => (
                        <TextField label="Customer" {...params} />
                    )}
                />
                <RefreshButton
                    setRefreshbtn={() => {
                        refreshData();
                    }}
                    isLoading={loading}
                />
                <Tooltip title="Sync ZWBPARK">
                    <Button
                        onClick={() => {
                            setModalSync(true);
                        }}
                        variant="outlined"
                        sx={{
                            maxWidth: "1rem",
                            mb: 1,
                        }}
                    >
                        <Park sx={{ width: "1rem" }}></Park>
                    </Button>
                </Tooltip>
            </Box>
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                }}
            >
                <input
                    hidden
                    {...register("selected", {
                        required: "Please select at least a row",
                    })}
                />
                {errors.selected && (
                    <Alert severity="error">{errors.selected.message}</Alert>
                )}
                <TableSelect
                    data={data.data}
                    columns={columns}
                    setSelected={setSelect}
                    refresh={loading}
                    notselect={row => {
                        return row.wb_ticket;
                    }}
                />
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <Button
                        sx={{ width: "5rem" }}
                        variant="outlined"
                        onClick={handleSubmit(() => {
                            setOpenConfir(true);
                        })}
                    >
                        Submit
                    </Button>
                </Box>
            </Box>
            <DialogFormConfirmation
                Title={<h3>Confirm Post ZWB Park</h3>}
                open={openConfir}
                values={getValues()}
                onYes={submitPostZWBPark}
                onNo={() => {
                    setOpenConfir(false);
                }}
                Content={<DialogConfirPost selected={selected} />}
            />
            {/* Dialog Auth SAP */}
            <Dialog open={modalAuth} maxWidth="m">
                <DialogTitle>Authorize SAP Credentials</DialogTitle>

                <form onSubmit={handleAuth(submitPostZWBPark)}>
                    <Box
                        sx={{
                            width: "40rem",
                            height: "15rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            p: 2,
                            mb: 3,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "3rem",
                                paddingLeft: "1rem",
                            }}
                        >
                            <div>
                                <div>
                                    <Alert
                                        variant="filled"
                                        severity="warning"
                                        sx={{ width: "96%" }}
                                    >
                                        <strong>
                                            Currently you're not authorized to
                                            push data to SAP, please insert
                                            registered SAP Password according to
                                            username displayed
                                        </strong>{" "}
                                    </Alert>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                        margin: "1rem 0 0 0",
                                    }}
                                >
                                    <strong>Username :</strong>{" "}
                                    <em>
                                        <strong>{session.username}</strong>
                                    </em>
                                </div>
                            </div>
                        </div>
                        <PasswordWithEyes
                            control={controlAuth}
                            label="SAP Password"
                            name="password"
                            rules={{ required: "Please insert this field" }}
                        />
                    </Box>
                    <DialogActions>
                        <LoadingButton
                            type="submit"
                            color="primary"
                            variant="contained"
                            loading={loadingPush}
                        >
                            Continue
                        </LoadingButton>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => setModalAuth(false)}
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            <ModalSyncZWBPark
                is_open={modalSync}
                setOpen={setModalSync}
                refreshTable={refreshData}
            />
        </Box>
    );
}
