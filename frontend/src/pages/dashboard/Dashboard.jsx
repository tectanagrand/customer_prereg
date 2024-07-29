import { useState, lazy, Suspense, useEffect } from "react";
import { styled, useTheme } from "@mui/material/styles";
import SvgIcon from "@mui/material/SvgIcon";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LoadingSuspense from "../loadingscreen/Loading";
import { Outlet, useLocation } from "react-router-dom";
// import NavSection from "./NavSection";
import { useMenu } from "../../provider/MenuProvider";
import { useNavigate, Navigate } from "react-router-dom";
import { useSession } from "../../provider/sessionProvider";
// import KpnLogo from "../../images/kpn-logo-3.svg?react";
// import KpnNav from "../../images/kpn-logo.svg?react";
import Cookies from "js-cookie";
import AvatarComp from "./AvatarComp";

const NavSection = lazy(() => import("./NavSection"));
const KpnLogo = lazy(() => import("../../images/kpn-logo-3.svg?react"));
const KpnNav = lazy(() => import("../../images/kpn-logo.svg?react"));

const drawerWidth = 240;

const openedMixin = theme => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
});

const closedMixin = theme => ({
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
    overflowX: "hidden",
});

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: prop => prop !== "open",
})(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    backgroundColor: "#fc3d32",
}));

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: prop => prop !== "open",
})(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
    }),
}));

export default function Dashboard() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { session, setSession } = useSession();
    const { permission } = useMenu();
    const [open, setOpen] = useState(false);
    const [navCol, setNavcol] = useState({
        head: "",
        state: false,
    });
    const [navMenu, setNavmenu] = useState("");

    // useEffect(() => {
    //     if (Cookies.get("accessToken")) {
    //         const getAuthorization = async () => {
    //             try {
    //                 const getAuth = await axiosPrivate.post(
    //                     `/user/authorization`,
    //                     {
    //                         group_id: session.groupid,
    //                     }
    //                 );
    //                 setSession({ ...session, ["permission"]: getAuth.data });
    //             } catch (error) {
    //                 console.error(error);
    //             }
    //         };
    //         getAuthorization();
    //     }
    // }, []);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
        setNavcol({ ...navCol, state: false });
    };

    const updateNavcol = menu => {
        setNavcol(prevNav => {
            setOpen(prevNav.head != menu ? true : !prevNav.state);
            return {
                head: menu,
                state: prevNav.head != menu ? true : !prevNav.state,
            };
        });
    };

    const updateNavmenu = menu => {
        setNavmenu(menu);
    };

    if (
        Cookies.get("access_token") === undefined ||
        Cookies.get("access_token") === ""
    ) {
        return <Navigate to="/login" />;
    }

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        sx={{
                            marginRight: 2,
                            ...(open && { display: "none" }),
                        }}
                    >
                        <SvgIcon
                            component={KpnNav}
                            sx={{ width: "2rem", height: "2rem" }}
                            viewBox="0 0 5000 5000"
                            color="white"
                        />
                    </IconButton>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <div style={{ flexGrow: 1 }}>
                            <h3>Customer Pre Registration App</h3>
                        </div>
                        <AvatarComp></AvatarComp>
                    </div>
                </Toolbar>
            </AppBar>
            <Drawer variant="permanent" open={open}>
                <DrawerHeader>
                    <SvgIcon
                        sx={{ width: "70%", height: "100%", cursor: "pointer" }}
                        component={KpnLogo}
                        viewBox="10 50 700 100"
                        onClick={e => {
                            navigate("/dashboard");
                        }}
                    ></SvgIcon>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === "rtl" ? (
                            <ChevronRightIcon />
                        ) : (
                            <ChevronLeftIcon />
                        )}
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <NavSection
                    menu={permission}
                    collapsemen={navCol}
                    navmen={navMenu}
                    onUpNavCol={updateNavcol}
                    onUpNavMenu={updateNavmenu}
                />
            </Drawer>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, height: "100%", width: "100%" }}
            >
                <DrawerHeader />
                {session.menuname && (
                    <h4 style={{ margin: "0 0 1rem 0" }}>
                        {session.menuname[location.pathname]}
                    </h4>
                )}
                <Suspense fallback={<LoadingSuspense />}>
                    <Outlet />
                </Suspense>
            </Box>
        </Box>
    );
}
