import { useForm, useFieldArray, useWatch } from "react-hook-form";
import AutoSelectDriver from "../loadingnote/AutoselectDriver";
import AutoSelectVehicle from "../loadingnote/AutoselectVehicle";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useRef, useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import SelectComp from "../../component/input/SelectComp";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { NumericFormat } from "react-number-format";
import { Cancel } from "@mui/icons-material";
import {
    Box,
    TextField,
    Typography,
    Divider,
    InputAdornment,
    Button,
    IconButton,
} from "@mui/material";
import DatePickerComp from "../../component/input/DatePickerComp";
import NumericFieldComp from "../../component/input/NumericFieldComp";
import moment from "moment";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSession } from "../../provider/sessionProvider";
import SelectDOFRCComp from "../loadingnote/SelectDOFRCComp";
import SelectMultiDOComp from "../loadingnote/SelectMultiDoComp";
import { useTheme } from "@mui/material/styles";
import CheckBoxComp from "../../component/input/CheckBoxComp";
import { LoadingButton } from "@mui/lab";

export default function TollingRequest() {
    const navigate = useNavigate();
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };

    const axiosPrivate = useAxiosPrivate();

    const [searchParams] = useSearchParams();
    const [click, setClick] = useState(false);
    const [isExceed, setExceed] = useState(false);
    const [isAllow, setAllow] = useState(false);
    const [medtpOP, setMedTPOP] = useState([]);
    const [isLoading, setLoading] = useState(false);
    const [remainingQty, setRemaining] = useState(0);
    const usedQty = useRef(0);
    const uuidLN = useRef("");
    const timeoutId = useRef(null);

    const {
        control,
        getValues,
        reset,
        register,
        setValue,
        setError,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: {
            id_header: "",
            sto_num: "",
            material: "",
            material_code: "",
            con_qty: 0,
            os_qty: 0,
            os_wb_qty: 0,
            plant: "",
            company: "",
            uom: "",
            create_date: null,
            loading_date: null,
            load_detail: [],
        },
    });
    const { fields, append, remove } = useFieldArray({
        name: "load_detail",
        control,
        rules: { required: "Insert data" },
    });

    const position = useRef("");
    const data = useRef("");
    const curAuth = useRef({});
    const { getPermission } = useSession();

    const setSTONum = value => _setSTONum(value);
    const checkExistingOsQty = useCallback(() => {
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

    useEffect(() => {
        //fetch data by id
        try {
            const id = searchParams.get("idloadnote");
            (async () => {
                const { data: result } = await axiosPrivate.get(
                    "/tol/id?id=" + id
                );
                const data = result.data.header;
                reset({
                    id_header: data.hd_id,
                    sto_num: data.id_sto,
                    material: data.desc_con,
                    material_code: data.material,
                    plant: data.plant,
                    company: data.company,
                    con_qty: data.con_qty,
                    os_wb_qty: data.os_wb,
                    os_qty: data.os_qty,
                    uom: data.uom,
                    create_date: data.create_date,
                    loading_date: data.loading_date,
                    load_detail: result.data.load_detail.map(item => ({
                        id_detail: item.det_id,
                        vehicle: {
                            value: item.vhcl_id,
                            label: item.vhcl_id,
                        },
                        driver: {
                            value: item.driver_id,
                            label: item.driver_id + " - " + item.driver_name,
                        },
                        planned_qty: item.plan_qty,
                        media_tp: item.media_tp,
                        relate_do: item.multi_do,
                        is_multi: item.is_multi,
                        remark: item.remark_req,
                    })),
                });
                setAllow(true);
                setRemaining(data.os_qty);
            })();
        } catch (error) {
            console.error(toast.error(error.response.data.message));
        }
    }, []);

    useEffect(() => {
        if (data.cur_pos === "INIT") {
            curAuth.current = getPermission("Initial Form");
        } else if (data.cur_pos === "FINA") {
            curAuth.current = getPermission("Final Form");
        } else {
            curAuth.current = getPermission("Initial Form");
        }
    }, []);

    const getDataTolling = useCallback(async sto_num => {
        try {
            setLoading(true);
            const { data } = await axiosPrivate.get(
                `/tol/stotol?sto=${sto_num}`
            );
            const sto_data = data.data;
            const dataMap = {
                material_code: sto_data.Matcode,
                material: sto_data.Matdesc,
                con_qty: sto_data.Conqty,
                os_wb_qty: sto_data.OS,
                os_qty: sto_data.OS,
                uom: sto_data.UOM,
                plant: sto_data.Plant,
                company: sto_data.Company,
                create_date: moment(),
                loading_date: moment().add("days", 1),
            };
            Object.keys(dataMap).map(item => {
                setValue(item, dataMap[item]);
            });
            setRemaining(sto_data.OS);
            setAllow(true);
            usedQty.current = sto_data.UsedQty;
            return;
        } catch (error) {
            setAllow(false);
            console.error(error);
            toast.error(error.response.data.message);
            reset();
        } finally {
            setLoading(false);
        }
    }, []);

    const SubmitTollingRequest = useCallback(async value => {
        try {
            setLoading(true);
            const load_detail = value.load_detail.map(item => ({
                id_detail: item.id_detail,
                driver_id: item.driver.value,
                driver_name: item.driver.label.split("-")[1].trim(),
                vehicle: item.vehicle.value,
                media_tp: item.media_tp,
                planned_qty: parseInt(item.planned_qty.replace(/,/g, "")),
                loading_date: value.loading_date.format("YYYY-MM-DD"),
                is_multi: item.is_multi,
                multi_do: item.relate_do,
                remark: item.remark,
                method: item.method,
            }));
            const payload = {
                ...value,
                create_date: moment().format("YYYY-MM-DD"),
                load_detail: load_detail,
            };
            const { data } = await axiosPrivate.post("/tol/savetol", {
                payload: payload,
            });
            toast.success("Request Saved Successfully");
            const id = setTimeout(() => {
                navigate("/dashboard/tolling");
            }, 2000);
            timeoutId.current = id;
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message);
            const cause = error.response?.data?.cause;

            if (cause && cause.code === "IdenticTruck") {
                const value = getValues("load_detail");
                value.forEach((item, index) => {
                    console.log(item.vehicle.value);
                    if (cause.value.includes(item.vehicle.value)) {
                        setError(`load_detail.${index}.vehicle`, {
                            type: "identical",
                            message: "Truck Identical",
                        });
                    }
                });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    //clear timeout
    useEffect(() => {
        const timeoutClear = timeoutId.current;
        return () => {
            clearTimeout(timeoutClear);
        };
    }, []);

    return (
        <>
            <Toaster />
            <Typography variant="h4">Tolling Registration Form</Typography>
            <br />
            <form
                onKeyDown={checkKeyDown}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    width: "100%",
                }}
                onSubmit={handleSubmit(SubmitTollingRequest)}
            >
                <Typography variant="h5">Detail Order</Typography>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            marginBottom: "1rem",
                            alignItems: "center",
                        }}
                    >
                        <TextFieldComp
                            control={control}
                            label={"STO Number"}
                            name="sto_num"
                            sx={{ maxWidth: "17rem" }}
                            toUpperCase={true}
                            disabled={!!watch("id_header")}
                        />
                        <LoadingButton
                            onClick={e => {
                                getDataTolling(getValues("sto_num"));
                            }}
                            loading={isLoading}
                            sx={{ height: "2rem" }}
                            disabled={!!watch("id_header")}
                        >
                            Check STO
                        </LoadingButton>
                    </div>
                    <Box
                        sx={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}
                    >
                        <TextFieldComp
                            name="material_code"
                            label="Material"
                            control={control}
                            disabled
                            sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                        />
                        <TextFieldComp
                            name="material"
                            label="Material Name"
                            sx={{ minWidth: "10rem", maxWidth: "20rem" }}
                            control={control}
                            disabled
                        />
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
                                <InputAdornment>{watch("uom")}</InputAdornment>
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
                                <InputAdornment>{watch("uom")}</InputAdornment>
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
                                <InputAdornment>{watch("uom")}</InputAdornment>
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
                    </Box>
                    <Box sx={{ my: "1rem" }}>
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
                    </Box>
                    <Box
                        sx={{
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
                                    id_detail: "",
                                    vehicle: null,
                                    driver: null,
                                    media_tp: "T",
                                    remark: "",
                                    is_multi: false,
                                    relate_do: [],
                                    method: "",
                                });
                            }}
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
                    </Box>
                    <Divider sx={{ my: 3 }} variant="middle" />
                    <Box sx={{ mb: 3 }}>
                        <DatePickerComp
                            name="loading_date"
                            label="Tanggal Pengambilan / Muat"
                            control={control}
                            sx={{
                                minWidth: "15rem",
                            }}
                            rules={{ required: "Please insert this field" }}
                            minDate={moment()}
                        />
                    </Box>
                    {fields.map((field, index) => {
                        return (
                            <div
                                style={{ display: "flex", gap: "1rem" }}
                                key={field.id}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyItems: "stretch",
                                        alignContent: "center",
                                        flexWrap: "wrap",
                                    }}
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
                                            <CheckBoxComp
                                                label="Multi Loading Note"
                                                control={control}
                                                name={`load_detail.${index}.is_multi`}
                                                index={index}
                                            />
                                            <SelectMultiDOComp
                                                label="Related DO"
                                                control={control}
                                                name={`load_detail.${index}.relate_do`}
                                                disabled={
                                                    !watch("load_detail")[index]
                                                        .is_multi
                                                }
                                                preop={getValues(
                                                    `load_detail.${index}.relate_do`
                                                )}
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
                </Box>
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
                                    disabled={isExceed || !isAllow}
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
