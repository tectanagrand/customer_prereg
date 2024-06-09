import { Dialog, Box, Stack } from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState, useEffect } from "react";

const ModalDriver = ({
    uuid,
    isOpen,
    modalCtrl,
    setOpenBackdrop,
    loadedData,
}) => {
    const axiosPrivate = useAxiosPrivate();
    const [driver, setDriver] = useState({
        namaSupir: "",
        idSupir: "",
        lahir: "",
        alamat: "",
        nomortelfon: "",
        imagesim: "",
        imagedrv: "",
    });
    const setModalDrv = value => {
        modalCtrl(value);
    };
    useEffect(() => {
        if (loadedData) {
            (async () => {
                setOpenBackdrop(true);
                try {
                    const { data } = await axiosPrivate.get(
                        `/master/drvr?id=${uuid}`
                    );
                    setDriver({
                        namaSupir: data.data[0].driver_name,
                        idSupir: data.data[0].driver_id,
                        lahir:
                            data.data[0].tempat_lahir +
                            ", " +
                            data.data[0].tanggal_lahir,
                        alamat: data.data[0].alamat,
                        nomortelfon: data.data[0].no_telp,
                        imagesim: data.source + "/" + data.data[0].foto_sim,
                        imagedrv: data.source + "/" + data.data[0].foto_driver,
                    });
                    setModalDrv(true);
                } catch (error) {
                    console.error(error);
                } finally {
                    setOpenBackdrop(false);
                }
            })();
        }
    }, [uuid]);
    return (
        <Dialog open={isOpen} maxWidth="lg" onClose={() => setModalDrv(false)}>
            <Box sx={{ padding: 3 }}>
                <Stack>
                    <h3>Driver Details</h3>
                    <table style={{ width: "40rem" }}>
                        <tr>
                            <td style={{ width: "30%" }}>Nama Supir</td>
                            <td style={{ width: "5%" }}>:</td>
                            <td>{driver.namaSupir}</td>
                        </tr>
                        <tr>
                            <td style={{ width: "30%" }}>Nomor SIM</td>
                            <td style={{ width: "5%" }}>:</td>
                            <td>{driver.idSupir}</td>
                        </tr>
                        <tr>
                            <td style={{ width: "30%" }}>
                                Tempat, Tanggal Lahir{" "}
                            </td>
                            <td style={{ width: "5%" }}>:</td>
                            <td>{driver.lahir}</td>
                        </tr>
                        <tr>
                            <td style={{ width: "30%" }}>Alamat </td>
                            <td style={{ width: "5%" }}>:</td>
                            <td>{driver.alamat}</td>
                        </tr>
                        <tr>
                            <td style={{ width: "30%" }}>Nomor Telfon </td>
                            <td style={{ width: "5%" }}>:</td>
                            <td>{driver.no_telp}</td>
                        </tr>
                    </table>
                    <div
                        style={{
                            display: "flex",
                            gap: "1rem",
                            marginTop: "1rem",
                        }}
                    >
                        <img
                            alt="img sim"
                            src={driver.imagesim}
                            width={"1000px"}
                            height={"400px"}
                            style={{ objectFit: "cover" }}
                        ></img>
                        <img
                            alt="img driver"
                            src={driver.imagedrv}
                            width={"300px"}
                            height={"400px"}
                            style={{ objectFit: "cover" }}
                        ></img>
                    </div>
                </Stack>
            </Box>
        </Dialog>
    );
};

export default ModalDriver;
