import { useForm, useFieldArray } from "react-hook-form";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import AutoSelectDriver from "./AutoselectDriver";
import { Typography, Divider, Button, IconButton } from "@mui/material";
import { Cancel, Replay } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import AutoSelectVehicle from "./AutoselectVehicle";
import { Axios } from "../../api/axios";
import { useRef, useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import SelectComp from "../../component/input/SelectComp";
import DatePickerComp from "../../component/input/DatePickerComp";
import moment from "moment";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSession } from "../../provider/sessionProvider";
import SelectDOComp from "./SelectDOComp";

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

export default function LoadingNoteForm() {
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };

    const [searchParams] = useSearchParams();
    const [click, setClick] = useState(false);
    const [slocOP, setSloc] = useState([]);
    const [medtpOP, setMedTPOP] = useState([]);
    const [preOp, setPreOp] = useState("");
    const [pltRule, setPltRule] = useState({ plant: "", rule: "" });
    const lastIdx = useRef(0);
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
            inv_type: "",
            inv_type_tol_from: "0 %",
            inv_type_tol_to: "0 %",
            incoterms: "",
            rules: "",
            con_num: "",
            material: "",
            con_qty: "0",
            plant: "",
            description: "",
            uom: "",
            load_detail: [
                {
                    id_detail: "",
                    vehicle: null,
                    driver: null,
                    loading_date: moment(),
                    planned_qty: 0,
                    media_tp: "",
                    method: "",
                },
            ],
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
    });
    watch("load_detail.method");
    watch("load_detail.id_detail");
    const [isLoading, setLoading] = useState(false);
    const [isPaid, setPaid] = useState(false);
    const position = useRef("");
    const uuidLN = useRef("");

    useEffect(() => {
        (async () => {
            try {
                const idloadnote = searchParams.get("idloadnote");
                if (idloadnote) {
                    const { data } = await Axios.get(
                        "ln/id?idloadnote=" + idloadnote
                    );
                    const load_detail = data.data.load_detail.map(item => ({
                        ...item,
                        loading_date: moment(item.loading_date),
                        method: "",
                    }));
                    reset({
                        ...data.data,
                        load_detail: load_detail,
                    });
                    setPreOp(data.data.do_num);
                    uuidLN.current = data.id_header;
                    position.current = data.cur_pos;
                    setPltRule({
                        plant: data.data.plant,
                        rule: data.data.rules,
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
            const { data } = await Axios.get(
                `master/sloc?plant=${pltRule.plant}&rule=${pltRule.rule}`
            );
            setSloc(data);
        })();
    }, [pltRule]);

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
            planned_qty: item.planned_qty,
            media_tp: item.media_tp,
            method: item.method,
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
        };
        delete payload.incoterms;
        setLoading(true);
        try {
            if (position.current === "FINA") {
                const { data } = await Axios.post("/ln/pushsap", payload, {
                    withCredentials: true,
                });
                toast.success(data.message);
            } else {
                const { data } = await Axios.post("/ln/save", payload, {
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
                    navigate("/dashboard/loadingnote");
                }, 2000);
            }
            if (deletedDet.current.length !== 0) {
                remove(deletedDet.current);
            }
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
            const { data } = await Axios.get(`/master/do?do_num=${value}`);
            const slip = data.SLIP;
            const dataMap = {
                do_num: value,
                inv_type: slip.ZZINVOICETYPE,
                inv_type_tol_from: slip.UEBTO_INV + " %",
                inv_type_tol_to: slip.UNTTO_INV + " %",
                incoterms: slip.INCO1 + " " + slip.INCO2,
                rules: slip.ITEMRULE,
                con_num: slip.CTRNO,
                material: slip.MATNR,
                con_qty: slip.KWMENG,
                plant: slip.WERKS,
                description: slip.MAKTX,
                uom: slip.VRKME,
                company: slip.WERKS.replace(/[0-9]/g, ""),
                oth_plant: slip.WERKS,
                fac_plant: slip.WERKS,
                oth_batch: value,
            };
            Object.keys(getValues()).forEach(item => {
                if (dataMap.hasOwnProperty(item)) {
                    setValue(item, dataMap[item]);
                }
            });
            setPaid(data.IS_PAID);
            const { data: slocList } = await Axios.get(
                "master/sloc?plant=" + dataMap.plant + "&rule=" + dataMap.rules
            );
            setSloc(slocList);
            toast.success("Success retrieve SO");
            if (data.IS_PAID) {
                toast.success("Already paid, can proceed to logistic");
            } else {
                toast.error("Not paid yet");
            }
        } catch (error) {
            console.log(error);
            const resetData = {
                do_num: "",
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

    return (
        <>
            <Toaster />
            <Typography variant="h4">
                Customer Loading Note Registration Form
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
                        <Typography variant="h5">Sales Order</Typography>
                        <Divider sx={{ my: 3 }} />
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
                            <SelectDOComp
                                control={control}
                                name="do_num"
                                label="DO Number"
                                preop={preOp}
                            />
                            <LoadingButton
                                onClick={() =>
                                    handleCheckSO(getValues("do_num"))
                                }
                                loading={isLoading}
                            >
                                Check Payment
                            </LoadingButton>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                width: "100%",
                                gap: "1rem",
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <TextFieldComp
                                name="inv_type"
                                label="Invoice Type"
                                control={control}
                                readOnly
                                sx={{ minWidth: "10rem", maxWidth: "30rem" }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <Typography sx={{ mb: 1, fontSize: "10pt" }}>
                                    Invoice Type Tolerance
                                </Typography>
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                    }}
                                >
                                    <TextFieldComp
                                        name="inv_type_tol_from"
                                        label="From"
                                        control={control}
                                        readOnly
                                        sx={{
                                            minWidth: "5rem",
                                            maxWidth: "10rem",
                                        }}
                                    />
                                    <p> - </p>
                                    <TextFieldComp
                                        name="inv_type_tol_to"
                                        label="To"
                                        control={control}
                                        readOnly
                                        sx={{
                                            minWidth: "5rem",
                                            maxWidth: "10rem",
                                        }}
                                    />
                                </div>
                            </div>
                            <TextFieldComp
                                name="incoterms"
                                label="Incoterms"
                                control={control}
                                readOnly
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                            />
                            <TextFieldComp
                                name="rules"
                                label="Rules"
                                control={control}
                                readOnly
                                sx={{ minWidth: "10rem", maxWidth: "10rem" }}
                            />
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
                                name="con_num"
                                label="Contract Document"
                                control={control}
                                readOnly
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                            />
                            <TextFieldComp
                                name="material"
                                label="Material"
                                control={control}
                                readOnly
                                sx={{ minWidth: "10rem", maxWidth: "30rem" }}
                            />
                            <TextFieldComp
                                name="con_qty"
                                label="Contract Quantity"
                                control={control}
                                readOnly
                                sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                            />
                            <TextFieldComp
                                name="uom"
                                label="Unit of Measure"
                                control={control}
                                readOnly
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
                                name="plant"
                                label="Plant"
                                sx={{ minWidth: "10rem", maxWidth: "10rem" }}
                                control={control}
                                readOnly
                            />
                            <TextFieldComp
                                name="company"
                                label="Company"
                                sx={{ minWidth: "10rem", maxWidth: "10rem" }}
                                control={control}
                                readOnly
                            />
                            <TextFieldComp
                                name="description"
                                label="Description"
                                sx={{ minWidth: "10rem", maxWidth: "40rem" }}
                                control={control}
                                rows={2}
                                multiline={true}
                                readOnly
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
                        <Typography variant="h5">Loading Detail</Typography>
                        <Button
                            onClick={() => {
                                append({
                                    vehicle: null,
                                    driver: null,
                                    loading_date: moment(),
                                    planned_qty: 0,
                                    media_tp: "",
                                });
                            }}
                            variant="contained"
                        >
                            Add +
                        </Button>
                    </div>

                    <Divider sx={{ my: 3 }} variant="middle" />
                    {fields.map((field, index) => {
                        return (
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
                                    {...register(`load_detail.${index}.method`)}
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
                                        }}
                                    >
                                        <AutoSelectDriver
                                            label="Driver"
                                            name={`load_detail.${index}.driver`}
                                            control={control}
                                            sx={{
                                                minWidth: "10rem",
                                                maxWidth: "30rem",
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
                                                maxWidth: "16rem",
                                            }}
                                            rules={{
                                                required: "Please Insert",
                                            }}
                                            options={MediaTransportOp}
                                        />
                                    </div>
                                </div>
                                <div
                                    style={{
                                        marginBottom: "3rem",
                                        minWidth: "20%",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            width: "100%",
                                            gap: "1rem",
                                        }}
                                    >
                                        <DatePickerComp
                                            name={`load_detail.${index}.loading_date`}
                                            label="Loading Date"
                                            control={control}
                                            rules={{
                                                required: "Please Insert",
                                            }}
                                        />
                                        <TextFieldComp
                                            name={`load_detail.${index}.planned_qty`}
                                            label="Planned Loading Qty"
                                            control={control}
                                            rules={{
                                                required: "Please Insert",
                                            }}
                                            sx={{
                                                minWidth: "10rem",
                                                maxWidth: "20rem",
                                            }}
                                        />
                                    </div>
                                </div>
                                {index !== 0 && (
                                    <IconButton
                                        sx={{ width: "4rem", height: "4rem" }}
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
                                                readOnly
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
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <LoadingButton
                                    loading={isLoading}
                                    disabled={!isPaid}
                                    type="submit"
                                    // onClick={() =>
                                    //     submitItem(getValues(), false)
                                    // }
                                >
                                    Submit
                                </LoadingButton>
                                <LoadingButton
                                    loading={isLoading}
                                    onClick={() =>
                                        submitItem(getValues(), true)
                                    }
                                >
                                    Save Draft
                                </LoadingButton>
                            </div>
                        </>
                    )}
            </form>
        </>
    );
}
