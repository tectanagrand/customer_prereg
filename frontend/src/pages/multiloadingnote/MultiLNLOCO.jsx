import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import AutoSelectDriver from "../loadingnote/AutoselectDriver";
import AutoSelectVehicle from "../loadingnote/AutoselectVehicle";
import SelectComp from "../../component/input/SelectComp";
import SelectDOComp from "../loadingnote/SelectDOComp";
import { LoadingButton } from "@mui/lab";
import { useLoaderData, useNavigate } from "react-router-dom";
import { CheckKeyDownEnter } from "../../helper/checkkeydown";
import {
    Box,
    Button,
    Divider,
    IconButton,
    InputAdornment,
} from "@mui/material";
import { fetchMediaTp } from "../../hooks/useFetchMaster";
import moment from "moment";
import DatePickerComp from "../../component/input/DatePickerComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import NumericFieldComp from "../../component/input/NumericFieldComp";
import { DeleteOutline } from "@mui/icons-material";
import { axiosPrivate } from "../../api/axios";
import useTimeout from "../../hooks/useTimeout";
import { formatNumber } from "../../helper/formatting";

export default function MultiLNLOCO() {
    const navigate = useNavigate();
    const { setHookTimeout } = useTimeout();
    const [IsPaid, setIsPaid] = useState(false);
    const loaderdata = useLoaderData();
    const {
        mediaTp,
        loading: loading_medtp,
        error: error_medtp,
    } = fetchMediaTp();
    const CGRP = useMemo(() => loaderdata.CGRP, [loaderdata]);
    const {
        control,
        handleSubmit,
        watch,
        register,
        getValues,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            media_tp: "T",
            vehicle: null,
            driver: null,
            create_at: moment(),
            tanggal_surat_jalan: moment().add(1, "days"),
            requests: [],
        },
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        name: "requests",
        control: control,
        rules: {
            required: "Please create a request",
        },
    });

    const AddRequest = () => {
        append({
            is_paid: false,
            id_so: "",
            id_do: "",
            inv_type: "",
            tol_from: "",
            tol_to: "",
            inco_1: "",
            inco_2: "",
            rules: "",
            con_num: "",
            material: "",
            con_qty: 0,
            os_qty: 0,
            os_remaining: 0,
            os_sap_qty: 0,
            planned_qty: 0,
            plan_qty: 0,
            plant: "",
            description: "",
            uom: "",
            company: "",
            oth_plant: "",
            fac_plant: "",
            oth_batch: "",
            hold_qty: 0,
        });
    };

    const SubmitForm = async values => {
        let payload = {
            tanggal_surat_jalan:
                values.tanggal_surat_jalan.format("YYYY-MM-DD"),
            driver_id: values.driver ? values.driver.value : "",
            driver_name: values.driver
                ? values.driver.label.split("-")[1].trim()
                : "",
            vehicle_id: values.vehicle ? values.vehicle.value : "",
            media_tp: values.media_tp,
        };
        let requests_det = [];
        values.requests.forEach(det => {
            let payload_det = {
                id_do: det.id_do,
                id_so: det.id_so,
                id_sto: null,
                inco_1: det.inco_1,
                inco_2: det.inco_2,
                invoice_type: det.inv_type,
                tol_from: det.tol_from,
                tol_to: det.tol_to,
                rules: det.rules,
                con_num: det.con_num,
                material: det.material,
                desc_mat: det.description,
                con_qty: det.con_qty,
                uom: det.uom,
                plant: det.plant,
                company: det.company,
                is_paid: det.is_paid,
                trans_type: null,
                trg_cust: null,
                planned_qty: parseInt(det.plan_qty.replace(/,/g, "")),
                is_paid: det.is_paid,
                fac_plant: det.fac_plant,
                oth_plant: det.oth_plant,
                fac_batch: det.company,
                oth_batch: det.id_do,
            };
            requests_det.push(payload_det);
        });
        payload.requests = requests_det;
        try {
            const { data } = await axiosPrivate.post(`/multi/savedb`, payload);
            toast.success(data.message);
            setHookTimeout(() => {
                navigate("/dashboard/multilocodws");
            }, 2000);
        } catch (error) {
            console.error(error);
            if (error.response) {
                toast.error(error.response.data.message);
            } else {
                toast.error(error.message);
            }
        }
    };

    return (
        <>
            <Toaster />
            <h2>Customer Multi Loading Note LOCO Request Form</h2>
            <br />
            <form
                onKeyDown={e => CheckKeyDownEnter(e)}
                onSubmit={handleSubmit(SubmitForm)}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        width: "100%",
                        gap: 2,
                    }}
                >
                    <h2>Transporter</h2>
                    <Divider />
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <SelectComp
                            name={`media_tp`}
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
                            options={mediaTp}
                        />
                        <AutoSelectVehicle
                            label="Vehicle"
                            control={control}
                            name="vehicle"
                            sx={{
                                minWidth: "10rem",
                                maxWidth: "20rem",
                            }}
                            rules={{
                                validate: v => v?.value !== "" && v !== null,
                            }}
                        />
                        <AutoSelectDriver
                            label="Driver"
                            name={`driver`}
                            control={control}
                            sx={{
                                minWidth: "20em",
                                maxWidth: "30rem",
                            }}
                            rules={{
                                validate: v => v?.value !== "" && v !== null,
                            }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <DatePickerComp
                            control={control}
                            name="create_at"
                            label="Tanggal Pembuatan"
                            disabled
                            rules={{
                                required: "Please insert this field",
                            }}
                        />
                        <DatePickerComp
                            minDate={moment()}
                            control={control}
                            name="tanggal_surat_jalan"
                            label="Tanggal Loading"
                            rules={{
                                required: "Please insert this field",
                                validate: v => {
                                    return (
                                        v.isSameOrAfter(
                                            moment().format("YYYY-MM-DD")
                                        ) || "Back Date not allowed"
                                    );
                                },
                            }}
                        />
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <h2>Request Loading</h2>
                        <Button onClick={e => AddRequest()}>Add +</Button>
                    </Box>
                    <Divider />
                    {errors.requests && (
                        <p style={{ color: "red" }}>
                            {errors.requests?.root?.message}
                        </p>
                    )}
                    {fields.map((field, index) => {
                        return (
                            <RequestLoading
                                cgrp={CGRP}
                                control={control}
                                index={index}
                                setIsPaid={setIsPaid}
                                getValues={getValues}
                                setValue={setValue}
                                key={field.id}
                                // watch={watch}
                                remove={remove}
                                setError={setError}
                                register={register}
                            />
                        );
                    })}
                    <Divider />
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            m: 2,
                        }}
                    >
                        <LoadingButton
                            disabled={!IsPaid}
                            type="submit"
                            loading={isSubmitting}
                        >
                            Submit
                        </LoadingButton>
                    </Box>
                </Box>
            </form>
        </>
    );
}

