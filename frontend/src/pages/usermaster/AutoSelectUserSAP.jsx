import { LazySelectComp } from "../../component/input/LazySelectComp";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash";

export default function AutoSelectUserSAP({
    name,
    label,
    control,
    rules,
    onChangeControlOvr,
    roleName,
    ...props
}) {
    const axiosPrivate = useAxiosPrivate();
    const role = useRef(roleName);
    const limit = 10;
    const [dataRow, setDataRow] = useState([]);
    let paginationRef = useRef({
        offset: 0,
        hasMore: true,
    });

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q) => {
        setLoading(true);
        try {
            let query = "";
            if (role.current === "CUSTOMER") {
                query = `master/cust?limit=${limit}&offset=${offset}&q=${q}`;
            } else if (role.current === "VENDOR") {
                query = `master/ven?limit=${limit}&offset=${offset}&q=${q}`;
            } else if (role.current === "INTERCO") {
                query = `master/inter?limit=${limit}&offset=${offset}&q=${q}`;
            }
            if (query !== "") {
                const { data: rowData } = await axiosPrivate.get(query);
                return {
                    list: rowData.data,
                    pagination: {
                        offset: offset + limit,
                        hasMore: offset + limit < rowData.count,
                    },
                };
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async () => {
        if (role.current !== "" && role.current) {
            if (!paginationRef.current.hasMore) return;
            setLoading(true);
            try {
                const { list, pagination: resPagination } = await fetchData(
                    limit,
                    paginationRef.current.offset,
                    searchQuery
                );
                const dataList = list?.map(item => ({
                    ...item,
                    value:
                        role.current === "CUSTOMER" ||
                        role.current === "INTERCO"
                            ? item.kunnr
                            : item.lifnr,
                    id:
                        role.current === "CUSTOMER" ||
                        role.current === "INTERCO"
                            ? item.kunnr
                            : item.lifnr,
                    label: item.name,
                }));

                setDataRow(prev => [
                    ...prev,
                    ...dataList.filter(
                        x => !prev.map(u => u.value).includes(x.value)
                    ),
                ]);

                paginationRef.current = resPagination;
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        role.current = roleName;
        (async () => {
            paginationRef.current.offset = 0;
            try {
                const { list, pagination: resPagination } = await fetchData(
                    limit,
                    paginationRef.current.offset,
                    searchQuery
                );
                const dataList = list?.map(item => ({
                    ...item,
                    value:
                        role.current === "CUSTOMER" ||
                        role.current === "INTERCO"
                            ? item.kunnr
                            : item.lifnr,
                    id:
                        role.current === "CUSTOMER" ||
                        role.current === "INTERCO"
                            ? item.kunnr
                            : item.lifnr,
                    label: item.name,
                }));
                setDataRow([...dataList]);
                paginationRef.current = resPagination;
            } catch (error) {
                console.error(error);
            }
        })();
    }, [searchQuery, roleName]);

    return (
        <>
            <LazySelectComp
                loading={isLoading}
                options={dataRow}
                onFetchMore={fetchMore}
                hasMore={paginationRef.current.hasMore}
                name={name}
                label={label}
                control={control}
                rules={rules}
                defaultValue={null}
                onControlChgOvr={onChangeControlOvr}
                onChangeovr={debounce(e => {
                    if (!e.hasOwnProperty("target")) {
                        setQuery("");
                    } else {
                        setQuery(e.target.value);
                    }
                }, 1000)}
                onBlurovr={debounce(e => {
                    setQuery(e.target.value);
                }, 1000)}
                {...props}
            />
        </>
    );
}
