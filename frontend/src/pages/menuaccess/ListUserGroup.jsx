import {
    Snackbar,
    Alert,
    Box,
    Button,
    Typography,
    Skeleton,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSession } from "../../provider/sessionProvider";
import TableLayout from "../../component/table/TableLayout";
// import useAxiosPrivate from "src/hooks/useAxiosPrivate";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

export default function ListUserGroup() {
    // const axiosPrivate = useAxiosPrivate();
    const columns = ["Role Group", "Date"];
    const axiosPrivate = useAxiosPrivate();
    const { session } = useSession();
    const navigate = useNavigate();
    const [colLength, setColLength] = useState(0);
    const [secGroup, setSec] = useState();
    const [formStat, setFormstat] = useState({
        stat: false,
        type: "success",
        message: "",
    });

    const handleSnackClose = (e, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setFormstat({ ...formStat, stat: false });
    };

    useEffect(() => {
        const getSecurityGroup = async () => {
            // const dataSec = await axiosPrivate.get(`/user/allrole`);
            const { data } = await axiosPrivate.get(`/user/allrole`);
            const dataView = data.map(item => ({
                id: item.role_id,
                user_group: item.role_name,
                createddate: item.created_date,
            }));
            setSec(dataView);
        };
        getSecurityGroup();
    }, []);

    const buttonNewGroup = () => {
        navigate("./create");
    };

    const buttonAction = (action, id) => {
        if (action === "edit") {
            navigate({
                pathname: "./create",
                search: `?id_role=${id}`,
            });
        }
    };

    useEffect(() => {
        setColLength(columns.length + 1);
    }, [secGroup]);

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                    sx={{ width: 200, heigth: 50, margin: 2 }}
                    variant="contained"
                    onClick={buttonNewGroup}
                >
                    <Typography>Create New</Typography>
                </Button>
            </Box>

            {secGroup != undefined ? (
                <TableLayout
                    data={secGroup}
                    buttons={["edit", "disable"]}
                    lengthRow={colLength}
                    onAction={buttonAction}
                    header={columns}
                />
            ) : (
                <Box>
                    <Skeleton animation="wave" height={100} />
                    <Skeleton animation="wave" height={100} />
                    <Skeleton animation="wave" height={100} />
                    <Skeleton animation="wave" height={100} />
                    <Skeleton animation="wave" height={100} />
                </Box>
            )}

            <Snackbar
                open={formStat.stat}
                onClose={handleSnackClose}
                autoHideDuration={3000}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    severity={formStat.type}
                    onClose={handleSnackClose}
                    variant="filled"
                >
                    {formStat.message}
                </Alert>
            </Snackbar>
        </>
    );
}
