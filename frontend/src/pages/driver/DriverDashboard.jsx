import { LoadingButton } from "@mui/lab";
import { Edit, UploadFile, InsertPhotoOutlined } from "@mui/icons-material";
import moment from "moment";
import AutocompleteComp from "../../component/input/AutocompleteComp";
import DatePickerComp from "../../component/input/DatePickerComp";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import PatternFieldComp from "../../component/input/PatternFieldComp";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    Box,
    Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Viewer } from "@react-pdf-viewer/core";
import PatternInputComp from "../../component/input/PatternInputTxt";
import { Axios } from "../../api/axios";
import toast, { Toaster } from "react-hot-toast";
import TableDriver from "../../component/table/TableDriver";
import { useTheme } from "@mui/material/styles";

export default function VehicleDashboard() {
    const [dialogOpen, setOpenDg] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();
    const [citiesOp, setCityop] = useState([]);
    const [id_row, setIdRow] = useState("");
    const [file, setFile] = useState();
    const [photo, setPhoto] = useState();
    const [preview, setPreview] = useState();
    const [previewSim, setPreviewSim] = useState();
    const [plateVal, setPlate] = useState("");
    const [deleteDg, setDelDg] = useState(false);
    const {
        control,
        handleSubmit,
        register,
        setValue,
        reset,
        formState: { errors },
        clearErrors,
    } = useForm({
        defaultValues: {
            nama: "",
            nomorsim: "",
            tempat_lahir: null,
            tanggal_lahir: null,
            no_telp: "",
            foto_sim: "",
            foto_supir: "",
            alamat: "",
        },
    });

    const EditData = async id => {
        try {
            const { data: fileData } = await Axios.get(
                `/file/filesim?id=${id}`,
                {
                    responseType: "blob",
                }
            );
            const { data: photoData } = await Axios.get(
                `/file/driverfoto?id=${id}`,
                {
                    responseType: "blob",
                }
            );
            const { data: dataSim } = await Axios.get(`/file/sim?id=${id}`);

            // Read additional data line by line
            setIdRow(id);
            reset({
                nama: dataSim.driver_name,
                nomorsim: dataSim.driver_id,
                tempat_lahir: {
                    value: dataSim.tempat_lahir,
                    label: dataSim.city,
                },
                tanggal_lahir: moment(dataSim.tanggal_lahir),
                no_telp: dataSim.no_telp,
                foto_sim: dataSim.foto_sim,
                alamat: dataSim.alamat,
            });
            const blob = new File([fileData], dataSim.foto_sim, {
                type: "application/pdf",
            });
            const blobDriver = new File([photoData], dataSim.foto_driver, {
                type: "application/pdf",
            });
            setFile(blob);
            setPhoto(blobDriver);
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

    const DeleteData = async id => {
        try {
            const { data } = await Axios.post("/file/deletesim", {
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

    const uploadTempFile = e => {
        const files = e.target.files;
        setValue("foto_sim", files[0].name);
        clearErrors("foto_sim");
        setFile(files[0]);
    };

    const uploadPhoto = e => {
        const files = e.target.files;
        console.log(files[0]);
        setValue("foto_supir", files[0].name);
        clearErrors("foto_supir");
        setPhoto(files[0]);
    };

    const uploadFile = async values => {
        setLoading(true);
        let form = new FormData();
        form.append("file_atth", file, file.name);
        form.append("foto_driver", photo, photo.name);
        form.append("nama", values.nama);
        form.append("nomorsim", values.nomorsim);
        form.append("tempat_lahir", values.tempat_lahir.value);
        form.append("no_telp", values.no_telp);
        form.append("tanggal_lahir", values.tanggal_lahir.format("MM-DD-YYYY"));
        form.append("alamat", values.alamat);
        form.append("id_row", id_row);
        try {
            const { data } = await Axios.post("/file/sim", form, {
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
        setIdRow("");
        setFile();
        setPhoto();
        reset({
            nama: "",
            nomorsim: "",
            tempat_lahir: null,
            tanggal_lahir: null,
            no_telp: "",
            foto_sim: "",
            alamat: "",
        });
        setOpenDg(false);
    };

    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get("/master/city");
                setCityop(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    useEffect(() => {
        if (!photo) {
            setPreview(undefined);
            return;
        }
        const objectUrl = URL.createObjectURL(photo);
        setPreview(objectUrl);

        // free memory when ever this component is unmounted
        return () => URL.revokeObjectURL(objectUrl);
    }, [photo]);

    useEffect(() => {
        if (!file) {
            setPreviewSim(undefined);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreviewSim(objectUrl);

        // free memory when ever this component is unmounted
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return (
        <>
            <Toaster />
            <Typography variant="h4">Request Vehicle Registration</Typography>
            <div style={{ display: "flex", margin: "1rem", gap: "1rem" }}>
                <TableDriver
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
                        setPlate("");
                    }}
                    sx={{ height: "4rem", width: "10rem" }}
                    variant="contained"
                >
                    New Driver
                </Button>
            </div>

            <Dialog open={dialogOpen} fullWidth maxWidth="xl">
                <DialogTitle>Create New Driver Request</DialogTitle>
                <form onSubmit={handleSubmit(uploadFile)}>
                    <Box
                        sx={{ display: "flex", justifyContent: "space-evenly" }}
                    >
                        {/* form field data supir */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                                p: 6,
                                mb: 3,
                                flexGrow: 1,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                }}
                            >
                                <TextFieldComp
                                    name="nama"
                                    label="Nama"
                                    control={control}
                                    sx={{ maxWidth: "30rem" }}
                                    rules={{
                                        required: "Please insert this field",
                                    }}
                                />
                                <PatternFieldComp
                                    name="nomorsim"
                                    label="Nomor SIM"
                                    control={control}
                                    rules={{
                                        required: "Please insert this field",
                                    }}
                                    format="####################"
                                    isNumString={false}
                                    sx={{ maxWidth: "25rem" }}
                                    fullWidth
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                }}
                            >
                                <AutocompleteComp
                                    name="tempat_lahir"
                                    label="Tempat Lahir"
                                    control={control}
                                    options={citiesOp}
                                    sx={{ maxWidth: "20rem" }}
                                    rules={{
                                        required: "Please insert this field",
                                    }}
                                />
                                <DatePickerComp
                                    name="tanggal_lahir"
                                    label="Tanggal Lahir"
                                    control={control}
                                    sx={{ maxWidth: "20rem" }}
                                    rules={{
                                        required: "Please insert this field",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                }}
                            >
                                <PatternFieldComp
                                    name="no_telp"
                                    label="Nomor Telfon"
                                    control={control}
                                    rules={{
                                        required: "Please insert this field",
                                    }}
                                    format="################"
                                    isNumString={false}
                                    sx={{ maxWidth: "20rem" }}
                                    fullWidth
                                />
                                <TextFieldComp
                                    name="alamat"
                                    label="Alamat"
                                    control={control}
                                    sx={{ maxWidth: "40rem" }}
                                    rules={{
                                        required: "Please insert this field",
                                    }}
                                />
                            </div>
                        </Box>
                        <Box sx={{ width: "20rem" }}>
                            <h4>Foto Supir</h4>
                            <Button
                                component="label"
                                disableRipple
                                sx={{
                                    minWidth: "15rem",
                                    height: "20rem",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    p: 2,
                                    borderColor:
                                        !photo && theme.palette.grey[800],
                                    borderWidth: !photo && "10px",
                                    borderStyle: !photo && "dashed",
                                }}
                                onChange={uploadPhoto}
                            >
                                {photo ? (
                                    <>
                                        <img
                                            style={{
                                                minWidth: "100%",
                                                height: "20rem",
                                            }}
                                            src={preview}
                                        ></img>
                                    </>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            width: "20rem",
                                        }}
                                    >
                                        <InsertPhotoOutlined
                                            sx={{
                                                width: "4rem",
                                                height: "4rem",
                                            }}
                                        />
                                        <Typography>
                                            Insert Driver Photo
                                        </Typography>
                                    </Box>
                                )}
                                <input
                                    type="file"
                                    accept=".jpg,.pneg,.jpeg,.png"
                                    hidden
                                />
                            </Button>
                            <input
                                {...register("foto_supir", {
                                    required: "Please attach foto supir ",
                                })}
                                hidden
                            />
                        </Box>
                    </Box>
                    <Box sx={{ p: 3 }}>
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
                                color={errors?.foto_sim ? "error" : "primary"}
                            >
                                {"Upload File SIM "}
                                <input
                                    type="file"
                                    accept=".jpg, .jpeg, .png, .pneg"
                                    id="fileUpload"
                                    name="fileUpload"
                                    hidden
                                />
                            </LoadingButton>
                            {errors.foto_sim && (
                                <p style={{ color: "red" }}>
                                    {errors.foto_sim.message}
                                </p>
                            )}
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
                            {...register("foto_sim", {
                                required: "Please attach foto sim ",
                            })}
                            hidden
                        />
                        <Typography>File Uploaded : {file?.name}</Typography>
                        {!file ? (
                            <Box
                                sx={{
                                    height: "10rem",
                                    minWidth: "40rem",
                                    border: "2px dashed black",
                                }}
                            ></Box>
                        ) : (
                            <Box
                                sx={{
                                    height: "15rem",
                                    border: "2px solid black",
                                    overflow: "scroll",
                                    justifyContent: "center",
                                }}
                            >
                                <img src={previewSim}></img>
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
