import { Container, Link, Typography, Button } from "@mui/material";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { useForm } from "react-hook-form";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import LazyBackground from "../login/LazyBackground";
import imgbg from "../../images/gama-tower.jpg";
import { PasswordWithEyes } from "../../component/input/PasswordWithEyes";
import PatternFieldComp from "../../component/input/PatternFieldComp";
import { useTheme } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { useNavigate } from "react-router-dom";

export default function RegistrationPage() {
    const navigate = useNavigate();
    const axiosPrivate = useAxiosPrivate();
    const theme = useTheme();
    const [counter, setCounter] = useState(10);
    const [registered, setRegistered] = useState(false);
    const [btnClicked, setBtnClicked] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (btnClicked) {
            const reduceCounter = setInterval(() => {
                setCounter(counter - 1);
                // console.log(counter);
                if (counter - 1 <= 0) {
                    setBtnClicked(false);
                    setCounter(10);
                    clearInterval(reduceCounter);
                }
            }, 1000);
            return () => {
                clearInterval(reduceCounter);
            };
        }
    }, [btnClicked, counter]);
    const defaultValueReg = {
        full_name: "",
        phone_num: "",
        username: "",
        email_reg: "",
        password: "",
    };
    const defaultValueOTP = {
        otp: "",
        email_otp: "",
    };

    const registerData = async values => {
        try {
            const payload = {
                full_name: values.full_name,
                username: values.username,
                email: values.email_reg,
                phone_num: values.phone_num.trim(),
                password: values.password,
            };
            setLoading(true);
            const insertData = await axiosPrivate.post(
                "/user/register",
                payload
            );
            setLoading(false);
            toast.success(insertData.data.message);
            // toast.success("registered");
            setRegistered(true);
            setBtnClicked(true);

            resetOTP({ otp: "", email_otp: values.email_reg });
            // setValOTP("email_otp", values.email_reg);
        } catch (error) {
            resetOTP({ otp: "", email_otp: "" });
            console.error(error);
            setLoading(false);
            toast.error(error.response.data.message);
        }
    };

    const verifOTP = async values => {
        try {
            const payload = {
                email: values.email_otp,
                otp_input: values.otp,
            };
            setLoading(true);
            const verifyOTP = await axiosPrivate.post(
                "/user/verifotp",
                payload
            );
            setLoading(false);
            toast.success("User Verification Success");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async values => {
        try {
            const payload = {
                email: values.email_otp,
                type: "new",
            };
            setBtnClicked(true);
            const resendOTP = await axiosPrivate.post(
                "/user/resendotp",
                payload
            );
            toast.success("OTP resent");
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        }
    };

    const { control: controlReq, handleSubmit: handleSubmitReq } = useForm({
        defaultValues: defaultValueReg,
    });
    const {
        control: controlOTP,
        handleSubmit: handleSubmitOTP,
        reset: resetOTP,
        setValue: setValOTP,
        getValues: OTPgetVal,
    } = useForm({
        defaultValues: defaultValueOTP,
    });
    return (
        <>
            <LazyBackground
                img={imgbg}
                style={{ width: "100%", height: "100%" }}
                noblur={true}
            >
                <Container
                    sx={{
                        backgroundColor: theme.palette.background.paper,
                        height: "100vh",
                        boxShadow: 3,
                        p: 10,
                    }}
                >
                    <Toaster />
                    <Typography variant="h2">Register New User</Typography>
                    {!registered && (
                        <form onSubmit={handleSubmitReq(registerData)}>
                            <Typography>Register</Typography>
                            <div
                                style={{
                                    padding: 10,
                                    marginTop: 10,
                                    height: "30rem",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 10,
                                    }}
                                >
                                    <TextFieldComp
                                        control={controlReq}
                                        label="Full name *"
                                        name="full_name"
                                        rules={{
                                            required:
                                                "Please insert this field",
                                        }}
                                    />
                                    <TextFieldComp
                                        control={controlReq}
                                        label="Username *"
                                        name="username"
                                        rules={{
                                            required:
                                                "Please insert this field",
                                        }}
                                    />
                                    <TextFieldComp
                                        control={controlReq}
                                        label="Email *"
                                        name="email_reg"
                                        rules={{
                                            required:
                                                "Please insert this field",
                                        }}
                                    />
                                    <PatternFieldComp
                                        name="phone_num"
                                        label="Telephone Number *"
                                        control={controlReq}
                                        rules={{
                                            required:
                                                "Please insert this field",
                                        }}
                                        format="################"
                                        isNumString={false}
                                    />

                                    <PasswordWithEyes
                                        control={controlReq}
                                        label="Password *"
                                        rules={{
                                            required:
                                                "Please insert this field",
                                        }}
                                        name="password"
                                    />
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    alignItems: "center",
                                    marginTop: 10,
                                }}
                            >
                                <Link
                                    sx={{ mr: 5 }}
                                    onClick={() => {
                                        setRegistered(true);
                                    }}
                                >
                                    Already Registered ?
                                </Link>
                                <LoadingButton
                                    type="submit"
                                    variant="contained"
                                    loading={loading}
                                >
                                    Register
                                </LoadingButton>
                            </div>
                        </form>
                    )}
                    {registered && (
                        <>
                            <Typography> OTP Verification </Typography>
                            <form
                                onSubmit={handleSubmitOTP(verifOTP)}
                                style={{ padding: 10, marginTop: 10 }}
                            >
                                <div
                                    style={{
                                        padding: 10,
                                        marginTop: 10,
                                        height: "30rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 10,
                                        }}
                                    >
                                        <TextFieldComp
                                            control={controlOTP}
                                            name="email_otp"
                                            label="Email *"
                                            rules={{
                                                required:
                                                    "Please insert this field",
                                            }}
                                        />
                                        <TextFieldComp
                                            control={controlOTP}
                                            name="otp"
                                            label="OTP *"
                                            rules={{
                                                required:
                                                    "Please insert this field",
                                            }}
                                        />
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        alignItems: "center",
                                        gap: 10,
                                    }}
                                >
                                    <Link
                                        sx={{ mr: 5 }}
                                        onClick={() => {
                                            setRegistered(false);
                                        }}
                                    >
                                        Not registered?
                                    </Link>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            resendOTP(OTPgetVal());
                                        }}
                                        disabled={btnClicked}
                                    >
                                        {!btnClicked
                                            ? "Resend OTP"
                                            : `Wait (${counter})`}
                                    </Button>
                                    <LoadingButton
                                        type="submit"
                                        variant="contained"
                                        loading={loading}
                                    >
                                        Verify OTP
                                    </LoadingButton>
                                </div>
                            </form>
                        </>
                    )}
                </Container>
            </LazyBackground>
        </>
    );
}
