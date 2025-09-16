import AutoCompleteCustomerUPS from "./AutoCompleteCustomerUPS";
import AutoCompleteDOListUPS from "./AutoCompleteDOListUPS";
import TableApprovalLNUPS from "../../component/table/TableApprovalLNUPS";
import { useForm } from "react-hook-form";
import { Box, Dialog, Paper, Typography } from "@mui/material";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { debounce } from "lodash";
import { LoadingButton } from "@mui/lab";
import ResultDialog from "../../component/common/ResultDialog";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import moment from "moment/moment";
import toast, { Toaster } from "react-hot-toast";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import DialogFormConfirmation from "../../component/common/DialogFormConfirmation";
import TableSelectedLNReq from "../../component/table/TableSelectedLNReq";

const ResponseDialogText = (textresult, lnnum) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: "100%",
            }}
        >
            <h2 style={{ marginBottom: "0px", marginTop: "0px" }}>
                {textresult}
            </h2>
            <p style={{ marginBottom: "0px" }}>List of loading note :</p>
            <p style={{ fontSize: "8pt" }}>{lnnum}</p>
        </Box>
    );
};

const ContentApprovalConfirm = ({ getValues, selectedRows }) => {
    return (
        <Box
            sx={{
                height: "30rem",
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
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <p>Factory Store Loc :</p>{" "}
                        <p>{getValues("fac_sloc")?.value}</p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <p>Factory Val. Type :</p>{" "}
                        <p>{getValues("fac_valtype")?.value}</p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <p>Factory Batch :</p>{" "}
                        <p>
                            {getValues("fac_batch")?.value ??
                                getValues("fac_batch")}
                        </p>
                    </div>
                </div>
                <div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <p>Other Party Store Loc :</p>{" "}
                        <p>{getValues("oth_sloc")?.value}</p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <p>Other Party Val. Type :</p>{" "}
                        <p>{getValues("oth_valtype")?.value}</p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem" }}>
                        <p>Other Party Batch :</p>{" "}
                        <p>
                            {getValues("oth_batch")?.value ??
                                getValues("oth_batch")}
                        </p>
                    </div>
                </div>
            </div>
            <TableSelectedLNReq rowsData={selectedRows} />
        </Box>
    );
};

export default function FormApprovalLNUPS() {
    const theme = useTheme();
    const {
        control,
        handleSubmit,
        register,
        setValue,
        getValues,
        reset,
        clearErrors,
        formState: { errors, isValid },
    } = useForm({
        defaultValues: {
            fac_sloc: "",
            fac_batch: "",
            fac_valtype: "",
            oth_sloc: "",
            oth_batch: "",
            oth_valtype: "",
            selected_req: [],
        },
    });
    const axiosPrivate = useAxiosPrivate();
    const [openDialogConf, setOpenDialog] = useState(false);
    const [DoNum, setDoNum] = useState("");
    const [CustNum, setCustNum] = useState("");
    const [slocopfac, setSlocopfac] = useState([]);
    const [slocopoth, setSlocopoth] = useState([]);
    const [facBatchOp, setFacBatchOp] = useState([]);
    const [othBatchOp, setOthBatchOp] = useState([]);
    const [valtypeOp, setvpOp] = useState([]);
    const DoNumVal = useMemo(() => DoNum, [DoNum]);
    const CustNumVal = useMemo(() => CustNum, [CustNum]);
    const [resetRow, setResetRow] = useState(false);
    const [isLoading, _setLoading] = useState(false);
    const [selectedRows, _setSelected] = useState([]);
    const [remainingQty, _setRemaining] = useState(0);
    const [firstRow, setFirstRow] = useState(null);

    //DialogResult
    const [isOpen, setOpen] = useState(false);
    const [state, setState] = useState("");
    const [text, setText] = useState(<></>);

    function openDialog(state, text) {
        setState(state);
        setText(text);
        setOpen(true);
    }

    function closeDialog() {
        setOpen(false);
    }

    //
    const setLoading = value => {
        _setLoading(value);
    };
    const setSelected = value => {
        setValue(
            "selected_req",
            value.map(item => ({
                ...item,
                plan_qty: item.plan_qty.replace(/,/g, ""),
            }))
        );
        setFirstRow(value[0] ?? null);
        _setSelected(value);
    };
    const setdataDo = useCallback(value => {
        setDoNum(value);
    }, []);
    const setdataCust = debounce(value => {
        setCustNum(value?.split("-")[1]?.trim());
    }, 1000);

    function setRemaining(value) {
        _setRemaining(value);
    }

    //Set SLOC VALTYPE and BATCH
    useEffect(() => {
        if (!firstRow) {
            reset({
                fac_sloc: "",
                fac_valtype: "",
                oth_sloc: "",
                oth_valtype: "",
                fac_batch: "",
                oth_batch: "",
                selected_req: [],
            });
        } else {
            _setLoading(true);
            (async () => {
                try {
                    let inco;
                    if (firstRow.cgrp === "UPSTREAM") {
                        inco = `&inco=${firstRow.inco_1}`;
                    }
                    const { data: getSloc } = await axiosPrivate.get(
                        `/master/slocdb?plant=${firstRow.plant}&material=${firstRow.material}${inco ?? ""}`
                    );
                    const slocfac = getSloc.data.FAC;
                    const slocoth = getSloc.data.OTH;
                    const { data: getValtype } = await axiosPrivate.get(
                        `/master/valtypedb?plant=${firstRow.plant}&material=${firstRow.material}${inco ?? ""}`
                    );
                    const valType = getValtype.data;
                    const valfac = valType.FAC;
                    const valoth = valType.OTH;
                    const { data: getBatch } = await axiosPrivate.get(
                        `/master/batchdb?company=${firstRow.company}`
                    );
                    const batch = getBatch.batch.map(item => ({
                        value: item,
                        label: item,
                    }));
                    if (getBatch.group === "UPSTREAM") {
                        setValue("fac_batch", batch[0]);
                        setFacBatchOp(batch);
                        setValue("oth_batch", {
                            value: firstRow.id_do,
                            label: firstRow.id_do,
                        });
                    } else {
                        setValue("fac_batch", {
                            value: firstRow.company,
                            label: firstRow.company,
                        });
                        setValue(
                            "oth_batch",
                            firstRow.oth_batch
                                ? {
                                      value: firstRow.oth_batch,
                                      label: firstRow.oth_batch,
                                  }
                                : null
                        );
                    }
                    if (firstRow.fac_sloc !== "" && firstRow.fac_sloc) {
                        setValue("fac_sloc", {
                            value: firstRow.fac_sloc,
                            label:
                                firstRow.fac_sloc +
                                " - " +
                                firstRow.fac_sloc_desc,
                        });
                    } else if (slocfac) {
                        setValue("fac_sloc", {
                            value: slocfac.sloc,
                            label: slocfac.sloc + " - " + slocfac.description,
                        });
                    }
                    if (firstRow.oth_sloc !== "" && firstRow.oth_sloc) {
                        setValue("oth_sloc", {
                            value: firstRow.oth_sloc,
                            label:
                                firstRow.oth_sloc +
                                " - " +
                                firstRow.oth_sloc_desc,
                        });
                    } else if (slocoth) {
                        setValue("oth_sloc", {
                            value: slocoth.sloc,
                            label: slocoth.sloc + " - " + slocoth.description,
                        });
                    }
                    if (firstRow.fac_valtype !== "" && firstRow.fac_valtype) {
                        setValue("fac_valtype", {
                            value: firstRow.fac_valtype,
                            label: firstRow.fac_valtype,
                        });
                    } else if (valfac) {
                        setValue("fac_valtype", {
                            value: valfac.valtype,
                            label: valfac.valtype,
                        });
                    }
                    if (firstRow.oth_valtype !== "" && firstRow.oth_valtype) {
                        setValue("oth_valtype", {
                            value: firstRow.oth_valtype,
                            label: firstRow.oth_valtype,
                        });
                    } else if (valoth) {
                        setValue("oth_valtype", {
                            value: valoth.valtype,
                            label: valoth.valtype,
                        });
                    }
                    if (slocfac) {
                        setSlocopfac([
                            {
                                value: slocfac.sloc,
                                label:
                                    slocfac.sloc + " - " + slocfac.description,
                            },
                        ]);
                    }
                    if (slocoth) {
                        setSlocopoth([
                            {
                                value: slocoth.sloc,
                                label:
                                    slocoth.sloc + " - " + slocoth.description,
                            },
                        ]);
                    }
                    if (valoth && valfac) {
                        setvpOp([
                            {
                                value: valoth.valtype,
                                label: valoth.valtype,
                            },
                            {
                                value: valfac.valtype,
                                label: valfac.valtype,
                            },
                        ]);
                    }
                    clearErrors();
                } catch (error) {
                    console.error(error);
                } finally {
                    _setLoading(false);
                }
            })();
        }
    }, [firstRow]);

    function stagedapproveLN(value) {
        console.log(value);
        setOpenDialog(true);
    }

    async function approveLN(value) {
        try {
            const payload = value.selected_req.map(item => {
                let cust_code;
                let tanggal_surat_jalan;
                if (item.cust_code) {
                    cust_code = item.cust_code;
                }
                if (item.intr_code) {
                    cust_code = item.intr_code;
                }
                if (item.ven_code) {
                    cust_code = item.ven_code;
                }
                const spltgl = item.tanggal_surat_jalan.split("-");
                tanggal_surat_jalan = `${spltgl[2]}-${spltgl[1]}-${spltgl[0]}`;
                return {
                    det_id: item.id,
                    cust_code: cust_code,
                    fac_sloc: value.fac_sloc.value,
                    oth_sloc: value.oth_sloc.value,
                    fac_valtype: value.fac_valtype.value,
                    oth_valtype: value.oth_valtype.value,
                    fac_batch: value.fac_batch.value,
                    oth_batch: value.oth_batch.value,
                    id_do: item.id_do,
                    id_sto: item.id_sto,
                    id_po: item.id_po,
                    inco_1: item.inco_1,
                    driver_id: item.driver_id,
                    vhcl_id: item.vhcl_id,
                    plan_qty: item.plan_qty,
                    uom: item.uom,
                    create_at: moment(item.create_date).format("YYYY-MM-DD"),
                    tanggal_surat_jalan: tanggal_surat_jalan,
                    plant: item.plant,
                    company: item.company,
                    con_num: item.con_num,
                    material: item.material,
                    desc_con: item.desc_con,
                    ticket_no: item.ticket_no,
                    tr_code: item.tr_code,
                    tr_name: item.tr_name,
                };
            });
            // console.log(payload);
            setLoading(true);
            const { data } = await axiosPrivate.post("/ln/pushlnups", {
                lnreq: payload,
            });
            openDialog("success", ResponseDialogText(data.message, data.LN));
            reset({
                selected_req: [],
            });
            setOpenDialog(false);
            setResetRow(!resetRow);
        } catch (error) {
            toast.error(error.response.data.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div>
                <Toaster />
                <Paper
                    sx={{
                        p: 3,
                        display: "flex",
                        gap: 2,
                        mb: 2,
                        maxWidth: "60rem",
                    }}
                    elevation={4}
                >
                    <AutoCompleteCustomerUPS
                        sx={{ maxWidth: "30rem" }}
                        label="Customer Code"
                        onChangeovr={setdataCust}
                        prereg_type={"WB"}
                    />
                    <AutoCompleteDOListUPS
                        sx={{ maxWidth: "30rem" }}
                        label="Nomor DO"
                        onChangeovr={setdataDo}
                        cust={CustNum}
                    />
                </Paper>
                {!!errors.selected_req && (
                    <p style={{ color: "red" }}>
                        {errors.selected_req.message}
                    </p>
                )}
                <ResultDialog
                    modalOpen={isOpen}
                    State={state}
                    Text={text}
                    onCloseModal={closeDialog}
                />
            </div>
            <div>
                <TableApprovalLNUPS
                    DoNum={DoNumVal}
                    CustNum={CustNumVal}
                    setLoading={setLoading}
                    setSelectedRowsUp={setSelected}
                    setRemainingUp={setRemaining}
                    remaining={remainingQty}
                    resetRows={resetRow}
                    prereg_type={"WB"}
                />
            </div>
            <form onSubmit={handleSubmit(stagedapproveLN)}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            flexWrap: "wrap",
                            maxWidth: "45rem",
                            gap: 2,
                            mb: 2,
                        }}
                        elevation={4}
                    >
                        <AutocompleteComp
                            name="fac_sloc"
                            label="Factory Store Loc."
                            control={control}
                            options={slocopfac}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            // disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="oth_sloc"
                            label="Other Party Store Loc."
                            control={control}
                            options={slocopoth}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            // disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="fac_batch"
                            label="Factory Batch"
                            control={control}
                            options={facBatchOp}
                            rules={{ required: "Please Insert" }}
                            freeSolo={true}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            // disabled={who === "log"}
                        />
                        <AutocompleteComp
                            name="oth_batch"
                            label="Other Party Batch"
                            control={control}
                            options={othBatchOp}
                            freeSolo
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            // disabled={who === "log"}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="fac_valtype"
                            label="Factory Party Val. Type"
                            control={control}
                            options={valtypeOp}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            rules={{ required: "Please Insert" }}
                        />
                        <AutocompleteComp
                            name="oth_valtype"
                            label="Other Party Val. Type"
                            control={control}
                            options={valtypeOp}
                            sx={{
                                maxWidth: "20rem",
                                input: {
                                    "&.MuiOutlinedInput-input.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                                label: {
                                    "&.Mui-disabled": {
                                        WebkitTextFillColor:
                                            theme.palette.grey[500],
                                        color: theme.palette.grey[500],
                                    },
                                },
                            }}
                            rules={{ required: "Please Insert" }}
                        />
                    </Paper>
                    <input
                        {...register("selected_req", {
                            validate: selected => {
                                return (
                                    selected.length > 0 ||
                                    "Please check data below at least 1"
                                );
                            },
                        })}
                        hidden
                    />
                    <LoadingButton
                        variant="contained"
                        sx={{ m: 3, maxWidth: "10rem", height: "4rem" }}
                        loading={isLoading}
                        // onClick={() => {
                        //     if (isValid) {
                        //         setModalOpen(true);
                        //     }
                        // }}
                        type="submit"
                    >
                        Approve Request
                    </LoadingButton>
                </Box>
            </form>
            <DialogFormConfirmation
                open={openDialogConf}
                onYes={async () => {
                    await approveLN(getValues());
                }}
                onNo={() => {
                    setOpenDialog(false);
                }}
                Title="Approve Loading Note Request"
                Content={
                    <ContentApprovalConfirm
                        getValues={getValues}
                        selectedRows={selectedRows}
                    />
                }
            />
        </>
    );
}
