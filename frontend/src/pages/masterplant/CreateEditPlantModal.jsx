import { useImperativeHandle, useRef, forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, Button, Box, Typography } from "@mui/material";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import Form from "../../component/common/Form";

const CreateEditPlantModal = forwardRef((props, ref) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [mode, setMode] = useState("");
    const { companyCode, companyName } = props;
    const { control, reset, handleSubmit } = useForm({
        defaultValues: {
            plant_code: "",
            plant_name: "",
            lokasi: "",
            alamat: "",
            company_code: "",
            company_name: "",
        },
    });
    const actiontoForm = (mode, payload) => {
        setMode(mode);
        if (Object.keys(payload).length > 0) {
            reset(payload);
        }
        setModalOpen(true);
    };
    useImperativeHandle(
        ref,
        () => ({
            actiontoForm,
        }),
        []
    );
    return (
        <Dialog open={modalOpen} onClose={() => setModalOpen(false)}>
            <Form>
                <Box sx={{ height: "80dvh", minWidth: "480px" }}>
                    <Typography variant="h4"></Typography>
                </Box>
            </Form>
        </Dialog>
    );
});

export default CreateEditPlantModal;
