import { Container, Typography, Grid, Box } from "@mui/material";
import SelectComp from "../../component/input/SelectComp";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import PatternFieldComp from "../../component/input/PatternFieldComp";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
// import useAxiosPrivate from 'src/hooks/useAxiosPrivate';
import { Axios } from "../../api/axios";
// import DatePickerComp from 'src/components/common/DatePickerComp';
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { LoadingButton } from "@mui/lab";
import { useSession } from "../../provider/sessionProvider";
import toast, { Toaster } from "react-hot-toast";

export default function FormUserPage() {
    const [btnClicked, setBtnclicked] = useState(false);
    const { session } = useSession();
    const location = useLocation();
    // const axiosPrivate = useAxiosPrivate();
    const [role, setRoles] = useState([]);
    const [searchParams] = useSearchParams();
    const [userId, setUserid] = useState("");
    const navigate = useNavigate();
    const { handleSubmit, control, reset, getFieldState } = useForm({
        mode: "onChange",
        defaultValues: {
            fullname: "",
            username: "",
            phone_num: "",
            email: "",
            password: "",
            role: "",
        },
        resetOptions: {
            keepDirtyValues: true, // user-interacted input will be retained
            keepErrors: true, // input errors will be retained with value update
        },
    });

    const getUserData = async iduser => {
        // const userDt = await axiosPrivate.get(`/user/show/?iduser=${iduser}`);
        const { data: userDt } = await Axios.get(
            `/user/showbyid?id_user=${iduser}`
        );
        if (userDt != undefined) {
            setUserid(iduser);
            reset({
                fullname: userDt.fullname,
                username: userDt.username,
                usergroup: userDt.usergroup,
                email: userDt.email,
                role: userDt.role,
                phone_num: userDt.phone_num,
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
        if (userid !== undefined) {
            getUserData(userid);
        }
    }, []);

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
                        <Grid item xs>
                            <SelectComp
                                name="role"
                                control={control}
                                label="Role"
                                options={role}
                                rules={{ required: true }}
                            />
                        </Grid>
                    </Grid>
                    {/* {allowUpdate && location.state?.page !== "userinfo" && (
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <SelectComp
                                    name="usergroup"
                                    control={control}
                                    label="User Group"
                                    options={userGroup}
                                    rules={{ required: true }}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <SelectComp
                                    name="role"
                                    control={control}
                                    label="Role"
                                    options={roles}
                                    rules={{ required: true }}
                                    onChangeovr={onRoleChange}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <SelectComp
                                    name="manager"
                                    control={control}
                                    label="Manager"
                                    options={manager}
                                    disabled={isMgr}
                                />
                            </Grid>
                        </Grid>
                    )} */}
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
