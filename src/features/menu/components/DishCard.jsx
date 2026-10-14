function DishCard({ dish }) {
    return (
        <div className="dish-card">
            <h3>{dish.name}</h3>
            <p>Rs. {dish.price.toFixed(2)}</p>
            <small>{dish.category}</small>

            {!dish.available && <span> — Sold out</span>}
        </div>
    );
}

export default DishCard;