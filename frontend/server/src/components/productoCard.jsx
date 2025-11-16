import React from "react";
import "./productoCard.css";

const ProductoCard = ({ producto }) => {
  const precio = Number(producto.precio);

  return (
    <div className="producto-card">
      {producto.imagen_url ? (
        <div className="imagen-placeholder">
          <img src={producto.imagen_url} alt={producto.nombre} />
        </div>
      ) : (
        <div className="imagen-placeholder">Sin imagen</div>
      )}
      <div className="producto-info">
        <h3 className="producto-nombre">{producto.nombre}</h3>
        <p className="precio">${Number(producto.precio).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductoCard;
