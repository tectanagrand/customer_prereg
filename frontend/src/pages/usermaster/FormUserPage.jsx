import { Container, Typography, Grid, Box } from "@mui/material";
import SelectComp from "../../component/input/SelectComp";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import PatternFieldComp from "../../component/input/PatternFieldComp";
import AutoSelectUserSAP from "./AutoSelectUserSAP";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useSession } from "../../provider/sessionProvider";
// import useAxiosPrivate from 'src/hooks/useAxiosPrivate';
import { Axios } from "../../api/axios";
// import DatePickerComp from 'src/components/common/DatePickerComp';
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";

export default function FormUserPage() {
    const [btnClicked, setBtnclicked] = useState(false);
    const { getPermission } = useSession();
    const [roleState, _setRoleState] = useState("");
    const { session } = useSession();
    const location = useLocation();
    const allowUpdate = getPermission("User Master").fupdate;
    // const axiosPrivate = useAxiosPrivate();
    const [role, setRoles] = useState([{ value: "", label: "" }]);
    const [searchParams] = useSearchParams();
    const [userId, setUserid] = useState("");
    const navigate = useNavigate();

    const setRoleState = value => {
        _setRoleState(value);
    };

    const { handleSubmit, control, reset, getFieldState } = useForm({
        mode: "onChange",
        defaultValues: {
            fullname: "",
            username: "",
            phone_num: "",
            email: "",
            password: "",
            role: "",
            customer_id: { value: "", label: "" },
            id_sap: "",
        },
        resetOptions: {
            keepDirtyValues: true, // user-interacted input will be retained
            keepErrors: true, // input errors will be retained with value update
        },
    });

    useEffect(() => {
        if (!allowUpdate) {
            navigate("/dashboard");
        }
    }, []);

    const getUserData = async iduser => {
        // const userDt = await axiosPrivate.get(`/user/show/?iduser=${iduser}`);
        const { data: userDt } = await Axios.get(
            `/user/showbyid?id_user=${iduser}`
        );
        if (userDt !== undefined) {
            setUserid(iduser);
            setRoleState(userDt.role);
            reset({
                fullname: userDt.fullname,
                username: userDt.username,
                usergroup: userDt.usergroup,
                email: userDt.email,
                role: userDt.role,
                phone_num: userDt.phone_num,
                customer_id: {
                    value: userDt.sap_code,
                    label: userDt.sap_code,
                },
                id_sap: userDt.id_sap,
            });
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
                setRoles(role);
            } catch (error) {
                alert(error);
            }
        };
        getRole();
    }, []);

    useEffect(() => {
        let userid = searchParams.get("iduser");
        setUserid(userid);
        if (userid !== undefined && userid !== null) {
            getUserData(userid);
        }
    }, []);

    useEffect(() => {
        let userid = searchParams.get("iduser");
        if (userid !== undefined && userid !== null) {
            getUserData(userid);
        }
    }, [location.state]);

    const submitUser = async data => {
        setBtnclicked(true);
        let type;
        if (userId === "" || userId === null || userId === undefined) {
            type = "insert";
        } else {
            type = "update";
        }
        let subUserDt = {
            id_user: userId,
            fullname: data.fullname,
            username: data.username,
            email: data.email,
            role: data.role,
            phone_num: data.phone_num,
            updated_by: session.id_user,
            sap_code: data.customer_id.value,
            id_sap: data.id_sap,
            type: type,
        };
        if (getFieldState("password").isDirty) {
            subUserDt.password = data.password;
        }
        try {
            // console.log(subUserDt);
            // const submitDatauser = await axiosPrivate.post(
            //     `/user/submit`,
            //     subUserDt
            // );
            const { data: resultSubmit } = await Axios.post(
                `/user/submit`,
                subUserDt
            );
            toast.success(resultSubmit.message);
            setBtnclicked(false);
        } catch (error) {
            toast.error(error.response.data.message);
            setBtnclicked(false);
        }
    };
    return (
        <Container>
            <Toaster />
            <form onSubmit={handleSubmit(submitUser)}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        width: "100%",
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{ textAlign: "center", pb: 5 }}
                    >
                        User Information
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs>
                            <TextFieldComp
                                name="username"
                                control={control}
                                label="Username"
                                rules={{ required: true }}
                            />
                        </Grid>
                        <Grid item xs>
                            <PasswordWithEyes
                                name="password"
                                control={control}
                                label="Password"
                                rules={{
                                    required: userId != "" ? false : true,
                                }}
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs>
                            <TextFieldComp
                                name="fullname"
                                control={control}
                                label="Full Name"
                                rules={{ required: true }}
                            />
                        </Grid>
                        <Grid item xs>
                            <TextFieldComp
                                name="email"
                                control={control}
                                label="Email"
                                rules={{ required: true }}
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid item xs>
                            <PatternFieldComp
                                name="phone_num"
                                label="Telephone Number *"
                                control={control}
                                rules={{
                                    required: "Please insert this field",
                                }}
                                format="################"
                                isNumString={false}
                            />
                        </Grid>
                        {allowUpdate && location.state?.page !== "userinfo" && (
                            <>
                                <Grid item xs>
                                    <SelectComp
                                        name="role"
                                        control={control}
                                        label="Role"
                                        options={role}
                                        rules={{ required: true }}
                                        fullWidth
                                        onChangeovr={setRoleState}
                                    />
                                </Grid>
                                {(role.find(({ value }) => value === roleState)
                                    ?.label !== "LOGISTIC" ||
                                    role.find(
                                        ({ value }) => value === roleState
                                    )?.label === "BASE") && (
                                    <Grid item xs>
                                        <AutoSelectUserSAP
                                            name="customer_id"
                                            control={control}
                                            label="Customer Id"
                                            rules={{
                                                validate: v =>
                                                    v?.value !== null &&
                                                    v?.value !== "" &&
                                                    v !== null,
                                            }}
                                        />
                                    </Grid>
                                )}
                            </>
                        )}
                    </Grid>
                    {(role.find(({ value }) => value === roleState)?.label ===
                        "LOGISTIC" ||
                        role.find(({ value }) => value === roleState)?.label ===
                            "BASE") &&
                        allowUpdate &&
                        location.state?.page !== "userinfo" && (
                            <Grid container spacing={2}>
                                <Grid item>
                                    <TextFieldComp
                                        label="SAP ID Logistic"
                                        name="id_sap"
                                        control={control}
                                        rules={{ required: true }}
                                    />
                                </Grid>
                            </Grid>
                        )}
                </Box>
                <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mt: 10 }}
                >
                    <LoadingButton
                        type="submit"
                        sx={{ width: 100, height: 50 }}
                        variant="contained"
                        loading={btnClicked}
                    >
                        <Typography>Save</Typography>
                    </LoadingButton>
                </Box>
            </form>
        </Container>
    );
}
