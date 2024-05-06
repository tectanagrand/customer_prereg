import HomeCustomer from "./HomeCustomer";
import HomeLogistics from "./HomeLogistics";
import { useSession } from "../../provider/sessionProvider";

export default function Home() {
    const { getPermission } = useSession();
    return (
        <>
            {getPermission("LOCO Request").fread ? (
                <HomeLogistics />
            ) : (
                <HomeCustomer />
            )}
        </>
    );
}
