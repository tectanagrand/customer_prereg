import { Dialog, Box, Stack } from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState, useEffect } from "react";

const ModalVehicle = ({
    uuid,
    isOpen,
    modalCtrl,
    setOpenBackdrop,
    loadedData,
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [vehicle, setVehicle] = useState({
        platNum: "",
        platImage: "",
    });
    const setModalVeh = value => {
        modalCtrl(value);
    };
    useEffect(() => {
        if (loadedData) {
            (async () => {
                setOpenBackdrop(true);
                try {
                    const { data } = await axiosPrivate.get(
                        `/master/vhcl?id=${uuid}`
                    );
                    setVehicle({
                        platNum: data.data[0].vhcl_id,
                        platImage: data.source + "/" + data.data[0].foto_stnk,
                    });
                    setModalVeh(true);
                } catch (error) {
                    console.error(error);
                } finally {
                    setOpenBackdrop(false);
                }
            })();
        }
    }, [uuid]);
    return (
        <Dialog open={isOpen} maxWidth="lg" onClose={() => setModalVeh(false)}>
            <Box sx={{ padding: 3 }}>
                <Stack>
                    <h3>Vehicle Details</h3>
                    <h4>Plate Number : {vehicle.platNum}</h4>
                    <img
                        alt="img vehicle"
                        src={vehicle.platImage}
                        width={"1200px"}
                        height={"400px"}
                        style={{ objectFit: "fill" }}
                    ></img>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default ModalVehicle;
