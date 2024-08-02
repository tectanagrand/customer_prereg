import { Dialog, Button, Box } from "@mui/material";
import SelectCompNoCont from "../../component/input/SelectCompNoCont";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { LoadingButton } from "@mui/lab";
import toast, { Toaster } from "react-hot-toast";

import { useEffect, useState, useRef } from "react";

const ModalSyncWBNET = ({ refreshTable, is_open, setOpen }) => {
    const axiosPrivate = useAxiosPrivate();
    const optRef = useRef();
    const [companyOpt, setCompanyOpt] = useState([]);
    const [companyVal, setCompVal] = useState(null);
    const [yearOpt, setYearOpt] = useState([]);
    const [yearVal, setYearVal] = useState(null);
    const [monthOpt, setMonthOpt] = useState([]);
    const [monthVal, setMonthVal] = useState(null);
    const [is_loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await axiosPrivate.get(`/ln/choicesyncwbnet`);
            setCompanyOpt(
                Object.keys(data).map(item => ({ value: item, label: item }))
            );
            optRef.current = data;
        })();
    }, []);

    const syncWbNetStaging = async () => {
        // console.log(monthVal, yearVal, companyVal);
        setLoading(true);
        try {
            const { data } = await axiosPrivate.post(`/ln/syncstgwb`, {
                month: monthVal,
                year: yearVal,
                company: companyVal,
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

    const onChangeComp = value => {
        setCompVal(value);
    };

    const onChangeYear = value => {
        setYearVal(value);
    };

    const onChangeMonth = value => {
        setMonthVal(value);
    };
    useEffect(() => {
        if (companyVal && optRef.current) {
            const yearOpt = Object.keys(optRef.current[companyVal]).map(
                item => ({ value: item, label: item })
            );
            setYearOpt(yearOpt);
            setYearVal(null);
            setMonthVal(null);
        }
    }, [companyVal]);

    useEffect(() => {
        if (companyVal && yearVal && optRef.current) {
            const monthOpt = optRef.current[companyVal][yearVal].map(item => ({
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
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <SelectCompNoCont
                            sx={{ width: "6rem" }}
                            label="Company"
                            options={companyOpt}
                            value={companyVal}
                            onChangeovr={onChangeComp}
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

export default ModalSyncWBNET;
