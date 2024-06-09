import { Tooltip } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Refresh } from "@mui/icons-material";

function RefreshButton({ setRefreshbtn, isLoading, sx }) {
    const refreshBtn = () => {
        setRefreshbtn(true);
    };
    return (
        <Tooltip title={<h3>Refresh</h3>}>
            <LoadingButton
                loading={isLoading}
                onClick={refreshBtn}
                sx={sx}
                variant={"contained"}
            >
                <Refresh></Refresh>
            </LoadingButton>
        </Tooltip>
    );
}

export default RefreshButton;
