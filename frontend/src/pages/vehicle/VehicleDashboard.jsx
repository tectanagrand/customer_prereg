import { LoadingButton } from "@mui/lab";
import { UploadFile } from "@mui/icons-material";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PatternInputComp from "../../component/input/PatternInputTxt";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import TableVehicle from "../../component/table/TableVehicle";
import AutoSelectPlant from "../../component/input/AutoSelectPlant";
// import AutoSelectTransportir from "./AutoselectTransportir";

export default function VehicleDashboard() {
    const axiosPrivate = useAxiosPrivate();
    const [dialogOpen, setOpenDg] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const [id_row, setIdRow] = useState("");
    const [file, setFile] = useState();
    const [previewStnk, setPreviewstnk] = useState();
    const [plateVal, setPlate] = useState("");
    const [deleteDg, setDelDg] = useState(false);
    // const [plant, setPlant] = useState("");
    // console.log(plant);

    const {
        control,
        handleSubmit,
        register,
        setValue,
        reset,
        clearErrors,
        formState: { errors },
    } = useForm({
        defaultValues: {
            plate: "",
            filename: "",
            plant: null,
            // transportir: null,
        },
    });

    const parsingDataSTNK = stnk => {
        const ruleNum = /[0-9]/;
        const ruleAlp = /[A-Z]/;
        let resultSTNK = stnk.split("");
        for (let i = 0; i < resultSTNK.length; i++) {
            let element = resultSTNK[i];
            if (i >= 2 && i <= 5) {
                if (!ruleNum.test(element)) {
                    resultSTNK.splice(i, 0, " ");
                }
            } else {
                if (!ruleAlp.test(element)) {
                    resultSTNK.splice(i, 0, " ");
                }
            }
        }
        return resultSTNK.join("");
    };

    const EditData = async id => {
        try {
            const { data: fileData } = await axiosPrivate.get(
                `/file/filestnk?id=${id}`,
                {
                    responseType: "blob",
                }
            );
            const { data: dataStnk } = await axiosPrivate.get(
                `/file/stnk?id=${id}`
            );
            // Read additional data line by line
            setIdRow(id);
            reset({
                plate: parsingDataSTNK(dataStnk.vhcl_id.replace(/ /g, "")),
                filename: dataStnk.foto_stnk,
                plant: dataStnk.plant,
                // transportir: dataStnk.transportir,
            });

            setPlate(dataStnk.vhcl_id);
            // setPlant(dataStnk.plant);
            const blob = new File([fileData], dataStnk.foto_stnk, {
                type: "image/jpeg",
            });
            setFile(blob);
            setOpenDg(true);
            setRefresh(!refresh);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const openDelete = id => {
        setDelDg(true);
        setIdRow(id);
    };

    // const onChangePlant = value => {
    //     setPlant(value);
    // };

    const DeleteData = async id => {
        try {
            const { data } = await axiosPrivate.post("/file/deletestnk", {
                id: id,
            });
            toast.success(data.message);
            setRefresh(!refresh);
            setDelDg(false);
            setIdRow("");
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.response.data.message);
        }
    };

    const onChangePlateNum = value => {
        setPlate(
            value
                .replace(" ", "")
                .replace(/-/g, " ")
                .replace(/_/g, "")
                .toUpperCase()
        );
    };

    const uploadTempFile = e => {
        const files = e.target.files;
        setValue("filename", files[0].name);
        clearErrors("filename");
        setFile(files[0]);
    };

    const uploadFile = async values => {
        setLoading(true);
        let form = new FormData();
        form.append("file_atth", file, file.name);
        form.append(
            "plate_num",
            values.plate
                .replace(" ", "")
                .replace(/-/g, " ")
                .replace(/_/g, "")
                .toUpperCase()
        );
        form.append("plant", values.plant.value);
        // form.append("plant_name", values.plant.plant_name);
        // form.append("transportir", values.transportir.value);
        // form.append("tp_name", values.transportir.transporter_name);
        form.append("id_row", id_row);
        try {
            const { data } = await axiosPrivate.post("/file/stnk", form, {
                withCredentials: true,
            });
            onCloseModal();
            toast.success(data.message);
            setRefresh(!refresh);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const onCloseModal = () => {
        setPlate("");
        setFile();
        reset({
            plate: "",
            filename: "",
        });
        setOpenDg(false);
    };

    useEffect(() => {
        if (!file) {
            setPreviewstnk(undefined);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreviewstnk(objectUrl);

        // free memory when ever this component is unmounted
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return (
        <>
            <Toaster />
            <Typography variant="h4">Request Vehicle Registration</Typography>
            <Box
                sx={{
                    display: "flex",
                    margin: "1rem",
                    gap: "1rem",
                    maxWidth: "100%",
                    flexGrow: "1",
                }}
            >
                <TableVehicle
                    refresh={refresh}
                    editData={EditData}
                    deleteData={openDelete}
                />
                <Button
                    onClick={() => {
                        setOpenDg(true);
                        setFile();
                        setValue("plate", "");
                        setValue("filename", "");
                        setValue("plant", null);
                        setPlate("");
                    }}
                    sx={{ height: "4rem", width: "10rem" }}
                    variant="contained"
                >
                    New Vehicle
                </Button>
            </Box>

            <Dialog open={dialogOpen} fullWidth maxWidth="xl">
                <DialogTitle>
                    <Typography variant="h4">
                        Create New Vehicle Request
                    </Typography>
                </DialogTitle>
                <form onSubmit={handleSubmit(uploadFile)}>
                    <Box
                        sx={{
                            height: "40rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                            p: 6,
                            mb: 3,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                            }}
                        >
                            <AutoSelectPlant
                                label="Plant Target"
                                name="plant"
                                control={control}
                                sx={{ width: "20rem" }}
                                rules={{
                                    required: "Please input this field",
                                }}
                            />
                            <PatternInputComp
                                name="plate"
                                label="Nomor Plat"
                                control={control}
                                mask="AA-9999-AAA"
                                formatChars={{
                                    A: /[A-Za-z ]/,
                                    9: /[0-9 ]/,
                                }}
                                maskPlaceHolder={"_"}
                                onChangeovr={onChangePlateNum}
                                rules={{
                                    required: "Please insert plate number",
                                }}
                            />
                            <Typography variant="h6" sx={{ ml: 4 }}>
                                {plateVal}
                            </Typography>
                        </div>
                        {/* <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "1rem",
                            }}
                        >
                            <AutoSelectPlant
                                name="plant"
                                label={"Plant WBNET"}
                                control={control}
                                onControlChgOvr={onChangePlant}
                                rules={{ required: "Insert This Field" }}
                            />
                            <AutoSelectTransportir
                                name="transportir"
                                label="Transportir"
                                control={control}
                                plant={plant?.value ?? ""}
                                rules={{ required: "Insert this field" }}
                            />
                        </div> */}
                        <div>
                            <LoadingButton
                                component="label"
                                startIcon={<UploadFile />}
                                variant="outlined"
                                sx={{
                                    height: 50,
                                    minWidth: "15rem",
                                    margin: 1,
                                }}
                                onChange={uploadTempFile}
                                color={errors?.filename ? "error" : "primary"}
                            >
                                {"Upload File STNK"}
                                <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pneg"
                                    id="fileUpload"
                                    name="fileUpload"
                                    hidden
                                />
                            </LoadingButton>
                            <p
                                style={{
                                    color: "red",
                                    margin: "0 0 0 1rem",
                                    fontSize: "10pt",
                                }}
                            >
                                {`Format file : jpg, jpeg, png (Max size : 3mb)`}
                            </p>
                        </div>
                        <input
                            {...register("filename", {
                                required: "please attach foto stnk ",
                            })}
                            hidden
                        />
                        {errors.filename && (
                            <p style={{ color: "red" }}>
                                {errors.filename.message}
                            </p>
                        )}
                        <Typography>File Uploaded : {file?.name}</Typography>
                        {!file ? (
                            <Box
                                sx={{
                                    height: "20rem",
                                    minWidth: "40rem",
                                    border: "2px dashed black",
                                }}
                            ></Box>
                        ) : (
                            <Box
                                sx={{
                                    border: "2px solid black",
                                    overflow: "scroll",
                                    justifyContent: "center",
                                }}
                            >
                                <img src={previewStnk}></img>
                            </Box>
                        )}
                    </Box>
                    <DialogActions>
                        <Button
                            color="error"
                            variant="outlined"
                            onClick={() => {
                                onCloseModal();
                            }}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            type="submit"
                            loading={loading}
                            variant="contained"
                        >
                            Save
                        </LoadingButton>
                    </DialogActions>
                </form>
            </Dialog>
            <Dialog maxWidth="lg" open={deleteDg}>
                <Box sx={{ width: "40rem", height: "20rem", p: 10 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <Typography variant="h4">
                            Are you sure want to delete ?
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 5,
                            gap: 5,
                        }}
                    >
                        <Button
                            color="error"
                            variant="contained"
                            onClick={() => {
                                setDelDg(false);
                            }}
                        >
                            No
                        </Button>
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={() => {
                                DeleteData(id_row);
                            }}
                        >
                            Yes
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </>
    );
}
