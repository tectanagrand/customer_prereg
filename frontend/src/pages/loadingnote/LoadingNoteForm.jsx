import { useForm } from "react-hook-form";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import AutoSelectDriver from "./AutoselectDriver";
import { Typography, Divider } from "@mui/material";
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

const SLOCOP = [
    { value: "FT51", label: "FT51 - Fractionation 1" },
    { value: "RT51", label: "RT51 - Refinery 1 (KB)" },
    { value: "TS02", label: "TS02 - Trf. via Ship" },
    { value: "TW01", label: "TW01 - Tank Whs (NKB)" },
    { value: "TW51", label: "TW51 - Tank Whs (KB)" },
    { value: "WH01", label: "WH01 - C.Pack Whs (NKB)" },
    { value: "WH51", label: "WH51 - C.Pack Whs (KB)" },
];

export default function LoadingNoteForm() {
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };

    const [searchParams] = useSearchParams();
    const [slocOP, setSloc] = useState([]);
    const navigate = useNavigate();
    const { session, getPermission } = useSession();
    const curAuth = useRef({});
    const {
        control,
        getValues,
        reset,
        setValue,
        handleSubmit,
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
            os_deliv: "0",
            plant: "",
            description: "",
            uom: "",
            vehicle: null,
            driver: null,
            loading_date: moment(),
            planned_qty: 0,
            fac_plant: "",
            fac_store_loc: "",
            fac_batch: "",
            fac_val_type: "",
            oth_plant: "",
            oth_store_loc: "",
            oth_batch: "",
            oth_val_type: "",
            media_tp: "",
            company: "",
        },
    });
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
                    reset({
                        do_num: data.id_do,
                        inv_type: data.inv_type,
                        inv_type_tol_from: data.inv_tol_from + " %",
                        inv_type_tol_to: data.inv_tol_to + " %",
                        incoterms: data.incoterms_1 + "-" + data.incoterms_2,
                        rules: data.item_rule,
                        con_num: data.con_num,
                        material: data.material_code,
                        os_deliv: data.os_deliv,
                        plant: data.plant,
                        description: data.description,
                        uom: data.uom,
                        vehicle: data.vhcl_num
                            ? { value: data.vhcl_num, label: data.vhcl_num }
                            : { value: "", label: "" },
                        driver: data.driver_id
                            ? {
                                  value: data.driver_id,
                                  label:
                                      data.driver_id + " - " + data.driver_name,
                              }
                            : { value: "", label: "" },
                        loading_date: moment(data.created_date),
                        planned_qty: data.pl_load_qty,
                        fac_plant: data.factory_plt,
                        fac_store_loc: data.factory_sloc,
                        fac_batch: data.factory_batch,
                        fac_val_type: data.factory_valtype,
                        oth_plant: data.oth_factory_plt,
                        oth_store_loc: data.oth_factory_sloc,
                        oth_batch: data.oth_party_batch,
                        oth_val_type: data.oth_factory_valtype,
                        media_tp: data.media_tp,
                        company: data.company_code,
                    });
                    uuidLN.current = data.uuid;
                    position.current = data.cur_pos;
                    setPaid(data.is_paid);
                    const { data: slocList } = await Axios.get(
                        "ln/sloc?plant=" + data.plant
                    );
                    setSloc(slocList);
                    if (data.cur_pos === "INIT") {
                        curAuth.current = getPermission("Initial Form");
                    } else if (data.cur_pos === "FINA") {
                        curAuth.current = getPermission("Final Form");
                    } else {
                        curAuth.current = getPermission("Initial Form");
                    }
                    console.log(curAuth.current);
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

    const submitItem = async (values, is_draft = false) => {
        let method = "";
        if (typeof is_draft !== "boolean") {
            is_draft = false;
        }
        if (uuidLN.current !== "") {
            method = "update";
        } else {
            method = "insert";
        }
        const payload = {
            ...values,
            driver: values.driver ? values.driver.value : "",
            driver_name: values.driver
                ? values.driver.label.split("-")[1].trim()
                : "",
            vehicle: values.vehicle ? values.vehicle.value : "",
            inv_type_tol_from: values.inv_type_tol_from.replace("%", "").trim(),
            inv_type_tol_to: values.inv_type_tol_to.replace("%", "").trim(),
            incoterms_1: values.incoterms.split("-")[0],
            incoterms_2: values.incoterms.split("-")[1],
            loading_date: moment(values.loading_date).format("YYYY-MM-DD"),
            is_paid: isPaid,
            is_draft: is_draft,
            method: method,
            uuid: uuidLN.current,
            company_code: values.company,
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
                uuidLN.current = data.uuid;
                toast.success(data.message);
            }
            setTimeout(() => {
                navigate("/dashboard/loadingnote");
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
                os_deliv: slip.KWMENG,
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
                "ln/sloc?plant=" + dataMap.plant
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
                os_deliv: "",
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
                            <TextFieldComp
                                name="do_num"
                                label="DO Number"
                                control={control}
                                sx={{ mb: 3, mr: 3, width: "30vw" }}
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
                                name="os_deliv"
                                label="OS Delivery Order"
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
                            justifyItems: "stretch",
                            flexWrap: "wrap",
                        }}
                    >
                        <div style={{ marginBottom: "3rem", minWidth: "60%" }}>
                            <Typography variant="h5">Transporter</Typography>
                            <Divider sx={{ my: 3 }} variant="middle" />
                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                }}
                            >
                                <AutoSelectDriver
                                    label="Driver"
                                    name="driver"
                                    control={control}
                                    sx={{
                                        minWidth: "10rem",
                                        maxWidth: "30rem",
                                    }}
                                    rules={{
                                        validate: v =>
                                            v.value !== "" && v !== null,
                                    }}
                                />
                                <AutoSelectVehicle
                                    label="Vehicle"
                                    name="vehicle"
                                    control={control}
                                    sx={{
                                        minWidth: "10rem",
                                        maxWidth: "15rem",
                                    }}
                                    rules={{
                                        validate: v =>
                                            v.value !== "" && v !== null,
                                    }}
                                />
                                <SelectComp
                                    name="media_tp"
                                    label="Media Transport"
                                    control={control}
                                    sx={{
                                        minWidth: "10rem",
                                        maxWidth: "15rem",
                                    }}
                                    rules={{ required: "Please Insert" }}
                                    options={MediaTransportOp}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: "3rem", minWidth: "20%" }}>
                            <Typography variant="h5">
                                Loading Note Detail
                            </Typography>
                            <Divider sx={{ my: 3 }} />
                            <div
                                style={{
                                    display: "flex",
                                    width: "100%",
                                    gap: "1rem",
                                }}
                            >
                                <DatePickerComp
                                    name="loading_date"
                                    label="Loading Date"
                                    control={control}
                                    rules={{ required: "Please Insert" }}
                                />
                                <TextFieldComp
                                    name="planned_qty"
                                    label="Planned Loading Qty"
                                    control={control}
                                    rules={{
                                        required: "Please Insert",
                                        min: {
                                            value: 1,
                                            message: "Please Insert",
                                        },
                                    }}
                                    sx={{
                                        minWidth: "10rem",
                                        maxWidth: "20rem",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
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