const RequestLoading = ({
    cgrp,
    control,
    index,
    setIsPaid,
    getValues,
    setValue,
    remove,
    setError,
    register,
}) => {
    const [loading, setLoading] = useState(false);
    const axiosPrivate = useAxiosPrivate();
    const requests = useWatch({ control: control, name: `requests.${index}` });

    useEffect(() => {
        if (requests.plan_qty) {
            const os_remaining = getValues(`requests.${index}.os_qty`);
            const value = parseInt(
                getValues(`requests.${index}.plan_qty`).replace(/,/g, "")
            );
            setValue(`requests.${index}.os_remaining`, os_remaining - value);
        }
    }, [requests.plan_qty]);

    const onRemoveData = () => {
        let requestsData = getValues("requests");
        if (requestsData.length < 2) {
            setIsPaid(false);
            return;
        }
        for (let i = 0; i < requestsData.length; i++) {
            let checkIsPaid;
            checkIsPaid = requestsData[i].is_paid;
            setIsPaid(checkIsPaid);
            if (!checkIsPaid) {
                break;
            }
        }
    };

    const CheckPayment = async () => {
        let duplicateCount = 0;
        let requestsData = getValues("requests");
        let do_num = getValues(`requests.${index}.id_do`);
        requestsData.forEach(item => {
            if (item.id_do == do_num) {
                duplicateCount++;
            }
        });
        if (duplicateCount > 1) {
            setError(`requests.${index}.id_do`, {
                type: "duplicate",
                message: "Cannot request same DO in a request",
            });
            return;
        }
        setValue(`requests.${index}.plan_qty`, "");
        setLoading(true);
        try {
            const { data } = await axiosPrivate.get(
                `/master/do?do_num=${do_num}`
            );
            const slip = data.SLIP;
            const dataMap = {
                id_do: do_num,
                id_so: slip.VBELV,
                inv_type: slip.ZZINVOICETYPE,
                tol_from: slip.UEBTOINV + " %",
                tol_to: slip.UNTTOINV + " %",
                inco_1: slip.INCO1,
                inco_2: slip.INCO2,
                rules: slip.ITEMRULE,
                con_num: slip.CTRNO,
                material: slip.MATNR,
                con_qty: slip.KWMENG,
                os_qty: slip.KWMENG - data.TOTALSPEND,
                os_remaining: slip.KWMENG - data.TOTALSPEND,
                os_sap_qty: slip.KWMENG - data.TOTALSAP,
                plant: slip.WERKS,
                description: slip.MAKTX,
                uom: slip.VRKME,
                company: slip.WERKS.slice(0, 2),
                oth_plant: slip.WERKS,
                fac_plant: slip.WERKS,
                hold_qty: data.HOLDQTY,
            };
            if (!data.IS_PAID) {
                setValue(`requests.${index}.is_paid`, false);
                setIsPaid(false);
                toast.error(`${do_num} is not paid `);
                return;
            } else {
                setValue(`requests.${index}.is_paid`, true);
                setIsPaid(true);
            }
            Object.keys(dataMap).map(key => {
                setValue(`requests.${index}.${key}`, dataMap[key]);
            });

            return;
        } catch (error) {
            console.log(error);
            if (error.response) {
                toast.error(error.response.data.message);
            } else {
                toast.error(error.message);
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, my: 2 }}
            >
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <input {...register(`requests.${index}.is_paid`)} hidden />
                    <SelectDOComp
                        control={control}
                        name={`requests.${index}.id_do`}
                        label={"Nomor DO"}
                        type="LCO"
                        cgrp={cgrp}
                        rules={{
                            required: "Please insert this field",
                        }}
                    />
                    <LoadingButton
                        disabled={!requests.id_do}
                        onClick={e => CheckPayment()}
                        loading={loading}
                    >
                        Check
                    </LoadingButton>
                    <TextFieldComp
                        control={control}
                        name={`requests.${index}.company`}
                        label="Company"
                        sx={{ maxWidth: "8rem" }}
                        disabled
                    />
                    <TextFieldComp
                        control={control}
                        name={`requests.${index}.plant`}
                        label="Plant"
                        sx={{ maxWidth: "5rem" }}
                        disabled
                    />
                    <TextFieldComp
                        control={control}
                        name={`requests.${index}.material`}
                        label="Material"
                        sx={{ maxWidth: "10rem" }}
                        disabled
                    />
                    <TextFieldComp
                        control={control}
                        name={`requests.${index}.description`}
                        label="Mat. Desc."
                        sx={{ maxWidth: "20rem" }}
                        disabled
                    />
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 2,
                        width: "100%",
                    }}
                >
                    <NumericFieldComp
                        name={`requests.${index}.os_sap_qty`}
                        label="O/S SAP Quantity"
                        control={control}
                        sx={{
                            minWidth: "15rem",
                            maxWidth: "16rem",
                        }}
                        endAdornment={
                            <InputAdornment>
                                {getValues(`requests.${index}.uom`) ?? ""}
                            </InputAdornment>
                        }
                        thousandSeparator
                        disabled={true}
                    />
                    <NumericFieldComp
                        name={`requests.${index}.hold_qty`}
                        label="Holding Quantity"
                        control={control}
                        sx={{
                            minWidth: "15rem",
                            maxWidth: "16rem",
                        }}
                        endAdornment={
                            <InputAdornment>
                                {getValues(`requests.${index}.uom`) ?? ""}
                            </InputAdornment>
                        }
                        thousandSeparator
                        disabled={true}
                    />
                    <NumericFieldComp
                        name={`requests.${index}.os_qty`}
                        label="O/S Web Quantity"
                        control={control}
                        sx={{
                            minWidth: "15rem",
                            maxWidth: "16rem",
                        }}
                        endAdornment={
                            <InputAdornment>
                                {getValues(`requests.${index}.uom`) ?? ""}
                            </InputAdornment>
                        }
                        thousandSeparator
                        disabled={true}
                    />
                    <NumericFieldComp
                        name={`requests.${index}.os_remaining`}
                        label="Remaining Quantity"
                        control={control}
                        sx={{
                            minWidth: "15rem",
                            maxWidth: "16rem",
                        }}
                        endAdornment={
                            <InputAdornment>
                                {getValues(`requests.${index}.uom`) ?? ""}
                            </InputAdornment>
                        }
                        thousandSeparator
                        disabled={true}
                    />
                    <NumericFieldComp
                        name={`requests.${index}.plan_qty`}
                        label="Planning Quantity"
                        control={control}
                        sx={{
                            minWidth: "15rem",
                            maxWidth: "16rem",
                        }}
                        endAdornment={
                            <InputAdornment>
                                {getValues(`requests.${index}.uom`) ?? ""}
                            </InputAdornment>
                        }
                        thousandSeparator
                        disabled={!requests.id_do}
                        rules={{
                            required: "Please insert this field",
                            validate: {
                                quantityExceed: value => {
                                    const errormsg = "Value exceeding";
                                    const os_remaining = parseInt(
                                        requests.os_qty
                                    );
                                    return (
                                        parseInt(value.replace(/,/g, "")) <
                                            os_remaining || errormsg
                                    );
                                },
                                zeroQuantity: value => {
                                    return (
                                        parseInt(value) != 0 ||
                                        "Please set value above 0"
                                    );
                                },
                            },
                        }}
                    />
                </Box>
            </Box>
            <Box>
                <IconButton
                    onClick={e => {
                        onRemoveData();
                        remove(index);
                    }}
                >
                    <DeleteOutline />
                </IconButton>
            </Box>
        </Box>
    );
};
