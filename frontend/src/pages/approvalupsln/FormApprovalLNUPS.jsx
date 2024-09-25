import AutoCompleteCustomerUPS from "./AutoCompleteCustomerUPS";
import AutoCompleteDOListUPS from "./AutoCompleteDOListUPS";
import TableApprovalLNUPS from "../../component/table/TableApprovalLNUPS";
import { useForm } from "react-hook-form";
import { Box, Paper } from "@mui/material";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { debounce } from "lodash";
import { LoadingButton } from "@mui/lab";
import ResultDialog from "../../component/common/ResultDialog";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import moment from "moment/moment";
import toast, { Toaster } from "react-hot-toast";

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
            selected_req: [],
        },
    });
    const axiosPrivate = useAxiosPrivate();
    const [DoNum, setDoNum] = useState("");
    const [CustNum, setCustNum] = useState("");
    const DoNumVal = useMemo(() => DoNum, [DoNum]);
    const CustNumVal = useMemo(() => CustNum, [CustNum]);
    const [resetRow, setResetRow] = useState(false);
    const [isLoading, _setLoading] = useState(false);
    const [selectedRows, _setSelected] = useState([]);
    const [remainingQty, _setRemaining] = useState(0);

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
                    id_do: item.id_do,
                    id_sto: item.id_sto,
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
                };
            });
            setLoading(true);
            const { data } = await axiosPrivate.post("/ln/pushlnups", {
                lnreq: payload,
            });
            openDialog("success", ResponseDialogText(data.message, data.LN));
            reset({
                selected_req: [],
            });
        } catch (error) {
            toast.error(error.response.data.message);
            console.error(error);
        } finally {
            setResetRow(!resetRow);
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
                        sx={{ minWidth: "30rem", maxWidth: "15rem" }}
                        label="Customer Code"
                        onChangeovr={setdataCust}
                    />
                    <AutoCompleteDOListUPS
                        sx={{ minWidth: "12rem", maxWidth: "15rem" }}
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
                />
            </div>
            <form onSubmit={handleSubmit(approveLN)}>
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
            </form>
        </>
    );
}
