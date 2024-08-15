import { BarChart, PieChart } from "@mui/x-charts";
import { useEffect, useState } from "react";
import SelectCompNoCont from "../../component/input/SelectCompNoCont";
import { Box } from "@mui/material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import toast, { Toaster } from "react-hot-toast";
import TableCreatedLoadingNote from "../../component/table/TableCreatedLoadingNote";
import moment from "moment";
import AutoCompleteDODB from "../../component/input/AutoCompleteDODB";

// function totalEachMonth ()

export default function DashboardCustomer() {
    const axiosPrivate = useAxiosPrivate();
    const [do_number, _setDoNum] = useState("");
    const setDoNum = value => {
        _setDoNum(value);
    };
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
    const [chartDataset, setChart] = useState([]);

    useEffect(() => {
        (async () => {
            if (!do_number) {
                return;
            }
            try {
                const { data } = await axiosPrivate.get(
                    `/master/do?do_num=${do_number}`
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
    }, [do_number]);

    useEffect(() => {
        (async () => {
            if (!do_number) {
                return;
            }
            try {
                const { data } = await axiosPrivate(
                    `/ln/chartdash?year=${moment().format("YYYY")}&id_do=${do_number}`
                );
                setChart(data);
            } catch (error) {
                console.error(error);
            }
        })();
    }, [do_number]);

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
                    width: "50%",
                }}
            >
                <AutoCompleteDODB
                    onChangeovr={setDoNum}
                    label="Do Number"
                    sx={{ width: "20rem" }}
                />
                <PieChart
                    series={pieData}
                    height={200}
                    margin={{ left: 300 }}
                    slotProps={{
                        legend: {
                            direction: "column",
                            position: {
                                vertical: "middle",
                                horizontal: "left",
                            },
                            padding: 0,
                        },
                    }}
                />
                <TableCreatedLoadingNote
                    do_num={do_number}
                    sx={{ height: "21rem" }}
                />
            </div>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    gap: "2rem",
                    width: "50%",
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
                                          label: `Loading Quantity ${moment().format("YYYY")}`,
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
                                          label: `Loading Quantity (${moment().format("YYYY")})`,
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
                                          label: "Netto Quantity",
                                          valueFormatter: value => value,
                                      },
                                  ]
                        }
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
                                          label: `Loading Quantity (${moment().format("YYYY")})`,
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
                        height={300}
                    />
                </div>
            </div>
        </Box>
    );
}
