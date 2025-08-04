import { Dialog, Button, Box } from "@mui/material";
import SelectCompNoCont from "../../component/input/SelectCompNoCont";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";

import { useEffect, useState, useRef } from "react";

const ModalSyncZWBPark = ({ refreshTable, is_open, setOpen }) => {
    const axiosPrivate = useAxiosPrivate();
    const optRef = useRef();
    const [plantOpt, setPlantOpt] = useState([]);
    const [plantVal, setPlantVal] = useState(null);
    const [yearOpt, setYearOpt] = useState([]);
    const [yearVal, setYearVal] = useState(null);
    const [monthOpt, setMonthOpt] = useState([]);
    const [monthVal, setMonthVal] = useState(null);
    const [is_loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await axiosPrivate.get(`/ln/choicesyncwbpark`);
            setPlantOpt(
                Object.keys(data.data).map(item => ({
                    value: item,
                    label: item,
                }))
            );
            optRef.current = data.data;
        })();
    }, []);

    const syncWbNetStaging = async () => {
        // console.log(monthVal, yearVal, companyVal);
        setLoading(true);
        try {
            const { data } = await axiosPrivate.post(`/ln/synczwbpark`, {
                month: monthVal,
                year: yearVal,
                plant: plantVal,
            });
            refreshTable();
            setOpen(false);
            toast.success(data.message);
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message ?? error.message);
        } finally {
            setLoading(false);
        }
    };

    const onChangeYear = value => {
        setYearVal(value);
    };

    const onChangeMonth = value => {
        setMonthVal(value);
    };
    useEffect(() => {
        if (plantVal && optRef.current) {
            const yearOpt = Object.keys(optRef.current[plantVal]).map(item => ({
                value: item,
                label: item,
            }));
            setYearOpt(yearOpt);
            setYearVal(null);
            setMonthVal(null);
        }
    }, [plantVal]);

    useEffect(() => {
        if (plantVal && yearVal && optRef.current) {
            const monthOpt = optRef.current[plantVal][yearVal].map(item => ({
                value: item,
                label: item,
            }));
            setMonthOpt(monthOpt);
        }
    }, [yearVal]);

    return (
        <div>
            <Toaster />
            <Dialog
                maxWidth="lg"
                open={is_open}
                onClose={() => {
                    setOpen(false);
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "40rem",
                        gap: 1,
                        p: 4,
                    }}
                >
                    <h4 style={{ textAlign: "center", margin: "0 0 1rem 0" }}>
                        Synchronize WBNET Staging
                    </h4>
                    <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                        <SelectCompNoCont
                            label="Company"
                            options={plantOpt}
                            value={plantVal}
                            onChangeovr={value => {
                                setPlantVal(value);
                            }}
                        />
                        <SelectCompNoCont
                            label="Year"
                            options={yearOpt}
                            value={yearVal}
                            onChangeovr={onChangeYear}
                        />
                        <SelectCompNoCont
                            label="Month"
                            options={monthOpt}
                            value={monthVal}
                            onChangeovr={onChangeMonth}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <LoadingButton
                            sx={{ height: "4rem", width: "12rem" }}
                            variant="contained"
                            loading={is_loading}
                            onClick={e => {
                                syncWbNetStaging();
                            }}
                        >
                            Synchronize
                        </LoadingButton>
                    </Box>
                </Box>
            </Dialog>
        </div>
    );
};

export default ModalSyncZWBPark;
