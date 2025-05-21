import useFetchData from "../../hooks/useFetchData";
import { createContext, useContext, useMemo, useState } from "react";
import CardMasterPlant from "./CardMasterPlant";
import { Box, Pagination } from "@mui/material";

const CachePlant = createContext({ plants: [], updatePlants: () => {} });
export const useCachePlant = () => {
    return useContext(CachePlant);
};

const DashboardMasterPlant = () => {
    //fetch all company first
    const {
        data: company,
        loading: load_company,
        error: error_company,
    } = useFetchData({ url: `/master/comp`, initData: { data: [] } });
    const [plants, setPlants] = useState({});
    const [pagination, setPagination] = useState({
        pageIndex: 1,
        pageSize: 2,
    });

    const toDisplay = useMemo(() => {
        const start = (pagination.pageIndex - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        return company.data.length > 0 ? company.data.slice(start, end) : [];
    }, [pagination.pageIndex, company.data]);
    const updatePlants = (compcode, plants) => {
        setPlants(prev => {
            console.log(prev);
            return { ...prev, [compcode]: plants };
        });
    };
    console.log(toDisplay);
    return (
        <CachePlant.Provider value={{ plants, updatePlants }}>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        width: "100%",
                        flexGrow: 1,
                        justifyContent: "center",
                    }}
                >
                    {toDisplay.length > 0 &&
                        toDisplay.map(value => (
                            <CardMasterPlant
                                companyCode={value.company_code}
                                companyName={value.company_name}
                            />
                        ))}
                </Box>
                <Pagination
                    count={company.count / pagination.pageSize}
                    page={pagination.pageIndex}
                    onChange={(e, value) => {
                        setPagination(prev => ({ ...prev, pageIndex: value }));
                    }}
                />
            </Box>
        </CachePlant.Provider>
    );
};

export default DashboardMasterPlant;
