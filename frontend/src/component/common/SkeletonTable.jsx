import { Box, Skeleton } from "@mui/material";

export default function SkeletonTable() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
            }}
        >
            <Skeleton variant="rectangular" width="100%" height="20rem" />
            <Skeleton variant="rectangular" width="100%" height="20rem" />
            <Skeleton variant="rectangular" width="100%" height="20rem" />
            <Skeleton variant="rectangular" width="100%" height="20rem" />
            <Skeleton variant="rectangular" width="100%" height="20rem" />
            <Skeleton variant="rectangular" width="100%" height="20rem" />
        </Box>
    );
}
