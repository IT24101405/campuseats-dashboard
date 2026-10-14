import { useState } from "react";

function OrderPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        qty: 1,
    });

    const [errors, setErrors] = useState({});
    const [done, setDone] = useState(false);

    function validate(values) {
        const newErrors = {};

        if (values.name.trim().length < 2) {
            newErrors.name = "Name too short";
        }

        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
            newErrors.email = "Enter a valid email";
        }

        if (Number(values.qty) < 1) {
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

    function handleSubmit(e) {
        e.preventDefault();

        const foundErrors = validate(form);
        setErrors(foundErrors);

        if (Object.keys(foundErrors).length === 0) {
            setDone(true);
        }
    }

    if (done) {
        return <p>Thanks, {form.name}! Order received.</p>;
    }

    return (
        <div>
            <h2>Place Order</h2>

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

                <button type="submit">Place order</button>
            </form>
        </div>
    );
}

export default OrderPage;