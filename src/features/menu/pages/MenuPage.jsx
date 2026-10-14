import { useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useFetch } from "../hooks/useFetch";
import MenuList from "../components/MenuList";

function MenuPage() {
    const [query, setQuery] = useState("");

    const debounced = useDebounce(query, 400);

    const {
        data: dishes,
        isLoading,
        error,
    } = useFetch("/menu.json");

    if (isLoading) {
        return <p>Loading menu...</p>;
    }

    if (error) {
        return <p>Could not load menu: {error}</p>;
    }

    const filtered = dishes.filter((dish) =>
        dish.name.toLowerCase().includes(debounced.toLowerCase())
    );

    return (
        <div>
            <h1>CampusEats Menu</h1>

            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes..."
            />

            <MenuList dishes={filtered} />
        </div>
    );
}

export default MenuPage;