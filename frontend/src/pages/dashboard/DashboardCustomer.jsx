import { BarChart, PieChart } from "@mui/x-charts";
import { useEffect, useState } from "react";
import SelectCompNoCont from "../../component/input/SelectCompNoCont";
import { Box } from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import TableCreatedLoadingNote from "../../component/table/TableCreatedLoadingNote";
import moment from "moment";

// function totalEachMonth ()

export default function DashboardCustomer() {
    const axiosPrivate = useAxiosPrivate();
    const [selected, _setSelected] = useState("");
    const [pieData, setPieData] = useState([
        {
            data: [
                {
                    id: 0,
                    value: 100,
                    label: "Remaining Quantity",
                },
                {
                    id: 1,
                    value: 100,
                    label: "Pending Quantity",
                },
                {
                    id: 2,
                    value: 100,
                    label: "Used Quantity",
                },
            ],
        },
    ]);
    const [OpDo, setOpDo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chartDataset, setChart] = useState([]);
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

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axiosPrivate.get(
                    `/master/do?do_num=${selected}`
                );
                setPieData([
                    {
                        data: [
                            {
                                id: 0,
                                value:
                                    parseFloat(data.SLIP.KWMENG) -
                                    parseFloat(data.TOTALTEMP) -
                                    parseFloat(data.TOTALSAP),
                                label: "Remaining Quantity Contract",
                            },
                            {
                                id: 1,
                                value: parseFloat(data.TOTALTEMP),
                                label: "Pending Quantity",
                            },
                            {
                                id: 2,
                                value: parseFloat(data.TOTALSAP),
                                label: "Used Quantity",
                            },
                        ],
                    },
                ]);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [selected]);

    useEffect(() => {
        if (selected !== "") {
            (async () => {
                try {
                    const { data } = await axiosPrivate(
                        `/ln/chartdash?year=${moment().format("YYYY")}&id_do=${selected}`
                    );
                    setChart(data);
                } catch (error) {
                    console.error(error);
                }
            })();
        }
    }, [selected]);

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
                <PieChart series={pieData} width={800} height={200} />
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
                        dataset={chartDataset.map(item => ({
                            mth: item.mth,
                            plan_qty: parseFloat(item.plan_qty),
                            actual_qty: parseFloat(item.actual_qty),
                            ffa: parseFloat(item.ffa),
                            moist: parseFloat(item.moist),
                            dirt: parseFloat(item.dirt),
                        }))}
                        xAxis={
                            chartDataset.length < 1
                                ? [
                                      {
                                          label: "Loading Quantity",
                                          scaleType: "band",
                                          data: [
                                              "Jan",
                                              "Feb",
                                              "Mar",
                                              "Apr",
                                              "May",
                                              "Jun",
                                              "Jul",
                                              "Aug",
                                              "Sep",
                                              "Oct",
                                              "Nov",
                                              "Dec",
                                          ],
                                      },
                                  ]
                                : [
                                      {
                                          label: "Loading Quantity",
                                          scaleType: "band",
                                          dataKey: "mth",
                                      },
                                  ]
                        }
                        series={
                            chartDataset.length < 1
                                ? [{ data: [0] }, { data: [0] }, { data: [0] }]
                                : [
                                      {
                                          dataKey: "plan_qty",
                                          label: "Planning Quantity",
                                          valueFormatter: value => value,
                                      },
                                      {
                                          dataKey: "actual_qty",
                                          label: "Actual Quantity",
                                          valueFormatter: value => value,
                                      },
                                  ]
                        }
                        width={500}
                        height={300}
                    />
                </div>
                <div>
                    <BarChart
                        dataset={chartDataset.map(item => ({
                            mth: item.mth,
                            plan_qty: parseFloat(item.plan_qty),
                            actual_qty: parseFloat(item.actual_qty),
                            ffa: parseFloat(item.ffa),
                            moist: parseFloat(item.moist),
                            dirt: parseFloat(item.dirt),
                        }))}
                        xAxis={
                            chartDataset.length < 1
                                ? [
                                      {
                                          label: "Loading Quantity",
                                          scaleType: "band",
                                          data: [
                                              "Jan",
                                              "Feb",
                                              "Mar",
                                              "Apr",
                                              "May",
                                              "Jun",
                                              "Jul",
                                              "Aug",
                                              "Sep",
                                              "Oct",
                                              "Nov",
                                              "Dec",
                                          ],
                                      },
                                  ]
                                : [
                                      {
                                          label: "Loading Quantity",
                                          scaleType: "band",
                                          dataKey: "mth",
                                      },
                                  ]
                        }
                        series={
                            chartDataset.length < 1
                                ? [{ data: [0] }, { data: [0] }, { data: [0] }]
                                : [
                                      {
                                          dataKey: "ffa",
                                          label: "FFA",
                                          valueFormatter: value => value,
                                      },
                                      {
                                          dataKey: "moist",
                                          label: "Moist",
                                          valueFormatter: value => value,
                                      },
                                      {
                                          dataKey: "dirt",
                                          label: "Dirt",
                                          valueFormatter: value => value,
                                      },
                                  ]
                        }
                        width={500}
                        height={300}
                    />
                </div>
            </div>
        </Box>
    );
}
