import { useState, useEffect } from "react";
import { Box, Button, Typography, Tooltip, IconButton } from "@mui/material";
import {
    DoDisturb,
    Edit,
    SystemUpdate,
    ForwardToInbox,
    DeleteOutline,
} from "@mui/icons-material";
import { useNavigate } from "react-router";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
// import useAxiosPrivate from 'src/hooks/useAxiosPrivate';
import { Axios } from "../../api/axios";
import { useTheme } from "@mui/material/styles";

export default function User() {
    // const axiosPrivate = useAxiosPrivate();
    const [allUserDt, setAllUsr] = useState();
    const [load, setLoad] = useState(false);
    const theme = useTheme();

    const navigate = useNavigate();

    const buttonNewUser = () => {
        navigate("./create");
    };

    useEffect(() => {
        const getAllDataUser = async () => {
            // const getUser = await axiosPrivate.get(`/user/`);
            const getUser = await Axios.get(`/user/show`);

            // console.log(getUser.data.data);
            setAllUsr(getUser.data);
            // setCollen(Object.entries(getUser.data.data[0]).length);
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
                    search: `?iduser=${data.id_user}`,
                },
                {
                    state: {
                        page: "user",
                    },
                }
            );
        } else if (action === "delete") {
            if (confirm("are you sure want to delete ?")) {
                try {
                    // const updateUser = await axiosPrivate.post('/user/updatestat', {
                    //   id: data.id,
                    //   role: data.role,
                    //   is_active: false,
                    // });
                    const updateUser = await Axios.post("/user/delete", {
                        id_user: data.id,
                    });
                    alert(`${updateUser.data.message}`);
                    setLoad(false);
                } catch (error) {
                    alert(`${error.response.data.message}`);
                    setLoad(false);
                }
            }
        } else if (action === "email") {
            try {
                const sendEmail = await Axios.post("/user/email", {
                    id_user: data.id,
                });
                alert(`${sendEmail.data.message}`);
                setLoad(false);
            } catch (error) {
                alert(`${error.response.data.message}`);
                setLoad(false);
            }
        }
    };

    const column = [
        {
            field: "fullname",
            headerName: "Full Name",
            flex: 0.08,
        },
        {
            field: "username",
            headerName: "Username",
            flex: 0.06,
        },
        {
            field: "email",
            headerName: "Email",
            flex: 0.1,
        },
        {
            field: "role_name",
            headerName: "Role",
            flex: 0.05,
        },
        {
            field: "created_date",
            headerName: "Created At",
            flex: 0.08,
        },
        {
            headerName: "Action",
            flex: 0.05,
            renderCell: item => {
                let is_active = item.row.is_active;
                let buttons = [];
                buttons.push(
                    <Tooltip title={<Typography>Edit</Typography>}>
                        <IconButton
                            sx={{
                                backgroundColor: "primary.light",
                                color: theme.palette.primary.contrastText,
                                mx: 1,
                                ":hover": {
                                    color: theme.palette.grey[800],
                                },
                            }}
                            onClick={() => buttonAction("edit", item.row)}
                        >
                            <Edit></Edit>
                        </IconButton>
                    </Tooltip>
                );
                if (is_active) {
                    buttons.push(
                        <Tooltip title={<Typography>Delete</Typography>}>
                            <IconButton
                                sx={{
                                    backgroundColor: "#f2573f",
                                    color: theme.palette.primary.contrastText,
                                    mx: 1,
                                    ":hover": {
                                        color: theme.palette.grey[800],
                                    },
                                }}
                                onClick={() =>
                                    buttonAction("delete", {
                                        id: item.row.id,
                                        role: item.row.role,
                                    })
                                }
                            >
                                <DeleteOutline></DeleteOutline>
                            </IconButton>
                        </Tooltip>
                    );
                } else {
                    buttons.push(
                        <Tooltip title={<Typography>Activate</Typography>}>
                            <IconButton
                                sx={{
                                    backgroundColor: "#4ef542",
                                    color: theme.palette.primary.contrastText,
                                    mx: 1,
                                    ":hover": {
                                        color: theme.palette.grey[800],
                                    },
                                }}
                                onClick={() =>
                                    buttonAction("activate", {
                                        id: item.row.id,
                                        role: item.row.role,
                                    })
                                }
                            >
                                <SystemUpdate></SystemUpdate>
                            </IconButton>
                        </Tooltip>
                    );
                }
                buttons.push(
                    <Tooltip title={<Typography>Send Email</Typography>}>
                        <IconButton
                            sx={{
                                backgroundColor: "#4ea500",
                                color: theme.palette.primary.contrastText,
                                mx: 1,
                                ":hover": {
                                    color: theme.palette.grey[800],
                                },
                            }}
                            onClick={() =>
                                buttonAction("email", {
                                    id: item.row.id,
                                })
                            }
                        >
                            <ForwardToInbox></ForwardToInbox>
                        </IconButton>
                    </Tooltip>
                );
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
                    <Typography>Create New User</Typography>
                </Button>
            </Box>
            {allUserDt != undefined ? (
                <DataGrid
                    rows={allUserDt}
                    columns={column}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 5,
                            },
                        },
                    }}
                    slots={{ toolbar: GridToolbar }}
                    disableColumnFilter
                    disableColumnSelector
                    disableDensitySelector
                    slotProps={{
                        toolbar: {
                            csvOptions: { disableToolbarButton: true },
                            printOptions: { disableToolbarButton: true },
                            showQuickFilter: true,
                        },
                    }}
                />
            ) : (
                <></>
            )}
        </>
    );
}
