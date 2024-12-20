import TableSpanPin from "../../component/table/TableSpanPin";
import SkeletonTable from "../../component/common/SkeletonTable";
import { CheckBoxTable } from "../../component/input/CheckBoxTable";
import { useEffect, useMemo, useRef, useState } from "react";
import useFetchData from "../../hooks/useFetchData";
import { createColumnHelper } from "@tanstack/react-table";
import moment from "moment/moment";
import {
    checkboxClasses,
    Box,
    Alert,
    Dialog,
    DialogActions,
    DialogTitle,
    Button,
} from "@mui/material";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import { useSession } from "../../provider/sessionProvider";
import { useTheme } from "@mui/material/styles";
import RefreshButton from "../../component/common/RefreshButton";
import { formatNumber } from "../../helper/formatting";
import { useForm } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import toast from "react-hot-toast";
import DialogFormConfirmation from "../../component/common/DialogFormConfirmation";
import { axiosPrivate } from "../../api/axios";

const columnHelper = createColumnHelper();

export default function PushSAPMulti() {
    const theme = useTheme();
    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            selected: [],
        },
    });
    const [selectedRow, setSelectedRow] = useState({});
    const [groupedRow, setGrouped] = useState(new Map());
    const [selGrpRow, setSelGrp] = useState([]);
    // console.log(selectedRow);
    const [refresh, setRefresh] = useState(true);
    const [q, setQ] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const columns = useMemo(
        () => [
            columnHelper.accessor("hd_id", {
                header: ({ table }) => (
                    <CheckBoxTable
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler(),
                            sx: {
                                [`&, &.${checkboxClasses.checked}`]: {
                                    color: theme.palette.grey[100],
                                },
                                color: theme.palette.grey[100],
                            },
                        }}
                    />
                ),
                cell: ({ table, row }) => {
                    return (
                        <CheckBoxTable
                            {...{
                                checked: row.getIsSelected(),
                                disabled: !row.getCanSelect(),
                                indeterminate: row.getIsSomeSelected(),
                                onChange: row.getToggleSelectedHandler(),
                            }}
                        />
                    );
                },
            }),
            columnHelper.accessor("driver_id", {
                header: "Driver",
                cell: ({ row }) =>
                    `${row.original.driver_id} - ${row.original.driver_name}`,
            }),
            columnHelper.accessor("vehicle_id", {
                header: "Plate Number",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("media_tp", {
                header: "Media TP",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("tanggal_pembuatan", {
                header: "Create Date",
                cell: ({ getValue }) => moment(getValue()).format("DD-MM-YYYY"),
            }),
            columnHelper.accessor("tanggal_surat_jalan", {
                header: "Loading Date",
                cell: ({ getValue }) => moment(getValue()).format("DD-MM-YYYY"),
            }),
            columnHelper.accessor("id_do", {
                header: "DO Num",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_so", {
                header: "SO Num",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_sto", {
                header: "STO Num",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("plant", {
                header: "Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("company", {
                header: "Company",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("material", {
                header: "Material",
                cell: ({ row }) =>
                    `${row.original.desc_mat} (${row.original.material})`,
            }),
            columnHelper.accessor("incoterm", {
                header: "Incoterm",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("planned_qty", {
                header: "Plan Qty.",
                cell: ({ getValue, row }) =>
                    `${formatNumber(getValue().toString(), row.original.uom)} `,
            }),
            columnHelper.accessor("fac_plant", {
                header: "Fac. Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("fac_batch", {
                header: "Fac. Batch",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("fac_sloc", {
                header: "Fac. Sloc",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("fac_valtype", {
                header: "Fac. Valtype",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_plant", {
                header: "Oth. Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_batch", {
                header: "Oth. Batch",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_sloc", {
                header: "Oth. Sloc",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_valtype", {
                header: "Oth. Valtype",
                cell: ({ getValue }) => getValue(),
            }),
        ],
        []
    );

    const { data, loading, error } = useFetchData({
        url: "/multi/osreq",
        initData: {
            data: [],
            colspan_names: [],
            pin_col: {
                right: [],
                left: [],
            },
        },
        refresh: refresh,
        setRefresh: setRefresh,
    });

    console.log(data);

    useEffect(() => {
        const dataGroup = new Map();
        if (data?.data.length < 0) {
            return;
        }
        data.data.forEach(item => {
            if (!dataGroup.get(item.hd_id)) {
                dataGroup.set(item.hd_id, [item]);
            } else {
                const current = dataGroup.get(item.hd_id);
                current.push(item);
                dataGroup.set(item.hd_id, current);
            }
        });
        setGrouped(dataGroup);
    }, [data.data]);

    useEffect(() => {
        const selectedRows = [];
        console.log(groupedRow);
        console.log(selectedRow);
        Object.keys(selectedRow).map(key => {
            if (key == "") {
                return;
            }
            const grprw = groupedRow.get(key);
            console.log(grprw);
            for (const dt of grprw) {
                selectedRows.push(dt);
            }
        });
        setSelGrp(selectedRows);
        setValue("selected", selectedRows);
    }, [selectedRow, groupedRow]);

    /**
     * @type {import("@tanstack/react-table").TableOptions} config_table
     */

    const config_table = {
        onRowSelectionChange: setSelectedRow,
        state: {
            rowSelection: selectedRow,
        },
        getRowId: row => row.id,
        defaultColumn: {
            size: 100,
        },
    };

    const openModalSubmit = value => {
        setOpenModal(true);
    };

    /**
     * @type {import("@tanstack/react-table").Table} tableSelectionRef.current
     */

    const tableSelectionRef = useRef(null);

    const refreshTable = value => {
        setRefresh(value);
        tableSelectionRef.current.resetRowSelection();
    };
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                gap: 2,
            }}
        >
            <input
                {...register("selected", {
                    validate: t => {
                        console.log(t);
                        return t.length > 0 || "Please select at least 1 data";
                    },
                })}
                hidden
            />
            {errors.selected && (
                <p style={{ color: "red" }}>{errors.selected.message}</p>
            )}
            <Box sx={{ display: "flex" }}>
                <RefreshButton
                    setRefreshbtn={refreshTable}
                    isLoading={refresh}
                />
            </Box>
            {loading ? (
                <SkeletonTable />
            ) : (
                <TableSpanPin
                    data={data.data}
                    columns={columns}
                    spanning_col={new Set(data.colspan_names)}
                    // pinned_col={new Set(data.pin_col)}
                    ref={tableSelectionRef}
                    config_table={config_table}
                />
            )}
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <LoadingButton
                    onClick={handleSubmit(openModalSubmit)}
                    variant="contained"
                >
                    Submit
                </LoadingButton>
            </Box>
            <SubmissionSelectedModal
                selectedId={selectedRow}
                rows={selGrpRow}
                open={openModal}
                setOpen={setOpenModal}
                data={data}
                setRefresh={setRefresh}
                tableSelectionAPI={tableSelectionRef}
            />
        </Box>
    );
}

/**
 * @param {Object} param
 * @param {import("@tanstack/react-table").Table} param.tableSelectionAPI
 */
function SubmissionSelectedModal({
    selectedId,
    rows,
    open,
    setOpen,
    data,
    setRefresh,
    tableSelectionAPI,
}) {
    const [is_allowed, setIsAllowed] = useState(false);
    const [error_maintain, setErrorMaintain] = useState({});
    const [modalAuth, setModalAuth] = useState(false);
    const [loadingPush, setLoadingPush] = useState(false);
    const session = useSession();
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
    const columns = useMemo(
        () => [
            columnHelper.accessor("driver_id", {
                header: "Driver",
                cell: ({ row }) =>
                    `${row.original.driver_id} - ${row.original.driver_name}`,
            }),
            columnHelper.accessor("vehicle_id", {
                header: "Plate Number",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("media_tp", {
                header: "Media TP",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("tanggal_pembuatan", {
                header: "Create Date",
                cell: ({ getValue }) => moment(getValue()).format("DD-MM-YYYY"),
            }),
            columnHelper.accessor("tanggal_surat_jalan", {
                header: "Loading Date",
                cell: ({ getValue }) => moment(getValue()).format("DD-MM-YYYY"),
            }),
            columnHelper.accessor("id_do", {
                header: "DO Num",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_so", {
                header: "SO Num",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("id_sto", {
                header: "STO Num",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("plant", {
                header: "Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("company", {
                header: "Company",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("material", {
                header: "Material",
                cell: ({ row }) =>
                    `${row.original.desc_mat} (${row.original.material})`,
            }),
            columnHelper.accessor("incoterm", {
                header: "Incoterm",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("planned_qty", {
                header: "Plan Qty.",
                cell: ({ getValue, row }) =>
                    `${formatNumber(getValue().toString(), row.original.uom)} `,
            }),
            columnHelper.accessor("fac_plant", {
                header: "Fac. Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("fac_batch", {
                header: "Fac. Batch",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("fac_sloc", {
                header: "Fac. Sloc",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("fac_valtype", {
                header: "Fac. Valtype",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_plant", {
                header: "Oth. Plant",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_batch", {
                header: "Oth. Batch",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_sloc", {
                header: "Oth. Sloc",
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor("oth_valtype", {
                header: "Oth. Valtype",
                cell: ({ getValue }) => getValue(),
            }),
        ],
        []
    );

    const enum_maintain = {
        fac_sloc: "Factory SLoc",
        fac_valtype: "Factory Valtype",
        fac_batch: "Factory Batch",
        oth_sloc: "Other Party SLoc",
        oth_valtype: "Other Party Valtype",
        oth_batch: "Other Party Batch",
    };
    const need_maintain = {
        fac_sloc: new Set(),
        fac_valtype: new Set(),
        fac_batch: new Set(),
        oth_sloc: new Set(),
        oth_valtype: new Set(),
        oth_batch: new Set(),
    };

    useEffect(() => {
        if (rows.length < 1) {
            return;
        }
        let allow = true;
        for (let i = 0; i < rows.length; i++) {
            if (!rows[i]["fac_sloc"]) {
                need_maintain.fac_sloc.add(rows[i]["plant"]);
                allow = false;
            }
            if (!rows[i]["fac_batch"]) {
                need_maintain.fac_batch.add(rows[i]["plant"]);
                allow = false;
            }
            if (!rows[i]["fac_valtype"]) {
                need_maintain.fac_valtype.add(rows[i]["plant"]);
                allow = false;
            }
            if (!rows[i]["oth_sloc"]) {
                need_maintain.oth_sloc.add(rows[i]["plant"]);
                allow = false;
            }
            if (!rows[i]["oth_batch"]) {
                need_maintain.oth_batch.add(rows[i]["plant"]);
                allow = false;
            }
            if (!rows[i]["oth_valtype"]) {
                need_maintain.oth_valtype.add(rows[i]["plant"]);
                allow = false;
            }
        }
        if (!allow) {
            setIsAllowed(allow);
            let end_needmaintain = [];
            Object.keys(need_maintain).map(key => {
                console.log(need_maintain[key].size);
                if (need_maintain[key].size !== 0) {
                    end_needmaintain.push({
                        param: enum_maintain[key],
                        value: Array.from(need_maintain[key].keys()),
                    });
                }
            });
            setErrorMaintain(end_needmaintain);
        } else {
            setIsAllowed(true);
            setErrorMaintain([]);
        }
    }, [rows]);

    const onYes = async () => {
        if (is_allowed) {
            setLoadingPush(true);
            try {
                const { data } = await axiosPrivate.post(
                    `/multi/pushsapmulti`,
                    { requests: rows, ...authValue() }
                );
                setOpen(false);
                setModalAuth(false);
                tableSelectionAPI.current.resetRowSelection({});
                setRefresh(true);
                setLoadingPush(false);
                toast.success(data.message);
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
            }
            return;
        }
        toast.error("Not allowed");
    };

    const onNo = () => {
        setOpen(false);
    };

    return (
        <>
            <DialogFormConfirmation
                open={open}
                setOpen={setOpen}
                Content={
                    <Box
                        sx={{
                            p: 2,
                            height: "30rem",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {error_maintain.length > 0 && (
                            <Alert severity="error" sx={{ mb: 1 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <p>
                                        Cannot submit data, please ask
                                        administrator to maintain
                                    </p>
                                    {error_maintain.map(item => (
                                        <Box sx={{ display: "flex", gap: 2 }}>
                                            <Box>
                                                <p>{item.param}</p>
                                            </Box>
                                            <Box>
                                                <p>:</p>
                                            </Box>
                                            <Box>
                                                <p>{item.value.join(", ")}</p>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Alert>
                        )}
                        <TableSpanPin
                            data={rows}
                            columns={columns}
                            spanning_col={new Set(data.colspan_names)}
                            pinned_col={data.pin_col}
                            sx={{ height: "100%" }}
                            config_table={{
                                defaultColumn: {
                                    size: 100,
                                },
                            }}
                        />
                    </Box>
                }
                onYes={onYes}
                onNo={onNo}
                Title={"Confirm Push Multi LN"}
                values={rows}
            />
            <Dialog open={modalAuth} maxWidth="m">
                <DialogTitle>Authorize SAP Credentials</DialogTitle>

                <form onSubmit={handleAuth(onYes)}>
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
        </>
    );
}
