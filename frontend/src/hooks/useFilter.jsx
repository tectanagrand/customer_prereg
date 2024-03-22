import { useState } from "react";

export default function useFilter() {
    const [filters, setFilter] = useState([]);

    return {
        filters,
        onColumnFilterChange: setFilter,
    };
}
