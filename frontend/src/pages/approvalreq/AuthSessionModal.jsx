import { useSession } from "../../provider/sessionProvider";
import { useEffect, useState } from "react";
import LoginModal from "../login/LoginModal";
import { Outlet } from "react-router-dom";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const AuthSessionModal = () => {
    const axiosPrivate = useAxiosPrivate();
    const { session } = useSession();
    const [openModal, setOpenModal] = useState(false);
    useEffect(() => {
        // console.log(session.id_user);
        // console.log(session.role);
        if (!session?.id_user || session?.role !== "LOGISTIC") {
            setOpenModal(true);
        } else {
            setOpenModal(false);
        }
        (async () => {
            try {
                await axiosPrivate("/user/validatetoken");
            } catch (error) {
                console.error(error);
            }
        })();
    }, [session]);
    const modalClose = () => {
        setOpenModal(false);
    };
    return (
        <div>
            <LoginModal modalState={openModal} closeModal={modalClose} />
            <Outlet />
        </div>
    );
};

export default AuthSessionModal;
