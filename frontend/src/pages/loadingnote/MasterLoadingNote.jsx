import { useState, useEffect } from "react";
import { Box, Button, Typography, Tooltip, IconButton } from "@mui/material";
import { DoDisturb, Edit, SystemUpdate } from "@mui/icons-material";
import { useSession } from "../../provider/sessionProvider";
import { useNavigate } from "react-router";
import { DataGrid } from "@mui/x-data-grid";
import { Axios } from "../../api/axios";
import ProgressStat from "../../component/common/ProgressStat";

export default function MasterLoadingNote() {
    const [loadNote, setLoadNote] = useState();
    const [load, setLoad] = useState(false);
    const { getPermission } = useSession();

    const navigate = useNavigate();

    const buttonNewUser = () => {
        navigate("./create");
    };

    useEffect(() => {
        const allow = getPermission("Loading Note").fcreate;
        const getAllDataUser = async () => {
            const { data } = await Axios.get("/ln/lnuser?isallow=" + allow, {
                withCredentials: true,
            });
            // console.log(getUser.data.data);
            setLoadNote(data.data);
            setLoad(false);
        };
        getAllDataUser();
    }, [load]);

    const buttonAction = async (action, data) => {
        setLoad(true);
        if (action === "edit") {
            navigate(
                {
                    pathname: "./create",
                    search: `?idloadnote=${data.id}`,
                },
                {
                    state: {
                        page: "user",
                    },
                }
            );
        }
    };

    const column = [
        {
            field: "id_loadnote",
            headerName: "Loading Note",
            flex: 0.05,
        },
        {
            field: "id_do",
            headerName: "DO Number",
            flex: 0.05,
        },
        {
            field: "plant",
            headerName: "Plant",
            flex: 0.03,
        },
        {
            field: "name",
            headerName: "Company",
            flex: 0.05,
        },
        {
            field: "planned_qty",
            headerName: "Planning Quantity",
            flex: 0.05,
        },
        {
            field: "cur_pos",
            headerName: "Position",
            flex: 0.05,
            renderCell: item => {
                let status = item.row.cur_pos;
                let severity;
                let text;
                let message;
                if (status === "INIT") {
                    severity = "primary.main";
                    text = "white";
                    message = "CUSTOMER";
                } else if (status === "FINA") {
                    severity = "warning.main";
                    text = "black";
                    message = "LOGISTIC";
                } else if (status === "END") {
                    severity = "success.main";
                    text = "white";
                    message = "END";
                }
                return (
                    <>
                        <ProgressStat color={severity}>
                            <Typography color={text} variant="body">
                                {message}
                            </Typography>
                        </ProgressStat>
                    </>
                );
            },
        },
        {
            field: "created_date",
            headerName: "Created Date",
            flex: 0.05,
        },
        {
            headerName: "Action",
            flex: 0.03,
            renderCell: item => {
                let buttons = [];
                if (item.row.cur_pos !== "END") {
                    buttons.push(
                        <Tooltip title={<Typography>Edit</Typography>}>
                            <IconButton
                                sx={{ backgroundColor: "primary.light", mx: 1 }}
                                onClick={() =>
                                    buttonAction("edit", { id: item.row.id })
                                }
                            >
                                <Edit></Edit>
                            </IconButton>
                        </Tooltip>
                    );
                }
                return buttons;
            },
        },
    ];

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                    sx={{ width: 200, heigth: 50, margin: 2 }}
                    variant="contained"
                    onClick={buttonNewUser}
                >
                    <Typography>Request New</Typography>
                </Button>
            </Box>
            {loadNote != undefined ? (
                <DataGrid
                    rows={loadNote}
                    columns={column}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 5,
                            },
                        },
                    }}
                />
            ) : (
                <></>
            )}
        </>
    );
}
