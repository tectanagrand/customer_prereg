import { ManageAccounts, Pageview } from "@mui/icons-material";
import { Button, Divider, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import TableLastOSRequested from "./TableLastOSRequested";

export default function HomeLogistics() {
    const theme = useTheme();
    const navigate = useNavigate();
    return (
        <>
            <Typography variant="h5">Home</Typography>
            <div
                style={{
                    display: "flex",
                    gap: "2rem",
                    marginLeft: "3rem",
                    marginTop: "3rem",
                }}
            >
                <Tooltip
                    title={
                        <Typography variant="h5">User Management</Typography>
                    }
                    placement="top"
                >
                    <Button
                        sx={{
                            minWidth: "10rem",
                            minHeight: "10rem",
                            borderRadius: "30%",
                            backgroundColor: theme.palette.primary.light,
                        }}
                        onClick={() => navigate("/dashboard/users")}
                        // color={theme.palette.grey[500]}
                        variant="contained"
                    >
                        <ManageAccounts
                            sx={{
                                minWidth: "8rem",
                                minHeight: "8rem",
                            }}
                        />
                    </Button>
                </Tooltip>
                <Tooltip
                    title={<Typography variant="h5">List Request</Typography>}
                    placement="top"
                >
                    <Button
                        sx={{
                            minWidth: "10rem",
                            minHeight: "10rem",
                            borderRadius: "30%",
                            backgroundColor: theme.palette.primary.light,
                        }}
                        onClick={() => navigate("/dashboard/osreq")}
                        variant="contained"
                    >
                        <Pageview
                            sx={{
                                minWidth: "8rem",
                                minHeight: "8rem",
                            }}
                        />
                    </Button>
                </Tooltip>
            </div>
            <Divider sx={{ my: "2rem" }}></Divider>
            <div>
                <Typography variant="h6">Last Requested :</Typography>
                <TableLastOSRequested />
            </div>
        </>
    );
}
