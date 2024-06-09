import { Grid, Typography, Container, Box } from "@mui/material";
import TableMenuAccess from "../../component/table/TableMenuAccess";
import { TextFieldComp } from "../../component/input/TextFieldComp";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
// import axios from 'axios';
// import useAxiosPrivate from 'src/hooks/useAxiosPrivate';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useSession } from "../../provider/sessionProvider";
import LoadingButton from "@mui/lab/LoadingButton";
import NewTableMenuAccess from "../../component/table/NewTableMenuAccess";

export default function MenuAccessPage() {
    const axiosPrivate = useAxiosPrivate();
    const navigate = useNavigate();
    const [dtAccess, setDtAccess] = useState([]);
    const [btnClicked, setBtnclick] = useState(false);
    const [searchParams] = useSearchParams();
    const roleId = useRef("");
    const { session, setSession } = useSession();
    const defaultValues = {
        role_name: "",
    };
    const { handleSubmit, control, reset } = useForm({
        defaultValues: defaultValues,
    });
    const submitDt = async data => {
        setBtnclick(true);
        const insertedDt = {
            role_name: data.role_name,
            role_id: searchParams.get("id_role") ?? "",
            accesses: dtAccess,
            id_user: session.id_user,
        };
        const getAuthorization = async () => {
            const getAuth = await axiosPrivate.post(`/user/getauth`, {
                role_id: session.role_id,
            });
            setSession({ ...session, ["auth"]: getAuth.data });
        };
        try {
            const { data: submission } = await axiosPrivate.post(
                `/user/role/submit`,
                insertedDt
            );
            roleId.current = submission.role_id;
            await getAuthorization();
            alert(submission.message);
            navigate("/dashboard/rolegroup");
            setBtnclick(false);
        } catch (error) {
            setBtnclick(false);
            alert(error);
        }
    };
    const accessDtUp = newTb => {
        setDtAccess(
            newTb.map(item => ({
                id: item.id,
                menu_page: item.menu_page,
                fcreate: item.fcreate,
                fread: item.fread,
                fupdate: item.fupdate,
                fdelete: item.fdelete,
            }))
        );
    };
    const [dtMenu, setdtMenu] = useState([]);
    const dataMenu = dtMenu;

    useEffect(() => {
        roleId.current = searchParams.get("id_role");
        const getSecMtx = async () => {
            const { data } = await axiosPrivate.post(`/user/role`, {
                role_id: roleId.current ? roleId.current : "",
            });
            reset({ role_name: data.role_name });
        };
        getSecMtx();
    }, []);
    return (
        <Container>
            <form onSubmit={handleSubmit(submitDt)}>
                <Typography variant="h4">Menu Access Permission</Typography>
                <Grid container>
                    <Grid item xs={6}>
                        <TextFieldComp
                            name="role_name"
                            control={control}
                            label={"Role Name"}
                        />
                    </Grid>
                </Grid>
                <NewTableMenuAccess
                    dtAccessUp={accessDtUp}
                    role_id={roleId.current ? roleId.current : ""}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <LoadingButton
                        variant="contained"
                        type="submit"
                        sx={{ padding: 2, margin: 2 }}
                        loading={btnClicked}
                    >
                        <Typography>Submit</Typography>
                    </LoadingButton>
                </Box>
            </form>
        </Container>
    );
}
