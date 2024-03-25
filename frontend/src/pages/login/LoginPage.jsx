import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Box, Typography, SvgIcon, Button, Link } from "@mui/material";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import imgbg from "../../images/gama-tower.jpg";
import KpnNav from "../../images/kpn-logo.svg?react";
import LazyBackground from "./LazyBackground";
import { Axios } from "../../api/axios";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "../../provider/sessionProvider";
import { useMenu } from "../../provider/MenuProvider";
import { useState } from "react";
import { LoadingButton } from "@mui/lab";

export default function LoginPage() {
    const { setSession } = useSession();
    const { setMenu } = useMenu();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const defaultValue = {
        username: "",
        password: "",
    };
    const loginUser = async values => {
        try {
            setLoading(true);
            const { data: userData } = await Axios.post("/user/login", {
                unemail: values.username,
                password: values.password,
            });
            setSession(userData);
            setMenu(userData.permission);
            toast.success("Login Success");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };
    const { control, handleSubmit } = useForm({ defaultValues: defaultValue });
    return (
        <Box
            sx={{
                display: "flex",
                height: "100vh",
                width: "100%",
                p: 0,
                m: "auto",
            }}
        >
            <Toaster />
            <Box sx={{ width: "100%", height: "100vh" }}>
                <LazyBackground
                    img={imgbg}
                    style={{ width: "100%", height: "100vh" }}
                />
            </Box>
            <Box sx={{ flexGrow: 1, width: "100%", p: 10 }}>
                <Box
                    sx={{
                        p: 4,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <SvgIcon
                            component={KpnNav}
                            sx={{
                                width: "4rem",
                                height: "4rem",
                                mt: "0.1rem",
                                mx: 3,
                            }}
                            viewBox="0 0 5000 5000"
                            color="white"
                        />
                        <Typography variant="h3">
                            Customer Pre Registration App
                        </Typography>
                    </div>
                    <form
                        onSubmit={handleSubmit(loginUser)}
                        style={{ width: "100%" }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "20rem",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                            }}
                        >
                            <TextFieldComp
                                label="Username / Email"
                                control={control}
                                name="username"
                                sx={{ my: 2 }}
                            />
                            <PasswordWithEyes
                                label="Password"
                                control={control}
                                name="password"
                                sx={{ my: 2 }}
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                width: "100%",
                                alignItems: "center",
                            }}
                        >
                            {/* <Link
                                sx={{ mr: "3rem" }}
                                onClick={() => {
                                    navigate("/register");
                                }}
                            >
                                Sign Up
                            </Link> */}
                            <LoadingButton
                                variant="contained"
                                type="submit"
                                loading={loading}
                            >
                                <Typography>Login</Typography>
                            </LoadingButton>
                        </div>
                    </form>
                </Box>
            </Box>
        </Box>
    );
}
