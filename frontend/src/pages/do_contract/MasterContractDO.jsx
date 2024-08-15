import TablePaginate from "../../component/table/TablePaginate";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import {
    Dialog,
    Tooltip,
    IconButton,
    Box,
    Button,
    DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Delete, Edit, ToggleOff, ToggleOn } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import NumericFieldComp from "../../component/input/NumericFieldComp";
import SelectDOComp from "../loadingnote/SelectDOComp";
import SelectComp from "../../component/input/SelectComp";
import { useForm, useWatch } from "react-hook-form";
import { useState, useMemo, useEffect, useRef } from "react";
import RefreshButton from "../../component/common/RefreshButton";
import toast, { Toaster } from "react-hot-toast";
import AutoSelectUserSAPAll from "./AutoSelectUserSAPAll";
import { debounce } from "lodash";

const MasterContractDO = () => {
    const theme = useTheme();
    const axiosPrivate = useAxiosPrivate();
    const [is_loading, setLoading] = useState(false);
    // const customerCode = useRef("");
    const [optInco, setOptInco] = useState([]);
    const [custCode, setCustCode] = useState(null);
    const [preOpDO, setPreOPDO] = useState("");
    const [modal, setModal] = useState(false);
    const [refresh, _setRefresh] = useState(false);
    const setRefresh = value => {
        _setRefresh(value);
    };
    const [paginate, _setPaginate] = useState({
        pageSize: 10,
        pageIndex: 0,
    });
    const setPaginate = value => {
        _setPaginate(value);
    };
    const defaultValues = {
        cust_id: null,
        do_number: "",
        contract_qty: "",
        remaining_qty: "",
        holding_qty: "",
        inco: "",
    };
    const { control, getValues, handleSubmit, setValue, reset } = useForm({
        defaultValues: defaultValues,
        mode: "onChange",
    });
    const [dataTable, setDt] = useState({ data: [], count: 0 });
    const onChangeCustCode = value => {
        setCustCode(value.code);
    };

    const getContractQty = async do_number => {
        try {
            const { data } = await axiosPrivate.get(
                "/master/do?do_num=" + do_number
            );
            return data.SLIP.KWMENG;
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message ?? error.message);
        }
    };

    const deleteContractQty = async do_number => {
        try {
            const { data } = await axiosPrivate.post("/master/deletemstcon", {
                id: do_number,
            });
            toast.success(data.message);
            setRefresh(true);
            return;
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message ?? error.message);
        }
    };

    const deactivateContract = async (do_number, action) => {
        try {
            const { data } = await axiosPrivate.post("/master/deactmstcon", {
                id: do_number,
                action: action,
            });
            toast.success(data.message);
            setRefresh(true);
            return;
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message ?? error.message);
        }
    };
    const hold_qty = useWatch({ control, name: "holding_qty" });
    const id_do = useWatch({ control, name: "do_number" });
    const conqty = useWatch({ control, name: "contract_qty" });
    const inco_type = useWatch({ control, name: "inco" });

    console.log(inco_type);

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const { data } = await axiosPrivate.get(
                    `/master/getmstcon?limit=${paginate.pageSize}&offset=${paginate.pageIndex}&q=`,
                    { signal: controller.signal }
                );
                setDt(data);
            } catch (error) {
                console.error(error);
            } finally {
                setRefresh(false);
            }
        })();

        return () => {
            controller.abort();
        };
    }, [refresh]);

    useEffect(() => {
        let contract_qty = getValues("contract_qty") ?? 0;
        if (contract_qty > 0) {
            setValue(
                "remaining_qty",
                parseInt(getValues("contract_qty")) -
                    parseInt(hold_qty.replace(/,/g, ""))
            );
        }
    }, [hold_qty, id_do]);

    useEffect(() => {
        const getContractQty = debounce(async do_number => {
            try {
                const { data } = await axiosPrivate.get(
                    "/master/do?do_num=" + do_number
                );
                setValue("contract_qty", data.SLIP.KWMENG);
            } catch (error) {
                console.error(error);
                toast.error(error.response.data.message ?? error.message);
            }
        }, 300);
        if (id_do) {
            getContractQty(id_do);
        }
    }, [id_do]);

    //fetch inco options
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get("/master/incoterm");
                const options = data.map(item => ({
                    value: item.inco_id,
                    label: item.inco_name,
                }));
                setOptInco(options);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    const editForm = async id_do => {
        if (id_do) {
            try {
                const { data } = await axiosPrivate.get(
                    `/master/getconbydo?id_do=` + id_do
                );
                const contractData = await getContractQty(id_do);
                setPreOPDO(data.id_do);
                setCustCode(data.cust_id);
                reset({
                    do_number: data.id_do,
                    contract_qty: contractData,
                    cust_id: {
                        value: data.cust_id,
                        code: data.cust_id,
                        label: `${data.cust_id} - ${data.name}`,
                    },
                    holding_qty: data.hold_qty,
                });
                setModal(true);
            } catch (error) {
                console.error(error);
                toast.error(error.response.data.message ?? error.message);
            }
        }
    };
    const columns = useMemo(
        () => [
            {
                header: "Customer",
                accessorKey: "cust_id",
                cell: props => props.getValue(),
            },
            {
                header: "DO Number",
                accessorKey: "id_do",
                cell: props => props.getValue(),
            },
            {
                header: "Holding Quantity",
                accessorKey: "hold_qty",
                cell: props =>
                    props.getValue().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
            },
            {
                header: "Status",
                accessorKey: "is_active",
                cell: props => (props.getValue() ? "Active" : "Inactive"),
            },
            {
                id: "action",
                cell: ({ row }) => {
                    let buttons = [];
                    buttons.push(
                        <Tooltip key={row.id + "-edit"} title={<p>Edit</p>}>
                            <IconButton
                                sx={{
                                    backgroundColor: "primary.main",
                                    color: theme.palette.primary.contrastText,
                                    ":hover": {
                                        color: theme.palette.grey[800],
                                    },
                                    mx: 1,
                                }}
                                onClick={() => {
                                    editForm(row.original.id_do);
                                }}
                            >
                                <Edit></Edit>
                            </IconButton>
                        </Tooltip>
                    );
                    buttons.push(
                        <Tooltip key={row.id + "-delete"} title={<p>Delete</p>}>
                            <IconButton
                                sx={{
                                    backgroundColor: "error.main",
                                    color: theme.palette.error.contrastText,
                                    ":hover": {
                                        color: theme.palette.grey[800],
                                    },
                                    mx: 1,
                                }}
                                onClick={() => {
                                    deleteContractQty(row.original.id_do);
                                }}
                            >
                                <Delete></Delete>
                            </IconButton>
                        </Tooltip>
                    );

                    buttons.push(
                        <Tooltip
                            key={row.id + "-activation"}
                            title={
                                row.original.is_active ? (
                                    <p>Deactivate</p>
                                ) : (
                                    <p>Activate</p>
                                )
                            }
                        >
                            <IconButton
                                sx={{
                                    backgroundColor: row.original.is_active
                                        ? "error.main"
                                        : "success.main",
                                    color: theme.palette.error.contrastText,
                                    mx: 1,
                                    ":hover": {
                                        color: theme.palette.grey[800],
                                    },
                                }}
                                onClick={() => {
                                    deactivateContract(
                                        row.original.id_do,
                                        row.original.is_active ? false : true
                                    );
                                }}
                            >
                                {row.original.is_active ? (
                                    <ToggleOff />
                                ) : (
                                    <ToggleOn />
                                )}
                            </IconButton>
                        </Tooltip>
                    );

                    return buttons;
                },
            },
        ],
        []
    );

    const submitForm = async values => {
        setLoading(true);
        try {
            const payload = {
                id_do: values.do_number,
                hold_qty: values.holding_qty.replace(/,/g, ""),
                cust_id: values.cust_id.code,
            };
            const { data } = await axiosPrivate.post(
                `/master/savemstcon`,
                payload
            );
            toast.success(data.message);
            setModal(false);
            setRefresh(true);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message ?? error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            <Toaster />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <RefreshButton
                    isLoading={refresh}
                    setRefreshbtn={setRefresh}
                    sx={{ height: "4rem", width: "4rem" }}
                />
                <Button
                    sx={{ width: "7rem", m: 2 }}
                    onClick={() => {
                        setModal(true);
                        reset({
                            cust_id: null,
                            do_number: "",
                            contract_qty: "",
                            remaining_qty: "",
                            holding_qty: "",
                            inco: "",
                        });
                    }}
                >
                    + Add New
                </Button>
            </Box>
            <TablePaginate
                sx={{ height: "88%" }}
                data={dataTable}
                columns={columns}
                paginate={paginate}
                setPaginate={setPaginate}
            />
            <Dialog
                open={modal}
                onClose={() => {
                    setModal(false);
                }}
                maxWidth="xl"
            >
                <form
                    onSubmit={handleSubmit(submitForm)}
                    onKeyDown={e => checkKeyDown(e)}
                >
                    <Box
                        sx={{
                            p: 3,
                            width: "50rem",
                            height: "30rem",
                        }}
                    >
                        <h4 sx={{ my: "0" }}>
                            Create Holding Quantity Contract DO
                        </h4>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                            <AutoSelectUserSAPAll
                                name="cust_id"
                                label="Customer"
                                control={control}
                                sx={{ width: "28rem" }}
                                onChangeControlOvr={onChangeCustCode}
                            />
                            <SelectDOComp
                                name="do_number"
                                label="DO Number"
                                control={control}
                                cust_id={custCode}
                                preop={preOpDO}
                            />
                            <NumericFieldComp
                                name="contract_qty"
                                label="Contract Quantity"
                                control={control}
                                sx={{ width: "20rem" }}
                                disabled
                                thousandSeparator
                            />
                            <NumericFieldComp
                                name="remaining_qty"
                                label="Remaining OS Quantity"
                                control={control}
                                sx={{ width: "20rem" }}
                                disabled
                                thousandSeparator
                            />
                            <NumericFieldComp
                                name="holding_qty"
                                label="Holding Quantity"
                                control={control}
                                sx={{ width: "20rem" }}
                                thousandSeparator
                                disabled={!conqty}
                                rules={{
                                    validate: (value, formValues) => {
                                        if (
                                            parseInt(formValues.contract_qty) -
                                                parseInt(
                                                    value.replace(/,/g, "")
                                                ) <
                                            0
                                        )
                                            return "Please insert holding quantity amount below contract quantity";
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                    <DialogActions>
                        <Button
                            color="error"
                            onClick={e => {
                                setModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            loading={is_loading}
                            variant="contained"
                            type="submit"
                        >
                            Submit
                        </LoadingButton>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default MasterContractDO;
