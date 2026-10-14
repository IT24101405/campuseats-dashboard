import { useState } from "react";
import { apiUrl } from "../api";

function OrderPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        qty: 1,
    });

    const [errors, setErrors] = useState({});
    const [done, setDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    function validate(values) {
        const newErrors = {};

        if (values.name.trim().length < 2 || values.name.trim().length > 100) {
            newErrors.name = "Name too short";
        }

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
            newErrors.email = "Enter a valid email";
        }

        if (!Number.isInteger(Number(values.qty)) || Number(values.qty) < 1 || Number(values.qty) > 2147483647) {
            newErrors.qty = "Qty must be ≥ 1";
        }

        return newErrors;
    }

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting || !apiUrl) return;
        setSubmitError("");

        const foundErrors = validate(form);
        setErrors(foundErrors);

        if (Object.keys(foundErrors).length === 0) {
            setSubmitting(true);
            try {
                const response = await fetch(`${apiUrl}/api/orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...form, qty: Number(form.qty) }),
                    signal: AbortSignal.timeout(30000),
                });
                if (response.status !== 201) {
                    throw new Error(response.status === 400
                        ? "Please check your name, email and whole-number quantity."
                        : "The server could not save your order. Please try again later.");
                }
                setDone(true);
            } catch (error) {
                setSubmitError(error.name === "TypeError" || error.name === "TimeoutError"
                    ? "Could not confirm your order. Check your connection. If you retry, a duplicate order may be created."
                    : error.message);
            } finally {
                setSubmitting(false);
            }
        }
    }

    if (done) {
        return <p>Thanks, {form.name}! Order received.</p>;
    }

    return (
        <div>
            <h2>Place Order</h2>
            {!apiUrl && <p role="status">Demo mode: the backend is not configured. Orders cannot be saved yet.</p>}
            {submitError && <p role="alert">{submitError}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        name="name"
                        placeholder="Name"
                        value={form.name}
                        onChange={handleChange}
                    />
                    {errors.name && <span> {errors.name}</span>}
                </div>

                <div>
                    <input
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                    />
                    {errors.email && <span> {errors.email}</span>}
                </div>

                <div>
                    <input
                        name="qty"
                        type="number"
                        value={form.qty}
                        onChange={handleChange}
                    />
                    {errors.qty && <span> {errors.qty}</span>}
                </div>

                <button type="submit" disabled={submitting || !apiUrl}>{submitting ? "Saving..." : "Place order"}</button>
            </form>
        </div>
    );
}

export default OrderPage;
