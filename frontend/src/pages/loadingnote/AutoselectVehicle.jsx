import { LazySelectComp } from "../../component/input/LazySelectComp";
import { Axios } from "../../api/axios";
import { useState, useRef, useEffect } from "react";
import { debounce } from "lodash";

export default function AutoSelectVehicle({
    name,
    label,
    control,
    rules,
    ...props
}) {
    const limit = 10;
    const max = 999999;
    const [dataRow, setDataRow] = useState([]);
    let paginationRef = useRef({
        offset: 1,
        hasMore: true,
    });

    const [searchQuery, setQuery] = useState("");
    const [isLoading, setLoading] = useState(false);

    const fetchData = async (limit, offset, q) => {
        setLoading(true);
        try {
            const { data: rowData } = await Axios.get(
                `master/truck?q=${q}&limit=${limit}&offset=${offset}`
            );
            return {
                list: rowData.data,
                pagination: {
                    offset: offset + limit,
                    hasMore: offset + limit < max,
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
                value: item.NNOPOLISI,
                id: item.NNOPOLISI,
                label: item.NNOPOLISI,
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
            paginationRef.current.offset = 1;
            try {
                const { list, pagination: resPagination } = await fetchData(
                    limit,
                    paginationRef.current.offset,
                    searchQuery
                );
                const dataList = list?.map(item => ({
                    ...item,
                    value: item.NNOPOLISI,
                    id: item.NNOPOLISI,
                    label: item.NNOPOLISI,
                }));
                setDataRow([...dataList]);
                paginationRef.current = resPagination;
            } catch (error) {
                console.error(error);
            }
        })();
    }, [searchQuery]);

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
                onChangeovr={debounce(e => {
                    setQuery(e.target.value);
                }, 1000)}
                onBlurovr={debounce(e => {
                    setQuery(e.target.value);
                }, 1000)}
                {...props}
            />
        </>
    );
}
