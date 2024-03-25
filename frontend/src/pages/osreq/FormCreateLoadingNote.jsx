import TableLoadingNoteReq from "../../component/table/TableLoadingNoteReq";
import AutoCompleteCustomer from "./AutoCompleteCustomer";
import AutoCompleteDOList from "./AutoCompleteDOList";
import { CheckCircleOutline } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
    Paper,
    Typography,
    Dialog,
    DialogTitle,
    DialogActions,
    Box,
    Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import SelectComp from "../../component/input/SelectComp";
import { useForm } from "react-hook-form";
import TableSelectedLNReq from "../../component/table/TableSelectedLNReq";
import { Axios } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const ValuationTypeOp = [
    { value: "TR-SALES", label: "TR-SALES" },
    { value: "LIQD", label: "LIQD" },
    { value: "IN-TS02", label: "IN-TS02" },
    { value: "IN-TS03", label: "IN-TS03" },
    { value: "1011100444", label: "1011100444" },
    { value: "IN-VS51", label: "IN-VS51" },
    { value: "TR-SALES2", label: "TR-SALES2" },
];

export default function FormCreateLoadingNote() {
    const {
        control,
        handleSubmit,
        register,
        setValue,
        getValues,
        reset,
        formState: { errors, isValid },
    } = useForm({
        defaultValues: {
            fac_sloc: "",
            fac_valtype: "",
            oth_sloc: "",
            oth_valtype: "",
            selected_req: [],
        },
    });
    const [DoNum, setDoNum] = useState("");
    const [CustNum, setCustNum] = useState("");
    const [slocop, setSlocop] = useState([
        {
            value: "x",
            label: "x",
        },
    ]);
    const [isLoading, _setLoading] = useState(false);
    const [loadingPush, setLoadingPush] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRows, _setSelected] = useState([]);
    const [loadNotescs, setLNScs] = useState([]);
    const [failedCase, setFailedCase] = useState([]);
    const [modalSuccess, setModalscs] = useState(false);
    const navigate = useNavigate();

    const setdataDo = value => {
        setDoNum(value);
    };
    const setdataCust = value => {
        setCustNum(value);
    };
    const setLoading = value => {
        _setLoading(value);
    };
    const setSelected = value => {
        setValue("selected_req", value);
        _setSelected(value);
    };

    const onCloseModal = () => {
        setModalOpen(false);
    };

    useEffect(() => {
        if (selectedRows.length > 0) {
            (async () => {
                const rules = selectedRows[0].rules;
                const plant = selectedRows[0].plant;
                const { data } = await Axios.get(
                    `/master/sloc?plant=${plant}&rule=${rules}`
                );
                setSlocop(data);
            })();
        } else {
            setSlocop([{ value: "", label: "" }]);
        }
    }, [selectedRows]);

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    const submitItem = values => {
        console.log(values);
        setModalOpen(true);
    };

    const pushSAP = async () => {
        const payload = getValues();
        setLoadingPush(true);
        // setTimeout(() => {
        //     setLoadingPush(false);
        // }, 3000);
        try {
            const { data } = await Axios.post("/ln/pushmultisap", payload);
            setModalscs(true);
            reset({
                fac_sloc: "",
                fac_valtype: "",
                oth_sloc: "",
                oth_valtype: "",
                selected_req: [],
            });
            setTimeout(() => {
                setModalscs(false);
                setModalOpen(false);
            }, 3000);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoadingPush(false);
        }
    };

    return (
        <>
            <Toaster />
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                }}
            >
                <Paper
                    sx={{
                        p: 3,
                        display: "flex",
                        gap: 2,
                        mb: 2,
                        maxWidth: "40rem",
                    }}
                    elevation={4}
                >
                    <AutoCompleteDOList
                        sx={{ minWidth: "12rem", maxWidth: "15rem" }}
                        label="Nomor DO"
                        onChangeovr={setdataDo}
                    />
                    <AutoCompleteCustomer
                        sx={{ minWidth: "12rem", maxWidth: "15rem" }}
                        label="Customer Code"
                        onChangeovr={setdataCust}
                        do_num={DoNum}
                    />
                </Paper>
                <form
                    style={{ display: "flex" }}
                    onKeyDown={e => checkKeyDown(e)}
                    onSubmit={handleSubmit(submitItem)}
                >
                    <Paper
                        sx={{
                            p: 3,
                            display: "flex",
                            gap: 2,
                            mb: 2,
                        }}
                        elevation={4}
                    >
                        <SelectComp
                            name="fac_sloc"
                            label="Facility Store Loc."
                            control={control}
                            options={slocop}
                            sx={{ minWidth: "13rem" }}
                            rules={{ required: "Please Insert" }}
                        />
                        <SelectComp
                            name="fac_valtype"
                            label="Facility Val. Type"
                            control={control}
                            options={ValuationTypeOp}
                            sx={{ minWidth: "13rem" }}
                            rules={{ required: "Please Insert" }}
                        />
                        <SelectComp
                            name="oth_sloc"
                            label="Other Party Store Loc."
                            control={control}
                            options={slocop}
                            sx={{ minWidth: "13rem" }}
                            rules={{ required: "Please Insert" }}
                        />
                        <SelectComp
                            name="oth_valtype"
                            label="Other Party Val. Type"
                            control={control}
                            options={ValuationTypeOp}
                            sx={{ minWidth: "13rem" }}
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
                        sx={{ m: 3 }}
                        loading={isLoading}
                        // onClick={() => {
                        //     if (isValid) {
                        //         setModalOpen(true);
                        //     }
                        // }}
                        type="submit"
                    >
                        Push To SAP
                    </LoadingButton>
                </form>
            </div>
            {!!errors.selected_req && (
                <p style={{ color: "red" }}>{errors.selected_req.message}</p>
            )}
            <TableLoadingNoteReq
                filters={{ DoNum, CustNum }}
                setLoading={setLoading}
                setSelectedRowsUp={setSelected}
            />
            <Dialog
                open={modalOpen}
                maxWidth="xl"
                sx={{ zIndex: theme => theme.zIndex.drawer - 2 }}
            >
                <DialogTitle>SAP Generate Loading Note</DialogTitle>

                <Box
                    sx={{
                        width: "80em",
                        height: "30rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        p: 2,
                        mb: 3,
                    }}
                >
                    <Typography variant="h4">Data send to SAP :</Typography>
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
                                <p>{getValues("fac_sloc")}</p>
                            </div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <p>Factory Val. Type :</p>{" "}
                                <p>{getValues("fac_valtype")}</p>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <p>Other Party Store Loc :</p>{" "}
                                <p>{getValues("oth_sloc")}</p>
                            </div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <p>Other Party Val. Type :</p>{" "}
                                <p>{getValues("oth_valtype")}</p>
                            </div>
                        </div>
                    </div>
                    <TableSelectedLNReq rowsData={selectedRows} />
                </Box>
                <DialogActions>
                    <LoadingButton
                        onClick={() => pushSAP()}
                        color="primary"
                        variant="contained"
                        loading={loadingPush}
                    >
                        Push
                    </LoadingButton>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => setModalOpen(false)}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={modalSuccess}
                maxWidth="sm"
                onClose={onCloseModal}
                sx={{ zIndex: theme => theme.zIndex.drawer - 2 }}
            >
                <Box
                    sx={{
                        minWidth: "30rem",
                        minHeight: "15rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        p: 4,
                    }}
                >
                    <CheckCircleOutline
                        sx={{
                            height: "4rem",
                            width: "4rem",
                            color: "green",
                        }}
                    />
                    <Typography variant="h4">
                        Loading Note Pushed to Staging
                    </Typography>
                </Box>
            </Dialog>
        </>
    );
}
