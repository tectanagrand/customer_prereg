import { Axios } from "../../api/axios";
import { LazySelectCompNoCont } from "../../component/input/LazySelectCompNoCont";
import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash";

export default function AutoCompleteDOList({
    onChangeovr,
    cust,
    who,
    ...props
}) {
    const limit = 10;
    const [dataRow, setDataRow] = useState([]);
    let paginationRef = useRef({
        offset: 0,
        hasMore: true,
    });

    let overrideChange = debounce(e => {
        setQuery(e.target.value);
    }, 1000);

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q) => {
        setLoading(true);
        try {
            let doData;
            if (who === "wb") {
                doData = await Axios.get(
                    `ln/osdowb?cust=${cust}&limit=${limit}&offset=${offset}`
                );
            } else {
                doData = await Axios.get(
                    `ln/osdo?cust=${cust}&limit=${limit}&offset=${offset}`
                );
            }
            const { data: rowData } = doData;
            return {
                list: rowData.data,
                pagination: {
                    offset: offset + limit,
                    hasMore: offset + limit < rowData.count,
                },
            };
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMore = async () => {
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
                value: item.id_do,
                id: item.id_do,
                label: item.id_do,
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
    };

    useEffect(() => {
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
                    value: item.id_do,
                    id: item.id_do,
                    label: item.id_do,
                }));
                setDataRow([...dataList]);
                paginationRef.current = resPagination;
            } catch (error) {
                console.error(error);
            }
        })();
    }, [cust]);

    return (
        <>
            <LazySelectCompNoCont
                loading={isLoading}
                options={dataRow}
                onFetchMore={fetchMore}
                hasMore={paginationRef.current.hasMore}
                defaultValue={null}
                onChangeovr={e => {
                    // console.log(e);
                    onChangeovr(e.target.value ?? e.target.outerText);
                    overrideChange(e);
                }}
                onBlurovr={e => {
                    onChangeovr(e.target.value);
                    overrideChange(e);
                }}
                {...props}
            />
        </>
    );
}
