import { Dialog, Box, Typography } from "@mui/material";
import { CheckCircleOutline, CancelOutlined } from "@mui/icons-material";

export default function ResultDialog({
    modalOpen,
    onCloseModal,
    Text,
    State,
    ...props
}) {
    return (
        <Dialog
            open={modalOpen}
            maxWidth="sm"
            onClose={onCloseModal}
            sx={{ zIndex: theme => theme.zIndex.drawer - 2 }}
        >
            <Box
                sx={{
                    minWidth: "30rem",
                    minHeight: "15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    p: 4,
                }}
            >
                {State === "success" && (
                    <CheckCircleOutline
                        sx={{
                            height: "4rem",
                            width: "4rem",
                            color: "green",
                        }}
                    />
                )}
                {State === "failed" && (
                    <CancelOutlined
                        sx={{
                            height: "4rem",
                            width: "4rem",
                            color: "red",
                        }}
                    />
                )}
                {Text}
            </Box>
        </Dialog>
    );
}
