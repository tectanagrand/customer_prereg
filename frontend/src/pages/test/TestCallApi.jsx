import { Axios } from "../../api/axios";
import { useEffect } from "react";

export default function TestCallApi() {
    useEffect(() => {
        (async () => {
            try {
                const { data } = await Axios.get("/ln/postzwbchain", {
                    auth: {
                        username: "test",
                        password: "test",
                    },
                });
            } catch (error) {
                console.error(error);
            }
        })();
    }, []);
    return <div>TestCallApi</div>;
}
