import TablePrintTolling from "./TablePrintTolling";
import TablePrintTollingv2 from "./TablePrintTollingv2";
import { Box } from "@mui/material";
import { Button } from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import DialogFormConfirmation from "../../component/common/DialogFormConfirmation";
import TableSimple from "../../component/table/TableSimple";
import { createColumnHelper } from "@tanstack/react-table";
import { formatNumber } from "../../helper/formatting";
import RefreshButton from "../../component/common/RefreshButton";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useForm } from "react-hook-form";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import toast, { Toaster } from "react-hot-toast";

const columnHelper = createColumnHelper();

const FormDeleteRequest = ({ selected, control }) => {
    const columns = useMemo(
        () => [
            columnHelper.accessor("ln_num", {
                header: "Loading Num",
                cell: props => props.getValue(),
            }),
            columnHelper.accessor("id_sto", {
                header: "STO Num",
                cell: props => props.getValue(),
            }),
            columnHelper.accessor("tanggal_surat_jalan", {
                header: "Tanggal Loading",
                cell: props => props.getValue(),
            }),
            columnHelper.display({
                id: "Driver",
                header: "Driver",
                cell: props => {
                    return `${props.row.original.driver_id} - ${props.row.original.driver_name}`;
                },
            }),
            columnHelper.accessor("vhcl_id", {
                header: "No Plat",
                cell: props => props.getValue(),
            }),
            columnHelper.accessor("plan_qty", {
                header: "Plan. Qty.",
                cell: props =>
                    formatNumber(props.getValue(), props.row.original.uom),
            }),
            columnHelper.accessor("desc_con", {
                header: "Material",
                cell: props => props.getValue(),
            }),
        ],
        []
    );
    return (
        <Box sx={{ display: "flex", flexDirection: "column", p: 4 }}>
            <TableSimple
                columns={columns}
                rowsData={selected}
                sx={{ height: "20rem" }}
            />
            <TextFieldComp
                control={control}
                name={"remarks"}
                label="Remark Delete Request"
                rules={{ required: "Please insert this field" }}
            />
        </Box>
    );
};

export default function PrintTolling() {
    const axiosPrivate = useAxiosPrivate();
    const [selectDel, setSelectDel] = useState([]);
    const [open, setOpen] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const {
        trigger,
        getValues,
        control,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: {
            selected_req: [],
            remarks: "",
        },
    });

    useEffect(() => {
        setValue("selected_req", selectDel);
    }, [selectDel]);

    const onNo = () => {
        setOpen(false);
    };

    const onYes = async () => {
        const is_valid = await trigger();
        if (!is_valid) return;
        const values = getValues();
        try {
            const { data } = await axiosPrivate.post("/tol/reqdeltol", {
                selected: values.selected_req,
                remarks: values.remarks,
            });
            toast.success("Delete Request Success");
            setOpen(false);
        } catch (error) {
            toast.error(error.response.data.message);
            console.error(error);
        } finally {
            setRefresh(true);
        }
    };

    return (
        <Box>
            <Toaster />
            <Box
                sx={{ display: "flex", justifyContent: "space-between", m: 2 }}
            >
                <RefreshButton setRefreshbtn={setRefresh} isLoading={refresh} />
                <Button
                    color="error"
                    variant="contained"
                    disabled={selectDel.length < 1}
                    onClick={() => {
                        setOpen(true);
                    }}
                >
                    Request Delete
                </Button>
            </Box>
            <TablePrintTollingv2 {...{ setSelectDel, refresh, setRefresh }} />
            <DialogFormConfirmation
                open={open}
                setOpen={setOpen}
                onNo={onNo}
                onYes={onYes}
                values={selectDel}
                Content={
                    <FormDeleteRequest selected={selectDel} control={control} />
                }
                Title="Confirm Delete Loading Note Tolling"
            />
        </Box>
    );
}
