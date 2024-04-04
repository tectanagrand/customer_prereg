import {
    Container,
    Typography,
    Grid,
    Box,
    Button,
    IconButton,
} from "@mui/material";
import SelectComp from "../../component/input/SelectComp";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import PatternFieldComp from "../../component/input/PatternFieldComp";
import AutoSelectUserSAP from "./AutoSelectUserSAP";
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useSession } from "../../provider/sessionProvider";
import { useTheme } from "@mui/material/styles";
import { Cancel, Password } from "@mui/icons-material";
import { Axios } from "../../api/axios";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";
import AutocompleteComp from "../../component/input/AutocompleteComp";

export default function NewUserRegFormPage() {
    // const [customerID, setCustID] = useState("");
    // const [customerName, setCustName] = useState("");
    const navigate = useNavigate();
    const [role, _setRole] = useState("");
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [plantOp, setPlantop] = useState([]);
    const { session } = useSession();
    const theme = useTheme();
    const [roleOp, setRoleOp] = useState([{ value: "", label: "" }]);
    const currentRole = roleOp.find(({ value }) => value === role)?.label;
    const {
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { isDirty, dirtyFields },
    } = useForm({
        defaultValues: {
            username: "",
            fullname: "",
            role: "",
            customer_id: { value: "", label: "" },
            telfList: [{ telf: "" }],
            emailList: [{ email: "" }],
            plant_code: { value: "", label: "" },
        },
        resetOptions: {
            keepErrors: true, // input errors will be retained with value update
        },
    });

    const {
        fields: emailFields,
        append: addEmail,
        remove: rmEmail,
    } = useFieldArray({
        control,
        name: "emailList",
    });

    const {
        fields: telfFields,
        append: addTelf,
        remove: rmTelf,
    } = useFieldArray({
        control,
        name: "telfList",
    });

    const onChangeControlOvrCust = value => {
        if (value) {
            setValue("username", value.kunnr);
            setValue("fullname", value.name.split("-")[0].trim());
        } else {
            setValue("username", "");
            setValue("fullname", "");
        }
    };

    useEffect(() => {
        const getRole = async () => {
            try {
                // const getRole = await axiosPrivate.get(`/user/roles`);
                const { data: preFormData } = await Axios.get(`/user/preform`);
                const role = preFormData.role.map(item => ({
                    value: item.role_id,
                    label: item.role_name,
                }));
                setRoleOp(role);
            } catch (error) {
                alert(error);
            }
        };
        getRole();
    }, []);

    useEffect(() => {
        if (searchParams.get("iduser")) {
            (async () => {
                const { data } = await Axios.get(
                    "/user/showbyid?id_user=" + searchParams.get("iduser"),
                    { withCredentials: true }
                );
                const dataUser = {
                    username: data.username,
                    fullname: data.fullname,
                    role: data.role,
                    plant_code: {
                        value: data.plant_code,
                        label: data.plant_code,
                    },
                    password: "",
                    emailList: data.email.map(item => ({ email: item })),
                    telfList: data.telf.map(item => ({ telf: item })),
                };
                _setRole(data.role);
                reset(dataUser);
            })();
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get("/master/plt");
                setPlantop(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);

    const setRole = valueOv => {
        _setRole(valueOv);
        if (
            roleOp.find(({ value }) => value === valueOv)?.label === "LOGISTIC"
        ) {
            setValue("username", "");
            setValue("fullname", "");
            setValue("customer_id", { value: "", label: "" });
        }
    };

    const submitUser = async values => {
        const payload = {
            fullname: values.fullname,
            username: values.username,
            plant_code: values.plant_code.value,
            role: values.role,
            email: values.emailList.map(item => item.email),
            phonenum: values.telfList.map(item => item.telf),
        };
        if (values.hasOwnProperty("password")) {
            payload.password = values.password;
        }
        if (!!searchParams.get("iduser")) {
            payload.id_user = searchParams.get("iduser");
        }
        setLoading(true);
        try {
            if (!!searchParams.get("iduser")) {
                await Axios.post("/user/edituser", payload, {
                    withCredentials: true,
                });
                toast.success("User Updated");
                setTimeout(() => {
                    navigate("/dashboard/users");
                }, 1000);
            } else {
                await Axios.post("/user/register", payload, {
                    withCredentials: true,
                });
                toast.success("new user registration on process");
                setTimeout(() => {
                    navigate("/dashboard/users");
                }, 1000);
            }
        } catch (error) {
            toast.error(error.response.data.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };

    return (
        <form
            onSubmit={handleSubmit(submitUser)}
            onKeyDown={e => checkKeyDown(e)}
        >
            <Toaster />
            <Typography variant="h3" sx={{ mb: 4 }}>
                {searchParams.get("iduser")
                    ? "Update User"
                    : "New User Registration"}
            </Typography>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <SelectComp
                            name="role"
                            label="Role"
                            control={control}
                            onChangeovr={setRole}
                            options={roleOp}
                            fullWidth
                            readOnly={!!searchParams.get("iduser")}
                            rules={{ required: true }}
                        />
                    </Grid>
                    {!searchParams.get("iduser") && (
                        <Grid item xs={6}>
                            <AutoSelectUserSAP
                                name="customer_id"
                                label="Customer ID"
                                control={control}
                                onChangeControlOvr={onChangeControlOvrCust}
                                fullWidth={true}
                                disabled={
                                    !(
                                        currentRole === "CUSTOMER" ||
                                        currentRole === "ADMIN"
                                    )
                                }
                                sx={{
                                    label: {
                                        "&.Mui-disabled": {
                                            color: theme.palette.grey[400],
                                        },
                                    },
                                }}
                            />
                        </Grid>
                    )}
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextFieldComp
                            control={control}
                            label="Username"
                            name="username"
                            disabled={
                                currentRole === "CUSTOMER" ||
                                !!searchParams.get("iduser")
                            }
                            rules={{ required: true }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextFieldComp
                            control={control}
                            label="Full Name"
                            name="fullname"
                            disabled={
                                currentRole === "CUSTOMER" ||
                                !!searchParams.get("iduser")
                            }
                            rules={{ required: true }}
                        />
                    </Grid>
                    {(currentRole === "ADMINWB" || currentRole === "ADMIN") && (
                        <Grid item xs={6}>
                            <AutocompleteComp
                                name="plant_code"
                                control={control}
                                label="Plant Code"
                                options={plantOp}
                                rules={{ required: true }}
                            />
                        </Grid>
                    )}
                    {!!searchParams.get("iduser") && (
                        <Grid item xs={6}>
                            <PasswordWithEyes
                                control={control}
                                label="Password"
                                name="password"
                            />
                        </Grid>
                    )}
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                borderColor: theme.palette.grey[800],
                                border: "solid",
                                borderRadius: "10px",
                                borderWidth: "1px",
                                padding: "1rem",
                                backgroundColor: theme.palette.grey[200],
                            }}
                        >
                            <p>Email : </p>
                            {emailFields.map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <TextFieldComp
                                        name={`emailList.${index}.email`}
                                        label={"Email " + (index + 1)}
                                        control={control}
                                        rules={{ required: true }}
                                    />
                                    {index !== 0 && (
                                        <IconButton
                                            sx={{
                                                color: theme.palette.error.main,
                                                width: "2rem",
                                                height: "2rem",
                                            }}
                                            onClick={() => {
                                                rmEmail(index);
                                            }}
                                        >
                                            <Cancel></Cancel>
                                        </IconButton>
                                    )}
                                </div>
                            ))}
                            <div>
                                <Button
                                    onClick={() => {
                                        addEmail({ email: "" });
                                    }}
                                    variant="outlined"
                                >
                                    + Add Email
                                </Button>
                            </div>
                        </div>
                    </Grid>
                    <Grid item xs={6}>
                        <div
                            style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                borderColor: theme.palette.grey[800],
                                border: "solid",
                                borderRadius: "10px",
                                borderWidth: "1px",
                                padding: "1rem",
                                backgroundColor: theme.palette.grey[200],
                            }}
                        >
                            <p>Phone Number : </p>
                            {telfFields.map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{
                                        display: "flex",
                                        gap: "1rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <TextFieldComp
                                        name={`telfList.${index}.telf`}
                                        label={"Phone Number " + (index + 1)}
                                        control={control}
                                        rules={{ required: true }}
                                    />
                                    {index !== 0 && (
                                        <IconButton
                                            sx={{
                                                color: theme.palette.error.main,
                                                width: "2rem",
                                                height: "2rem",
                                            }}
                                            onClick={() => {
                                                rmTelf(index);
                                            }}
                                        >
                                            <Cancel></Cancel>
                                        </IconButton>
                                    )}
                                </div>
                            ))}
                            <div>
                                <Button
                                    onClick={() => {
                                        addTelf({ telf: "" });
                                    }}
                                    variant="outlined"
                                >
                                    + Add Phone Number
                                </Button>
                            </div>
                        </div>
                    </Grid>
                </Grid>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 10,
                        gap: 3,
                    }}
                >
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            navigate("/dashboard/users");
                        }}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={loading}
                        disabled={!!searchParams.get("iduser") && !isDirty}
                    >
                        <Typography>Save</Typography>
                    </LoadingButton>
                </Box>
            </div>
        </form>
    );
}
