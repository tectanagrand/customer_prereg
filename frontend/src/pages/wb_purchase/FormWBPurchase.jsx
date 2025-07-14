import { useForm, useFieldArray } from "react-hook-form";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import AutoSelectDriver from "../loadingnote/AutoselectDriver";
import {
    Typography,
    Divider,
    Button,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { Cancel, Replay } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import AutoSelectVehicle from "../loadingnote/AutoselectVehicle";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useRef, useState, useEffect, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import SelectComp from "../../component/input/SelectComp";
import { NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";
import DatePickerComp from "../../component/input/DatePickerComp";
import NumericFieldComp from "../../component/input/NumericFieldComp";
import moment from "moment";
import { useSearchParams, useNavigate } from "react-router-dom";
import SelectPOComp from "./SelectPOComp";
import { useSession } from "../../provider/sessionProvider";
import { useTheme } from "@mui/material/styles";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import useTimeout from "../../hooks/useTimeout";
import useFetchData from "../../hooks/useFetchData";
import AutoCompleteVCont from "../../component/input/AutoCompleteVCont";

export default function FormWBPurchase() {
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    const { setHookTimeout } = useTimeout();
    const axiosPrivate = useAxiosPrivate();
    const [click, setClick] = useState(false);
    const [medtpOP, setMedTPOP] = useState([]);
    const [checkedMulti, setCheckedMulti] = useState([]);
    const [uomQty, setUomQty] = useState("Kg");
    const [preOp, setPreOp] = useState("");
    const { session, getPermission } = useSession();
    const navigate = useNavigate();
    const curAuth = useRef({});
    const {
        control,
        getValues,
        reset,
        register,
        setValue,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            relate_cust: null,
            vendor: null,
            po_num: "",
            trans_type: "",
            con_num: "",
            material: "",
            con_qty: 0,
            hold_qty: 0,
            os_qty: 0,
            os_wb_qty: 0,
            plant: "",
            description: "",
            uom: "",
            load_detail: [],
            company: "",
        },
    });
    const { fields, append, remove } = useFieldArray({
        name: "load_detail",
        control,
        rules: { required: "Insert data" },
    });
    const [isLoading, setLoading] = useState(false);
    const [isPaid, setPaid] = useState(false);
    const [isExceed, setExceed] = useState(false);
    const usedQty = useRef(0);
    const [remainingQty, setRemaining] = useState(0);
    const position = useRef("");
    const uuidLN = useRef("");
    const theme = useTheme();
    const [searchparam] = useSearchParams();
    const idloadnote = searchparam.get("idloadnote");
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get(
                    "ln/id?idloadnote=" + idloadnote
                );
                let checkedMulti = [];
                const load_detail = data.data.load_detail.map(item => {
                    checkedMulti.push(item.is_multi);
                    return {
                        ...item,
                        loading_date: moment(item.loading_date),
                        relate_do: item.multi_do ?? [],
                        method: "",
                    };
                });
                setCheckedMulti(checkedMulti);
                setRemaining(parseFloat(data.data.remaining));
                usedQty.current = parseFloat(data.data.totalspend);
                reset({
                    ...data.data,
                    relate_cust: {
                        value: data.data.relate_cust,
                        label: `${data.data.cust_name} - ${data.data.relate_cust}`,
                    },
                    vendor: {
                        value: data.data.ven_code,
                        label: `${data.data.ven_name} - ${data.data.ven_code}`,
                    },
                    con_qty: data.data.con_qty,
                    os_sap_qty: data.data.con_qty - data.data.totalSAP,
                    load_detail: load_detail,
                });
                setPreOp(data.data.po_num);
                uuidLN.current = data.id_header;
                position.current = data.cur_pos;
                curAuth.current = getPermission("Purchase Request");

                // lastIdx.current =
                //     load_detail.length !== 0 ? load_detail.length : 0;
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get("/master/mediatp");
                setMedTPOP(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    //get options related customer
    const {
        data: relate_cust,
        loading: load_cust,
        error,
    } = useFetchData({
        url: "/user/relation",
        initData: {
            data: [],
        },
    });

    const { data: ven_data, loading: ven_loading } = useFetchData({
        url: "/master/ven",
        initData: {
            data: [],
        },
    });

    const ven_op = useMemo(() => {
        return ven_data.data
            ? ven_data.data.map(value => ({
                  label: value.name,
                  value: value.code,
                  ...value,
              }))
            : [];
    }, [ven_data]);

    const relate_cust_op = useMemo(() => {
        return relate_cust.data
            ? relate_cust.data.map(value => ({
                  label: value.name + " - " + value.code,
                  value: value.code,
                  ...value,
              }))
            : [];
    }, [relate_cust]);

    const submitItem = async values => {
        const load_detail = values.load_detail.map(item => ({
            ...item,
            driver_id: item.driver ? item.driver.value : "",
            driver_name: item.driver
                ? item.driver.label.split("-")[1].trim()
                : "",
            vehicle: item.vehicle ? item.vehicle.value : "",
            loading_date: moment(item.loading_date).format("YYYY-MM-DD"),
            planned_qty: item.planned_qty.replace(/,/g, ""),
            media_tp: item.media_tp,
            method: item.method,
            multi_do: item.relate_do,
        }));
        const payload = {
            ...values,
            id_header: uuidLN.current,
            relate_cust: values.relate_cust?.value,
            company: values.company,
            load_detail: load_detail,
            ven_code: values.vendor?.value ?? "",
            ven_name: values.vendor?.label.split("-")[0].trim() ?? "",
            prereg_type: "WB",
            con_qty:
                typeof values.con_qty === "string"
                    ? values.con_qty.replace(/,/g, "")
                    : values.con_qty,
        };
        // delete payload.incoterms
        setLoading(true);
        try {
            const { data } = await axiosPrivate.post("/ln/save", payload, {
                withCredentials: true,
            });
            toast.success(data.message);

            setHookTimeout(() => {
                navigate("/dashboard/wb/purchase");
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckSO = async value => {
        setLoading(true);
        try {
            const { data } = await axiosPrivate.get(
                `/master/podet?id_po=${value}`
            );
            const slip = data.data;
            const dataMap = {
                po_num: value,
                material: slip.mat_code,
                con_qty: slip.con_qty,
                os_qty: slip.qty_os.REMAINING,
                os_wb_qty: slip.qty_os.QTY_PO - slip.qty_os.QTY_ZWBPARK,
                plant: slip.plant,
                description: slip.desc_material,
                uom: slip.uom,
                company: slip.plant.slice(0, 2),
            };
            setUomQty(slip.uom);
            setRemaining(slip.qty_os.REMAINING);
            usedQty.current = slip.qty_os.TOTAL_SPENT;
            Object.keys(getValues()).forEach(item => {
                if (dataMap.hasOwnProperty(item)) {
                    setValue(item, dataMap[item]);
                }
            });
            // toast.success("Success retrieve SO");
        } catch (error) {
            console.log(error);
            reset({
                po_num: "",
                material: "",
                con_qty: "",
                os_qty: 0,
                os_wb_qty: 0,
                plant: "",
                description: "",
                uom: "",
                company: "",
            });
            if (error.response) {
                toast.error(error.response.data.message);
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const checkExistingOsQty = () => {
        const plansData = getValues("load_detail");
        let con_os = parseFloat(getValues("con_qty")) - usedQty.current;
        console.log(getValues("con_qty"));
        console.log(usedQty.current);
        console.log(con_os);
        let currentTotal = 0;
        plansData.forEach(item => {
            currentTotal += parseFloat(
                item.planned_qty !== "" ? item.planned_qty.replace(/,/g, "") : 0
            );
        });
        let newRemaining = con_os - currentTotal;
        if (newRemaining < 0) {
            toast.error("Planning Quantity exceed remaining quantity");
            setExceed(true);
        } else {
            setRemaining(newRemaining);
            setExceed(false);
        }
    };

    const handleCheckedMulti = (index, isChecked) => {
        let newCheckBoxState = [...checkedMulti];
        if (!isChecked) {
            setValue(`load_detail.${index}.relate_do`, []);
        }
        newCheckBoxState[index] = isChecked;
        setCheckedMulti(newCheckBoxState);
    };

    const isSelectEnabled = index => {
        // console.log(checkedMulti);
        return !checkedMulti[index];
    };

    return (
        <>
            <Toaster />
            <Typography variant="h4">
                WB Purchase Loading Note Registration Form
            </Typography>
            <br />
            <form
                onKeyDown={e => checkKeyDown(e)}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    width: "100%",
                }}
                onSubmit={handleSubmit(submitItem)}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            marginBottom: "3rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                        }}
                    >
                        <Typography variant="h5">Detail Order</Typography>
                        <Divider sx={{ my: 3 }} />
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <AutocompleteComp
                                control={control}
                                name="relate_cust"
                                label="Customer"
                                options={relate_cust_op}
                                sx={{ width: "30rem" }}
                            />
                            <SelectPOComp
                                control={control}
                                name="po_num"
                                label="PO Number"
                                preop={preOp}
                                cust_id={watch("relate_cust")?.value ?? ""}
                            />
                            <LoadingButton
                                onClick={() => {
                                    console.log(getValues("po_num"));
                                    handleCheckSO(getValues("po_num"));
                                }}
                                loading={isLoading}
                                sx={{ height: "2rem" }}
                            >
                                Check Payment
                            </LoadingButton>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                width: "100%",
                                gap: "1rem",
                                flexWrap: "wrap",
                            }}
                        >
                            <AutoCompleteVCont
                                name="vendor"
                                label="Vendor"
                                control={control}
                                options={ven_op}
                                sx={{ width: "30rem" }}
                            />
                            <TextFieldComp
                                name="material"
                                label="Material"
                                control={control}
                                disabled
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                            />
                            <TextFieldComp
                                name="description"
                                label="Description"
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                                control={control}
                                disabled
                            />
                            {/* <TextFieldComp
                                name="con_qty"
                                label="Contract Quantity"
                                control={control}
                                disabled
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                            /> */}
                            <NumericFieldComp
                                name="con_qty"
                                label="Contract Quantity"
                                control={control}
                                rules={{
                                    required: "Please Insert",
                                    min: {
                                        value: 1,
                                        message: "Minimum value is 0",
                                    },
                                }}
                                sx={{
                                    minWidth: "15rem",
                                    maxWidth: "16rem",
                                }}
                                endAdornment={
                                    <InputAdornment>{uomQty}</InputAdornment>
                                }
                                thousandSeparator
                                disabled
                            />
                            <NumericFieldComp
                                name="os_wb_qty"
                                label="O/S WB Quantity"
                                control={control}
                                sx={{
                                    minWidth: "15rem",
                                    maxWidth: "16rem",
                                }}
                                endAdornment={
                                    <InputAdornment>{uomQty}</InputAdornment>
                                }
                                thousandSeparator
                                disabled={true}
                            />
                            <NumericFieldComp
                                name="os_qty"
                                label="O/S WEB Quantity"
                                control={control}
                                rules={{
                                    required: "Please Insert",
                                    min: {
                                        value: 1,
                                        message: "Minimum value is 0",
                                    },
                                }}
                                sx={{
                                    minWidth: "15rem",
                                    maxWidth: "16rem",
                                }}
                                endAdornment={
                                    <InputAdornment>{uomQty}</InputAdornment>
                                }
                                thousandSeparator
                                disabled={true}
                            />
                            <TextFieldComp
                                name="uom"
                                label="Unit of Measure"
                                control={control}
                                disabled
                                sx={{ minWidth: "10rem", maxWidth: "10rem" }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                width: "100%",
                                gap: "1rem",
                            }}
                        >
                            <TextFieldComp
                                name="company"
                                label="Company"
                                sx={{ minWidth: "10rem", maxWidth: "10rem" }}
                                control={control}
                                disabled
                                rules={{ required: true }}
                            />
                            <TextFieldComp
                                name="plant"
                                label="Plant"
                                sx={{ minWidth: "10rem", maxWidth: "10rem" }}
                                control={control}
                                disabled
                                rules={{ required: true }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                width: "100%",
                                gap: "1rem",
                            }}
                        >
                            <DatePickerComp
                                name="create_date"
                                label="Tanggal Request"
                                control={control}
                                sx={{
                                    minWidth: "15rem",
                                }}
                                minDate={moment()}
                                disabled
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <Typography variant="h5">
                            Data Supir dan Truck
                        </Typography>
                        <Button
                            onClick={() => {
                                append({
                                    vehicle: null,
                                    driver: null,
                                    loading_date: moment().add(1, "day"),
                                    planned_qty: "",
                                    media_tp: "T",
                                    relate_do: [],
                                    remark: "",
                                });
                                let newCheckBoxState = [...checkedMulti];
                                newCheckBoxState.push(false);
                                setCheckedMulti(newCheckBoxState);
                            }}
                            // disabled={!isPaid}
                            variant="contained"
                        >
                            Add +
                        </Button>
                        <NumericFormat
                            value={remainingQty}
                            label="Remaining Quantity WEB"
                            customInput={TextField}
                            thousandSeparator
                            disabled
                        />
                    </div>
                    {errors?.load_detail && (
                        <p style={{ color: theme.palette.error.main }}>
                            Tambahkan data supir dan truck
                        </p>
                    )}

                    <Divider sx={{ my: 3 }} variant="middle" />
                    {fields.map((field, index) => {
                        return (
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyItems: "stretch",
                                        alignContent: "center",
                                        flexWrap: "wrap",
                                    }}
                                    key={field.id}
                                >
                                    <input
                                        {...register(
                                            `load_detail.${index}.id_detail`
                                        )}
                                        hidden
                                    />
                                    <input
                                        {...register(
                                            `load_detail.${index}.method`
                                        )}
                                        hidden
                                    />
                                    <div
                                        style={{
                                            marginBottom: "3rem",
                                            minWidth: "60%",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "1rem",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <AutoSelectDriver
                                                label="Driver"
                                                name={`load_detail.${index}.driver`}
                                                control={control}
                                                sx={{
                                                    minWidth: "30rem",
                                                    maxWidth: "20rem",
                                                }}
                                                rules={{
                                                    validate: v =>
                                                        v?.value !== "" &&
                                                        v !== null,
                                                }}
                                            />
                                            <AutoSelectVehicle
                                                label="Vehicle"
                                                name={`load_detail.${index}.vehicle`}
                                                control={control}
                                                sx={{
                                                    minWidth: "10rem",
                                                    maxWidth: "15rem",
                                                }}
                                                rules={{
                                                    validate: v =>
                                                        v?.value !== "" &&
                                                        v !== null,
                                                }}
                                            />
                                            <SelectComp
                                                name={`load_detail.${index}.media_tp`}
                                                label="Media Transport"
                                                control={control}
                                                fullWidth
                                                sx={{
                                                    minWidth: "10rem",
                                                    maxWidth: "12rem",
                                                }}
                                                rules={{
                                                    required: "Please Insert",
                                                }}
                                                options={medtpOP}
                                            />
                                            <DatePickerComp
                                                name={`load_detail.${index}.loading_date`}
                                                label="Tanggal Pengambilan / Muat"
                                                control={control}
                                                rules={{
                                                    required: "Please Insert",
                                                }}
                                                sx={{
                                                    minWidth: "15rem",
                                                }}
                                                minDate={moment()}
                                            />
                                            <NumericFieldComp
                                                name={`load_detail.${index}.planned_qty`}
                                                label="Planned Loading Qty"
                                                control={control}
                                                rules={{
                                                    required: "Please Insert",
                                                    min: {
                                                        value: 1,
                                                        message:
                                                            "Minimum value is 0",
                                                    },
                                                }}
                                                sx={{
                                                    minWidth: "15rem",
                                                    maxWidth: "16rem",
                                                }}
                                                endAdornment={
                                                    <InputAdornment>
                                                        {getValues("uom")}
                                                    </InputAdornment>
                                                }
                                                onBlurOvr={checkExistingOsQty}
                                                thousandSeparator
                                            />
                                            <TextFieldComp
                                                name={`load_detail.${index}.remark`}
                                                label="Remark"
                                                control={control}
                                                sx={{
                                                    minWidth: "20rem",
                                                }}
                                                rules={{
                                                    maxLength: {
                                                        value: 500,
                                                        message:
                                                            "Max 500 Character",
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <IconButton
                                        sx={{
                                            width: "4rem",
                                            height: "4rem",
                                        }}
                                        onClick={() => {
                                            if (
                                                field.id_detail !== "" &&
                                                field.id_detail !== undefined
                                            ) {
                                                if (
                                                    getValues(
                                                        `load_detail.${index}.method`
                                                    ) === "delete"
                                                ) {
                                                    setValue(
                                                        `load_detail.${index}.method`,
                                                        ""
                                                    );
                                                } else {
                                                    setValue(
                                                        `load_detail.${index}.method`,
                                                        "delete"
                                                    );
                                                }
                                            } else {
                                                remove(index);
                                                checkExistingOsQty();
                                                // console.log(index);
                                                const newCheckBoxState = [
                                                    ...checkedMulti,
                                                ];
                                                // console.log(
                                                //     newCheckBoxState
                                                // );
                                                if (
                                                    newCheckBoxState.length <= 0
                                                ) {
                                                    newCheckBoxState.pop();
                                                } else {
                                                    newCheckBoxState.splice(
                                                        index,
                                                        1
                                                    );
                                                }
                                                // console.log(
                                                //     newCheckBoxState
                                                // );
                                                setCheckedMulti(
                                                    newCheckBoxState
                                                );
                                            }
                                            setClick(!click);
                                        }}
                                        variant="contained"
                                        color={
                                            getValues(
                                                `load_detail.${index}.method`
                                            ) === "delete"
                                                ? "warning"
                                                : "error"
                                        }
                                    >
                                        {getValues(
                                            `load_detail.${index}.method`
                                        ) === "delete" ? (
                                            <Replay
                                                sx={{
                                                    width: "2rem",
                                                    height: "2rem",
                                                }}
                                            ></Replay>
                                        ) : (
                                            <Cancel
                                                sx={{
                                                    width: "2rem",
                                                    height: "2rem",
                                                }}
                                            ></Cancel>
                                        )}
                                    </IconButton>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {(curAuth.current.fcreate || curAuth.current.fupdate) &&
                    position.current !== "END" && (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    padding: "2rem",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <LoadingButton
                                    loading={isLoading}
                                    disabled={isExceed}
                                    type="submit"
                                >
                                    Submit
                                </LoadingButton>
                            </div>
                        </>
                    )}
            </form>
        </>
    );
}
