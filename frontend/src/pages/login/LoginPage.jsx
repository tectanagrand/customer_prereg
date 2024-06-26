import { useForm } from "react-hook-form";
import { useNavigate, Navigate } from "react-router-dom";
import { Box, Typography, SvgIcon, Button, Link } from "@mui/material";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import imgbg from "../../images/gama-tower.jpg";
import KpnNav from "../../images/kpn-logo.svg?react";
import LazyBackground from "./LazyBackground";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "../../provider/sessionProvider";
import { useMenu } from "../../provider/MenuProvider";
import { useState, lazy, useEffect } from "react";
import { LoadingButton } from "@mui/lab";
import Cookies from "js-cookie";

export default function LoginPage() {
    const { setSession } = useSession();
    const { setMenu } = useMenu();
    const axiosPrivate = useAxiosPrivate();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const defaultValue = {
        username: "",
        password: "",
    };
    const loginUser = async values => {
        setLoading(true);
        try {
            const { data: userData } = await axiosPrivate.post("/user/login", {
                unemail: values.username,
                password: values.password,
            });
            setSession(userData);
            // console.log(userData);
            setMenu(userData.permission.jsonMenu);
            toast.success("Login Success");
            setTimeout(() => {
                if (userData.role === "LOGISTIC") {
                    navigate("/dashboard/osreq");
                } else if (userData.role === "CUSTOMER") {
                    navigate("/dashboard/loco");
                } else if (userData.role === "VENDOR") {
                    navigate("/dashboard/franco");
                } else {
                    navigate("/dashboard/loco");
                }
            }, 1000);
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };
    const { control, handleSubmit } = useForm({ defaultValues: defaultValue });

    // useEffect(() => {
    //     if (Cookies.get("access_token") || Cookies.get("access_token") !== "") {
    //         if (Cookies.get("role") === "LOGISTIC") {
    //             navigate("/dashboard/osreq") ;
    //         } else if (Cookies.get("role") === "CUSTOMER") {
    //             navigate("/dashboard/loco") ;
    //         } else if (Cookies.get("role") === "VENDOR") {
    //             navigate("/dashboard/franco") ;
    //         } else {
    //             navigate("/dashboard/osreq") ;
    //         }
    //     }
    // }, []);

    useEffect(() => {
        if (Cookies.get("access_token")) {
            navigate("/dashboard/loco");
        }
    }, [navigate]);

    if (Cookies.get("access_token")) {
        return (
            <>
                <Toaster />
                <Navigate to="/dashboard/loco" />
            </>
        );
    }
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
                <LazyBackground img={imgbg} />
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
                                label="Username"
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
                            <Link
                                sx={{ mr: "3rem" }}
                                onClick={() => {
                                    navigate("/verif");
                                }}
                            >
                                Already Registered?
                            </Link>
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
