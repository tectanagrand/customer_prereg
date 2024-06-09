import { Box, Stack } from "@mui/material";
import { useRouteError, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Warning } from "@mui/icons-material";

export default function ErrorPage() {
    const error = useRouteError();

    useEffect(() => {
        const chunkFailedMessage =
            /^.*Failed\s+to\s+fetch\s+dynamically\s+imported\s+module.*$/;
        if (error?.message && chunkFailedMessage.test(error?.message)) {
            window.location.reload();
        }
    }, [error]);

    if (error.response?.status === 401) {
        return <Navigate replace to="/login" />;
    }
    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Stack
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Warning sx={{ fontSize: 100 }} />
                    <h1>Error {error.response?.status || error?.status}</h1>
                    <h2>
                        {" "}
                        {error?.response?.data?.message ||
                            error?.statusText ||
                            error?.message}
                    </h2>
                </Stack>
            </Box>
        </>
    );
}
