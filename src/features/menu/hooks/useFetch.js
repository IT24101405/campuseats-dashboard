import { useState, useEffect } from "react";

export function useFetch(url) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        setIsLoading(true);

        fetch(url)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("HTTP " + res.status);
                }

                return res.json();
            })
            .then((json) => {
                if (active) {
                    setData(json);
                }
            })
            .catch((err) => {
                if (active) {
                    setError(err.message);
                }
            })
            .finally(() => {
                if (active) {
                    setIsLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [url]);

    return { data, isLoading, error };
}