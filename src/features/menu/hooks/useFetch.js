import { useState, useEffect } from "react";

export function useFetch(url) {
    const [result, setResult] = useState(null);

    useEffect(() => {
        let active = true;

        const controller = new AbortController();

        fetch(url, { signal: controller.signal })
            .then((res) => {
                if (!res.ok) {
                    throw new Error("HTTP " + res.status);
                }

                return res.json();
            })
            .then((json) => {
                if (active) {
                    setResult({ url, data: json, error: null });
                }
            })
            .catch((err) => {
                if (active) {
                    setResult({ url, data: null, error: err.message });
                }
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [url]);

    return result?.url === url
        ? { data: result.data, isLoading: false, error: result.error }
        : { data: null, isLoading: true, error: null };
}
