import { useForm } from "react-hook-form";
import { Dialog, Box } from "@mui/material";
import toast from "react-hot-toast";
import { useSession } from "../../provider/sessionProvider";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import { useState, useEffect } from "react";
import { LoadingButton } from "@mui/lab";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const LoginModal = ({ closeModal, modalState }) => {
    const { setSession } = useSession();
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState();
    const defaultValue = {
        username: "",
        password: "",
    };
    const modalClose = () => {
        closeModal();
    };
    const { control, handleSubmit } = useForm({
        defaultValues: defaultValue,
    });

    const actLogin = values => {
        // console.log(values);
        (async () => {
            setLoading(true);
            try {
                const { data: userData } = await axiosPrivate.post(
                    "/user/login",
                    {
                        unemail: values.username,
                        password: values.password,
                    }
                );
                console.log;
                if (userData.role !== "LOGISTIC") {
                    throw new Error("User is not Logistic");
                }
                setSession(userData);
                toast.success("Login Success");
                modalClose();
            } catch (error) {
                if (error.response) {
                    toast.error(error.response.data.message);
                } else {
                    toast.error(error.message);
                }
                console.log(error);
            } finally {
                setLoading(false);
            }
        })();
    };

    return (
        <Dialog open={modalState}>
            <form onSubmit={handleSubmit(actLogin)}>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        padding: 8,
                        alignItems: "center",
                    }}
                >
                    <h2>Login Account</h2>
                    <h4>Please login to proceed</h4>
                    <TextFieldComp
                        control={control}
                        name="username"
                        label="Username"
                        rules={{ required: "Please fill this field" }}
                    />
                    <PasswordWithEyes
                        control={control}
                        name="password"
                        label="Password"
                        rules={{ required: "Please fill this field" }}
                    />
                    <LoadingButton loading={loading} type="submit">
                        Login
                    </LoadingButton>
                </Box>
                <Box
                    sx={{
                        backgroundColor: "grey",
                        height: "4rem",
                        width: "100%",
                        padding: "auto",
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <h4
                        style={{
                            textAlign: "center",
                            margin: "0 0 0 0",
                            padding: "1rem 0 1rem 0",
                        }}
                    >
                        © KPN Customer Prereg App 2024
                    </h4>
                </Box>
            </form>
        </Dialog>
    );
};

export default LoginModal;
