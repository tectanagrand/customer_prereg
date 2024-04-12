import { useState, useEffect } from "react";
import {
    Box,
    Button,
    Typography,
    Tooltip,
    IconButton,
    Backdrop,
    CircularProgress,
} from "@mui/material";
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
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useTheme } from "@mui/material/styles";

export default function User() {
    const axiosPrivate = useAxiosPrivate();
    const [allUserDt, setAllUsr] = useState();
    const [loadPage, setLoadpage] = useState(false);
    const [load, setLoad] = useState(false);
    const theme = useTheme();

    const navigate = useNavigate();

    const buttonNewUser = () => {
        navigate("./create");
    };

    useEffect(() => {
        const getAllDataUser = async () => {
            // const getUser = await axiosPrivate.get(`/user/`);
            const getUser = await axiosPrivate.get(`/user/show`);

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
                    const updateUser = await axiosPrivate.post("/user/delete", {
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
            setLoadpage(true);
            try {
                const sendEmail = await axiosPrivate.post("/user/email", {
                    id_user: data.id,
                });
                alert(`${sendEmail.data.message}`);
                setLoad(false);
            } catch (error) {
                alert(`${error.response.data.message}`);
                setLoad(false);
            } finally {
                setLoadpage(false);
            }
        }
    };

    const column = [
        {
            field: "fullname",
            headerName: "Full Name",
            width: 300,
        },
        {
            field: "username",
            headerName: "Username",
            width: 200,
        },
        {
            field: "email",
            headerName: "Email",
            width: 300,
        },
        {
            field: "telf",
            headerName: "Phone Number",
            width: 300,
        },
        {
            field: "role_name",
            headerName: "Role",
            width: 100,
        },
        {
            field: "created_date",
            headerName: "Created At",
            width: 200,
        },
        {
            headerName: "Action",

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
                // if (is_active) {
                //     buttons.push(
                //         <Tooltip title={<Typography>Delete</Typography>}>
                //             <IconButton
                //                 sx={{
                //                     backgroundColor: "#f2573f",
                //                     color: theme.palette.primary.contrastText,
                //                     mx: 1,
                //                     ":hover": {
                //                         color: theme.palette.grey[800],
                //                     },
                //                 }}
                //                 onClick={() =>
                //                     buttonAction("delete", {
                //                         id: item.row.id,
                //                         role: item.row.role,
                //                     })
                //                 }
                //             >
                //                 <DeleteOutline></DeleteOutline>
                //             </IconButton>
                //         </Tooltip>
                //     );
                // } else {
                //     buttons.push(
                //         <Tooltip title={<Typography>Activate</Typography>}>
                //             <IconButton
                //                 sx={{
                //                     backgroundColor: "#4ef542",
                //                     color: theme.palette.primary.contrastText,
                //                     mx: 1,
                //                     ":hover": {
                //                         color: theme.palette.grey[800],
                //                     },
                //                 }}
                //                 onClick={() =>
                //                     buttonAction("activate", {
                //                         id: item.row.id,
                //                         role: item.row.role,
                //                     })
                //                 }
                //             >
                //                 <SystemUpdate></SystemUpdate>
                //             </IconButton>
                //         </Tooltip>
                //     );
                // }
                buttons.push(
                    <Tooltip title={<Typography>Password Reset</Typography>}>
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
                                pageSize: 10,
                            },
                        },
                    }}
                    slots={{ toolbar: GridToolbar }}
                    disableColumnFilter
                    disableColumnSelector
                    disableDensitySelector
                    getRowHeight={() => "auto"}
                    getEstimatedRowHeight={() => 200}
                    slotProps={{
                        toolbar: {
                            csvOptions: { disableToolbarButton: true },
                            printOptions: { disableToolbarButton: true },
                            showQuickFilter: true,
                        },
                    }}
                    sx={{
                        "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell":
                            {
                                py: "15px",
                            },
                        height: "70vh",
                    }}
                />
            ) : (
                <></>
            )}
            <Backdrop
                sx={{ color: "#fff", zIndex: theme => theme.zIndex.drawer + 1 }}
                open={loadPage}
            >
                <CircularProgress />
            </Backdrop>
        </>
    );
}
