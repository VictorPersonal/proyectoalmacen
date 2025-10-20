import React from "react";
import "./productoCard.css";

const ProductoCard = ({ producto }) => {
  const precio = Number(producto.precio);

  return (
    <div className="producto-card">
      <div className="imagen-placeholder">Imagen</div>
      <h3>{producto.nombre}</h3>
      <p className="precio">
        ${isNaN(precio) ? "0.00" : precio.toFixed(2)}
      </p>
    </div>
  );
};

export default ProductoCard;
