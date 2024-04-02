import { LoadingButton } from "@mui/lab";
import { UploadFile } from "@mui/icons-material";
import PatternFieldComp from "../../component/input/PatternFieldComp";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Viewer } from "@react-pdf-viewer/core";
import PatternInputComp from "../../component/input/PatternInputTxt";
import { Axios } from "../../api/axios";
import toast, { Toaster } from "react-hot-toast";
import TableVehicle from "../../component/table/TableVehicle";

export default function VehicleDashboard() {
    const [dialogOpen, setOpenDg] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const [id_row, setIdRow] = useState("");
    const [file, setFile] = useState();
    const [plateVal, setPlate] = useState("");
    const { control, handleSubmit, register, setValue, reset } = useForm({
        defaultValues: {
            plate: "",
            filename: "",
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
            const { data: fileData } = await Axios.get(
                `/file/filestnk?id=${id}`,
                {
                    responseType: "blob",
                }
            );
            const { data: dataStnk } = await Axios.get(`/file/stnk?id=${id}`);
            // Read additional data line by line
            setIdRow(id);
            reset({
                plate: parsingDataSTNK(dataStnk.vhcl_id.replace(/ /g, "")),
                filename: dataStnk.foto_stnk,
            });

            setPlate(dataStnk.vhcl_id);
            const blob = new File([fileData], dataStnk.foto_stnk, {
                type: "application/pdf",
            });
            setFile(blob);
            setOpenDg(true);
            setRefresh(!refresh);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const DeleteData = async id => {
        if (confirm("Are you sure want to delete?")) {
            try {
                const { data } = await Axios.post("/file/deletestnk", {
                    id: id,
                });
                toast.success(data.message);
                setRefresh(!refresh);
            } catch (error) {
                console.error("Error:", error);
                toast.error(error.response.data.message);
            }
        }
    };

    const onChangePlateNum = value => {
        setPlate(value.replace(" ", "").replace(/-/g, " ").replace(/_/g, ""));
    };

    const uploadTempFile = e => {
        const files = e.target.files;
        setValue("filename", files[0].name);
        setFile(files[0]);
    };

    const uploadFile = async values => {
        setLoading(true);
        let form = new FormData();
        form.append("file_atth", file, file.name);
        form.append(
            "plate_num",
            values.plate.replace(" ", "").replace(/-/g, " ").replace(/_/g, "")
        );
        form.append("id_row", id_row);
        try {
            const { data } = await Axios.post("/file/stnk", form);
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

    return (
        <>
            <Toaster />
            <Typography variant="h4">Request Vehicle Registration</Typography>
            <div style={{ display: "flex", margin: "1rem", gap: "1rem" }}>
                <TableVehicle
                    refresh={refresh}
                    editData={EditData}
                    deleteData={DeleteData}
                />
                <Button
                    onClick={() => {
                        setOpenDg(true);
                        setFile();
                        setValue("plate", "");
                        setValue("filename", "");
                        setPlate("");
                    }}
                    sx={{ height: "4rem", width: "10rem" }}
                    variant="contained"
                >
                    New Vehicle
                </Button>
            </div>

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
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <PatternInputComp
                                name="plate"
                                label="Nomor Plat"
                                control={control}
                                mask="AA-9999-AAA"
                                formatChars={{
                                    A: /[A-Z ]/,
                                    9: /[0-9 ]/,
                                }}
                                maskPlaceHolder={"_"}
                                onChangeovr={onChangePlateNum}
                                rules={{ required: true }}
                            />
                            <Typography variant="h6" sx={{ ml: 4 }}>
                                {plateVal}
                            </Typography>
                        </div>
                        <LoadingButton
                            component="label"
                            startIcon={<UploadFile />}
                            variant="outlined"
                            sx={{ height: 50, minWidth: "15rem", margin: 1 }}
                            onChange={uploadTempFile}
                        >
                            Upload File STNK
                            <input
                                type="file"
                                accept=".pdf"
                                id="fileUpload"
                                name="fileUpload"
                                hidden
                            />
                        </LoadingButton>
                        <input
                            {...register("filename", { required: true })}
                            hidden
                        />
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
                                    height: "20rem",
                                    minWidth: "40rem",
                                    border: "2px solid black",
                                }}
                            >
                                <Viewer fileUrl={URL.createObjectURL(file)} />
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
        </>
    );
}
