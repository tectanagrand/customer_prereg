import { useForm, useFieldArray } from "react-hook-form";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import AutoSelectDriver from "./AutoselectDriver";
import {
    Typography,
    Divider,
    Button,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { Cancel, Replay } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import AutoSelectVehicle from "./AutoselectVehicle";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useRef, useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import SelectComp from "../../component/input/SelectComp";
import { NumericFormat } from "react-number-format";
import { TextField } from "@mui/material";
import DatePickerComp from "../../component/input/DatePickerComp";
import NumericFieldComp from "../../component/input/NumericFieldComp";
import moment from "moment";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSession } from "../../provider/sessionProvider";
import SelectDOFRCComp from "./SelectDOFRCComp";
import SelectMultiDOComp from "./SelectMultiDoComp";
import { useTheme } from "@mui/material/styles";
import CheckBoxComp from "../../component/input/CheckBoxComp";

const MediaTransportOp = [
    { value: "V", label: "Vessel" },
    { value: "T", label: "Truck" },
    { value: "R", label: "Railway" },
    { value: "P", label: "Ponton" },
    { value: "L", label: "Pipe Line" },
    { value: "E", label: "Paper Trade" },
    { value: "A", label: "Airplane" },
    { value: "W", label: "Waterway" },
];

const ValuationTypeOp = [
    { value: "TR-SALES", label: "TR-SALES" },
    { value: "LIQD", label: "LIQD" },
    { value: "IN-TS02", label: "IN-TS02" },
    { value: "IN-TS03", label: "IN-TS03" },
    { value: "1011100444", label: "1011100444" },
    { value: "IN-VS51", label: "IN-VS51" },
    { value: "TR-SALES2", label: "TR-SALES2" },
];

