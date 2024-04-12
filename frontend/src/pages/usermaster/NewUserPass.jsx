import { TextFieldComp } from "../../component/input/TextFieldComp";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import LazyBackground from "../login/LazyBackground";
import imgbg from "../../images/gama-tower.jpg";
import { useTheme } from "@mui/material/styles";
import { Typography, Container, SvgIcon } from "@mui/material";
import KpnNav from "../../images/kpn-logo.svg?react";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

export default function NewUserPass() {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { control, handleSubmit } = useForm({
        defaultValues: {
            username: searchParams.get("username") ?? "",
            newpass: "",
        },
    });
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const checkKeyDown = e => {
        if (e.key === "Enter") e.preventDefault();
    };
    const onSubmitValidation = async values => {
        setLoading(true);

        try {
            const submitValidation = await axiosPrivate.post(
                "/user/setpwdnew",
                values,
                {
                    withCredentials: true,
                }
            );
            toast.success("User Saved");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            toast.error(error.response.data.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <LazyBackground
            img={imgbg}
            style={{ width: "100%", height: "100%" }}
            noblur={true}
        >
            <Toaster />
            <Container
                sx={{
                    backgroundColor: theme.palette.background.paper,
                    height: "100vh",
                    width: "50vw",
                    boxShadow: 3,
                    p: 10,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        marginBottom: "1rem",
                    }}
                >
                    <SvgIcon
                        component={KpnNav}
                        sx={{
                            width: "2rem",
                            height: "2rem",
                            mt: "0.1rem",
                        }}
                        viewBox="0 0 5000 5000"
                        color="white"
                    />
                    <Typography variant="h6">
                        Customer Pre Registration App
                    </Typography>
                </div>
                <Typography variant="h3" sx={{ mb: 4 }}>
                    Set New User Password
                </Typography>
                <form
                    onKeyDown={e => checkKeyDown(e)}
                    onSubmit={handleSubmit(onSubmitValidation)}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            flexDirection: "column",
                        }}
                    >
                        <TextFieldComp
                            control={control}
                            name="username"
                            label="Username"
                        />
                        <PasswordWithEyes
                            control={control}
                            name="newpass"
                            label="New Password"
                        />
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                            }}
                        >
                            <LoadingButton
                                loading={loading}
                                variant="contained"
                                type="submit"
                            >
                                Verify
                            </LoadingButton>
                        </div>
                    </div>
                </form>
            </Container>
        </LazyBackground>
    );
}
