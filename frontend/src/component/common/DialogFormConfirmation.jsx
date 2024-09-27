import { LoadingButton } from "@mui/lab";
import { Dialog, DialogActions, Button, DialogTitle } from "@mui/material";
import { useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function DialogFormConfirmation({
    open,
    setOpen,
    Content,
    onYes,
    onNo,
    Title,
    values,
}) {
    const [loading, setLoading] = useState(false);

    const onYesClick = async () => {
        try {
            setLoading(true);
            await onYes(values);
        } catch (error) {
            toast.error(error?.response?.data?.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onNoClick = () => {
        onNo();
    };

    return (
        <>
            <Toaster />
            <Dialog open={open} maxWidth="xl">
                <DialogTitle>{Title}</DialogTitle>
                {Content}
                <DialogActions>
                    <LoadingButton
                        onClick={async () => await onYesClick()}
                        color="primary"
                        variant="contained"
                        loading={loading}
                    >
                        Confirm
                    </LoadingButton>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => onNoClick()}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
