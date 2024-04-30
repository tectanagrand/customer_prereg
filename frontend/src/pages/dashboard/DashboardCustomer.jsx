import { BarChart, PieChart } from "@mui/x-charts";
import { useEffect, useState } from "react";
import SelectCompNoCont from "../../component/input/SelectCompNoCont";
import { Box } from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import TableCreatedLoadingNote from "../../component/table/TableCreatedLoadingNote";

export default function DashboardCustomer() {
    const axiosPrivate = useAxiosPrivate();
    const [selected, _setSelected] = useState("");
    const [OpDo, setOpDo] = useState([]);
    const [loading, setLoading] = useState(false);
    const getDataDO = async () => {
        try {
            setLoading(true);
            const { data } = await axiosPrivate.get("/master/dolist", {
                withCredentials: true,
            });
            setOpDo(data);
            // toast.success("Success Load DO");
        } catch (error) {
            console.error(error);
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getDataDO();
    }, []);

    function setSelected(value) {
        _setSelected(value);
    }

    return (
        <Box
            sx={{
                minWidth: "100%",
                minHeight: "100%",
                display: "flex",
                justifyContent: "space-evenly",
            }}
        >
            <Toaster />
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                }}
            >
                <SelectCompNoCont
                    name="DoSelect"
                    label="DO Number"
                    value={selected}
                    options={OpDo}
                    onChangeovr={setSelected}
                    onOpen={getDataDO}
                    lazy={true}
                    isLoading={loading}
                />
                <PieChart
                    series={[
                        {
                            data: [
                                { id: 0, value: 10, label: "series A" },
                                { id: 1, value: 15, label: "series B" },
                                { id: 2, value: 20, label: "series C" },
                            ],
                        },
                    ]}
                    width={400}
                    height={200}
                />
                <TableCreatedLoadingNote
                    do_num={selected}
                    sx={{ height: "21rem" }}
                />
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: "2rem",
                }}
            >
                <div>
                    <BarChart
                        xAxis={[
                            {
                                label: "Loading Quantity",
                                scaleType: "band",
                                data: ["group A", "group B", "group C"],
                            },
                        ]}
                        series={[
                            { data: [4, 3, 5] },
                            { data: [1, 6, 3] },
                            { data: [2, 5, 6] },
                        ]}
                        width={500}
                        height={300}
                    />
                </div>
                <div>
                    <BarChart
                        xAxis={[
                            {
                                label: "Loading Quality",
                                scaleType: "band",
                                data: ["group A", "group B", "group C"],
                            },
                        ]}
                        series={[
                            { data: [4, 3, 5] },
                            { data: [1, 6, 3] },
                            { data: [2, 5, 6] },
                        ]}
                        width={500}
                        height={300}
                    />
                </div>
            </div>
        </Box>
    );
}