export default function LoadingNoteFormFRC() {
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    const axiosPrivate = useAxiosPrivate();
    const [searchParams] = useSearchParams();
    const [click, setClick] = useState(false);
    const [slocOP, setSloc] = useState([]);
    const [medtpOP, setMedTPOP] = useState([]);
    const [checkedMulti, setCheckedMulti] = useState([]);
    const [uomQty, setUomQty] = useState("Kg");
    const [preOp, setPreOp] = useState(null);
    const [pltRule, setPltRule] = useState({ plant: "", material: "" });
    const lastIdx = useRef(0);
    const [do_num, _setDONum] = useState("");
    const navigate = useNavigate();
    const { session, getPermission } = useSession();
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
            do_num: "",
            sto_num: "",
            trans_type: "",
            inv_type: "",
            inv_type_tol_from: "0 %",
            inv_type_tol_to: "0 %",
            incoterms: "",
            rules: "",
            con_num: "",
            material: "",
            con_qty: 0,
            os_qty: 0,
            plant: "",
            description: "",
            uom: "",
            load_detail: [],
            fac_plant: "",
            fac_store_loc: "",
            fac_batch: "",
            fac_val_type: "",
            oth_plant: "",
            oth_store_loc: "",
            oth_batch: "",
            oth_val_type: "",
            company: "",
        },
    });
    const { fields, append, remove } = useFieldArray({
        name: "load_detail",
        control,
        rules: { required: "Insert data" },
    });
    watch("load_detail.method");
    watch("load_detail.id_detail");
    const [isLoading, setLoading] = useState(false);
    const [isPaid, setPaid] = useState(false);
    const [isExceed, setExceed] = useState(false);
    const usedQty = useRef(0);
    const [remainingQty, setRemaining] = useState(0);
    const position = useRef("");
    const uuidLN = useRef("");
    const theme = useTheme();
    useEffect(() => {
        (async () => {
            try {
                const idloadnote = searchParams.get("idloadnote");
                if (idloadnote) {
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
                    setRemaining(
                        parseFloat(data.data.os_qty) -
                            parseFloat(data.data.plan_qty_con)
                    );
                    usedQty.current = parseFloat(data.data.totalspend);
                    reset({
                        ...data.data,
                        con_qty: data.data.con_qty,
                        load_detail: load_detail,
                    });
                    setPreOp(data.data.do_num);
                    uuidLN.current = data.id_header;
                    position.current = data.cur_pos;
                    setPltRule({
                        plant: data.data.plant,
                        rule: data.data.material,
                    });
                    setPaid(data.is_paid);
                    // const { data: slocList } = await Axios.get(
                    //     "ln/sloc?plant=" + data.plant
                    // );
                    // setSloc(slocList);
                    if (data.cur_pos === "INIT") {
                        curAuth.current = getPermission("Initial Form");
                    } else if (data.cur_pos === "FINA") {
                        curAuth.current = getPermission("Final Form");
                    } else {
                        curAuth.current = getPermission("Initial Form");
                    }
                    lastIdx.current =
                        load_detail.length !== 0 ? load_detail.length : 0;
                } else {
                    curAuth.current = {
                        fcreate: true,
                        fread: true,
                        fupdate: true,
                        fdelete: true,
                    };
                }
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const { data } = await axiosPrivate.get(
                `master/sloc?plant=${pltRule.plant}&material=${pltRule.material}`
            );
            setSloc(data.sloc);
        })();
    }, [pltRule]);

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

    const setDONum = value => {
        _setDONum(value);
    };

    const submitItem = async (values, is_draft = false) => {
        if (typeof is_draft !== "boolean") {
            is_draft = false;
        }
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
            inv_type_tol_from: values.inv_type_tol_from.replace("%", "").trim(),
            inv_type_tol_to: values.inv_type_tol_to.replace("%", "").trim(),
            incoterms_1: values.incoterms.split("-")[0],
            incoterms_2: values.incoterms.split("-")[1],
            is_paid: isPaid,
            is_draft: is_draft,
            id_header: uuidLN.current,
            company: values.company,
            load_detail: load_detail,
            con_qty:
                typeof values.con_qty === "string"
                    ? values.con_qty.replace(/,/g, "")
                    : values.con_qty,
        };
        delete payload.incoterms;
        setLoading(true);
        try {
            if (position.current === "FINA") {
                const { data } = await axiosPrivate.post(
                    "/ln/pushsap",
                    payload,
                    {
                        withCredentials: true,
                    }
                );
                toast.success(data.message);
            } else {
                const { data } = await axiosPrivate.post("/ln/save", payload, {
                    withCredentials: true,
                });
                toast.success(data.message);
                if (is_draft) {
                    uuidLN.current = data.id_header;
                    data.deleteIdx.forEach(item => {
                        remove(parseInt(item));
                    });
                    const detailId = new Map(data.detailId);
                    if (detailId.size !== 0) {
                        detailId.forEach((value, key) => {
                            setValue(`load_detail.${key}.id_detail`, value);
                        });
                    }
                }
            }
            if (!is_draft) {
                setTimeout(() => {
                    navigate("/dashboard/locofranco");
                }, 2000);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckSO = async value => {
        if (getValues("sto_num") === "") {
            toast.error("Please Provide STO Number");
            return;
        }
        setLoading(true);
        try {
            const { data } = await axiosPrivate.get(
                `/master/do?do_num=${value}`
            );
            const slip = data.SLIP;
            const dataMap = {
                do_num: value,
                inv_type: slip.ZZINVOICETYPE,
                inv_type_tol_from: slip.UEBTOINV + " %",
                inv_type_tol_to: slip.UNTTOINV + " %",
                incoterms: slip.INCO1 + "-" + slip.INCO2,
                rules: slip.ITEMRULE,
                con_num: slip.CTRNO,
                material: slip.MATNR,
                con_qty: slip.KWMENG,
                os_qty: slip.KWMENG - data.TOTALSPEND,
                plant: slip.WERKS,
                description: slip.MAKTX,
                uom: slip.VRKME,
                company: slip.WERKS.slice(0, 2),
                oth_plant: slip.WERKS,
                fac_plant: slip.WERKS,
                oth_batch: value,
            };
            setUomQty(slip.VRKME);
            setRemaining(slip.KWMENG - data.TOTALSPEND);
            usedQty.current = data.TOTALSPEND;
            Object.keys(getValues()).forEach(item => {
                if (dataMap.hasOwnProperty(item)) {
                    setValue(item, dataMap[item]);
                }
            });
            setPaid(data.IS_PAID);
            const { data: slocList } = await axiosPrivate.get(
                "master/sloc?plant=" +
                    dataMap.plant +
                    "&material=" +
                    dataMap.material
            );
            setSloc(slocList.sloc);
            // toast.success("Success retrieve SO");
            if (data.IS_PAID) {
                toast.success("Already paid, can proceed to logistic");
            } else {
                reset({
                    do_num: "",
                    sto_num: "",
                    inv_type: "",
                    inv_type_tol_from: "0 %",
                    inv_type_tol_to: "0 %",
                    incoterms: "",
                    rules: "",
                    con_num: "",
                    material: "",
                    con_qty: "0",
                    os_qty: "0",
                    plant: "",
                    description: "",
                    uom: "",
                    load_detail: [],
                    fac_plant: "",
                    fac_store_loc: "",
                    fac_batch: "",
                    fac_val_type: "",
                    oth_plant: "",
                    oth_store_loc: "",
                    oth_batch: "",
                    oth_val_type: "",
                    company: "",
                });
                toast.error("Not paid yet");
            }
        } catch (error) {
            console.log(error);
            const resetData = {
                do_num: "",
                sto_num: "",
                inv_type: "",
                inv_type_tol_from: "",
                inv_type_tol_to: "",
                incoterms: "",
                rules: "",
                con_num: "",
                material: "",
                con_qty: "",
                plant: "",
                batch: "",
                description: "",
            };
            Object.keys(resetData).forEach(item => {
                setValue(item, resetData[item]);
            });
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckSTO = async () => {
        setLoading(true);
        try {
            const { data, status } = await axiosPrivate.get(
                `/master/checkstolcfrc?sto=${getValues("sto_num")}`
            );
            if (status === 200) {
                toast.success("STO Number Exist");
                setValue("trans_type", data.ttype);
            } else {
                throw new Error("STO Not Found");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const checkExistingOsQty = () => {
        const plansData = getValues("load_detail");
        let con_os = parseFloat(getValues("con_qty")) - usedQty.current;
        // console.log(getValues("con_qty"));
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
                {session.role === "VENDOR" ? "Vendor" : "Customer "}{" "}
                {"FRANCO → LOCO"} Loading Note Registration Form
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
                        <div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <TextFieldComp
                                    control={control}
                                    label={"STO Number"}
                                    name="sto_num"
                                    sx={{ maxWidth: "17rem" }}
                                    toUpperCase={true}
                                />
                                <TextFieldComp
                                    control={control}
                                    label={"Trans. Type"}
                                    name="trans_type"
                                    sx={{ maxWidth: "10rem" }}
                                    toUpperCase={true}
                                    disabled
                                />
                                <LoadingButton
                                    onClick={() => handleCheckSTO()}
                                    loading={isLoading}
                                    sx={{ height: "2rem" }}
                                >
                                    Check STO
                                </LoadingButton>
                            </div>
                            <div style={{ display: "flex" }}>
                                {/* <SelectComp
                                    name="do_num"
                                    label="DO Number"
                                    fullWidth
                                    control={control}
                                    options={doOP}
                                    onOpen={() => getDataDO()}
                                    sx={{
                                        mb: 3,
                                        mr: 3,
                                        maxWidth: "16rem",
                                        minWidth: "10rem",
                                    }}
                                    lazy={true}
                                /> */}
                                <SelectDOFRCComp
                                    control={control}
                                    name="do_num"
                                    label="DO Number"
                                    preop={preOp}
                                    onChangeOvr={setDONum}
                                    getValue={getValues}
                                />
                                <LoadingButton
                                    onClick={() =>
                                        handleCheckSO(getValues("do_num"))
                                    }
                                    loading={isLoading}
                                    sx={{ height: "2rem" }}
                                >
                                    Check Payment
                                </LoadingButton>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                width: "100%",
                                gap: "1rem",
                                flexWrap: "wrap",
                            }}
                        >
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
                                name="os_qty"
                                label="O/S Quantity"
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
                            <TextFieldComp
                                name="con_num"
                                label="Contract Document"
                                control={control}
                                disabled
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                                rules={{ required: true }}
                            />
                            <TextFieldComp
                                name="incoterms"
                                label="Incoterms"
                                control={control}
                                disabled
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
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
                                });
                                let newCheckBoxState = [...checkedMulti];
                                newCheckBoxState.push(false);
                                setCheckedMulti(newCheckBoxState);
                            }}
                            disabled={!isPaid}
                            variant="contained"
                        >
                            Add +
                        </Button>
                        <NumericFormat
                            value={remainingQty}
                            label="Remaining Quantity"
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
                                                label="Tanggal Surat Jalan"
                                                control={control}
                                                rules={{
                                                    required: "Please Insert",
                                                }}
                                                sx={{
                                                    minWidth: "15rem",
                                                }}
                                                minDate={moment().add(1, "day")}
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
                                                        Kg
                                                    </InputAdornment>
                                                }
                                                onBlurOvr={checkExistingOsQty}
                                                thousandSeparator
                                            />
                                            <CheckBoxComp
                                                label="Multi Loading Note"
                                                control={control}
                                                name={`load_detail.${index}.is_multi`}
                                                index={index}
                                                onChangeOvr={handleCheckedMulti}
                                            />
                                            <SelectMultiDOComp
                                                label="Related DO"
                                                control={control}
                                                name={`load_detail.${index}.relate_do`}
                                                disabled={isSelectEnabled(
                                                    index
                                                )}
                                                preop={getValues(
                                                    `load_detail.${index}.relate_do`
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {index !== 0 && (
                                        <IconButton
                                            sx={{
                                                width: "4rem",
                                                height: "4rem",
                                            }}
                                            onClick={() => {
                                                if (
                                                    field.id_detail !== "" &&
                                                    field.id_detail !==
                                                        undefined
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
                                                        newCheckBoxState.length <=
                                                        0
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
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {curAuth.current.fread &&
                        ["FINA", "END"].includes(position.current) && (
                            <>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyItems: "stretch",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: "3rem",
                                            minWidth: "50%",
                                        }}
                                    >
                                        <Typography variant="h5">
                                            Factory Plant
                                        </Typography>
                                        <Divider
                                            sx={{ my: 3 }}
                                            variant="middle"
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "1rem",
                                                paddingRight: "1rem",
                                            }}
                                        >
                                            <TextFieldComp
                                                name="fac_plant"
                                                label="Factory Plant"
                                                control={control}
                                                toUpperCase={true}
                                            />
                                            <SelectComp
                                                name="fac_store_loc"
                                                label="Factory Store Location"
                                                control={control}
                                                options={slocOP}
                                            />
                                            <TextFieldComp
                                                name="fac_batch"
                                                label="Factory Batch"
                                                control={control}
                                                toUpperCase={true}
                                            />
                                            <SelectComp
                                                name="fac_val_type"
                                                label="Factory Valuation Type"
                                                control={control}
                                                options={ValuationTypeOp}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            marginBottom: "3rem",
                                            minWidth: "50%",
                                        }}
                                    >
                                        <Typography variant="h5">
                                            Other Party
                                        </Typography>
                                        <Divider
                                            sx={{ my: 3 }}
                                            variant="middle"
                                        />
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: "1rem",
                                            }}
                                        >
                                            <TextFieldComp
                                                name="oth_plant"
                                                label="Other Party Plant"
                                                control={control}
                                                toUpperCase={true}
                                            />
                                            <SelectComp
                                                name="oth_store_loc"
                                                label="Other Party Store Location"
                                                control={control}
                                                options={slocOP}
                                            />
                                            <TextFieldComp
                                                name="oth_batch"
                                                label="Other Party Batch"
                                                control={control}
                                                disabled
                                            />
                                            <SelectComp
                                                name="oth_val_type"
                                                label="Other Party Valuation Type"
                                                control={control}
                                                options={ValuationTypeOp}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
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
                                    disabled={!isPaid || isExceed}
                                    type="submit"
                                    // onClick={() =>
                                    //     submitItem(getValues(), false)
                                    // }
                                >
                                    Submit
                                </LoadingButton>
                                {/* <LoadingButton
                                    loading={isLoading}
                                    onClick={() =>
                                        submitItem(getValues(), true)
                                    }
                                >
                                    Save Draft
                                </LoadingButton> */}
                            </div>
                        </>
                    )}
            </form>
        </>
    );
}
