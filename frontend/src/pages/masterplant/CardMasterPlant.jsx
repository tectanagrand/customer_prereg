import { useCachePlant } from "./DashboardMasterPlant";
import TableSimple from "../../component/table/TableSimple";
import { Card, IconButton, Box, Button } from "@mui/material";
import { useMemo, useRef, useState } from "react";
import { Edit, DeleteForever, Refresh, Add } from "@mui/icons-material";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { LoadingButton } from "@mui/lab";
import CreateEditPlantModal from "./CreateEditPlantModal";

const CardMasterPlant = ({ companyCode, companyName }) => {
    const cachePlant = useCachePlant();
    console.log(cachePlant.plants);
    const axiosPrivate = useAxiosPrivate();
    const refDialog = useRef();
    const [loading, setLoading] = useState(false);
    const refreshData = async () => {
        try {
            setLoading(true);
            const { data } = await axiosPrivate.get(
                `/master/plant/${companyCode}`
            );
            cachePlant.updatePlants(companyCode, data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const plantRows = useMemo(() => {
        const plants = cachePlant.plants[companyCode];

        if (plants == undefined) {
            refreshData();
        }
        return plants ?? [];
    }, [cachePlant.plants[companyCode], companyCode]);
    const columns = [
        {
            header: "Plant Code",
            accessorKey: "plant_code",
            cell: props => props.getValue(),
        },
        {
            header: "Plant Name",
            accessorKey: "plant_name",
            cell: props => props.getValue(),
        },
        {
            header: "Action",
            id: "action",
            cell: row => {
                return (
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton>
                            <Edit />
                        </IconButton>
                        <IconButton>
                            <DeleteForever />
                        </IconButton>
                    </Box>
                );
            },
        },
    ];
    console.log(refDialog.current);
    return (
        <Card sx={{ width: "50%", borderStyle: "solid", borderSize: "1px" }}>
            <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <h3>{`${companyCode} - ${companyName}`}</h3>
                    <Box>
                        <LoadingButton
                            variant="contained"
                            sx={{ mr: 1 }}
                            loading={loading}
                            onClick={e => {
                                refreshData();
                            }}
                        >
                            <Refresh />{" "}
                        </LoadingButton>
                        <Button
                            variant="contained"
                            onClick={() =>
                                refDialog.current.actiontoForm("create", {})
                            }
                        >
                            <Add />
                        </Button>
                    </Box>
                </Box>
                <TableSimple
                    rowsData={plantRows}
                    columns={columns}
                    stickyHeader
                />
                <CreateEditPlantModal ref={refDialog} />
            </Box>
        </Card>
    );
};

export default CardMasterPlant;
