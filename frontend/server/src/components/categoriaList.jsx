import React from "react";
import "./productoCard.css";

const ProductoCard = ({ producto }) => {
  // Obtener la primera imagen del array producto_imagen
  const primeraImagen = producto.producto_imagen && producto.producto_imagen.length > 0 
    ? producto.producto_imagen[0].url 
    : null;

  return (
    <div className="producto-card">
      {primeraImagen ? (
        <div className="imagen-container">
          <img 
            src={primeraImagen} 
            alt={producto.nombre} 
            className="producto-imagen"
            onError={(e) => {
              // Si la imagen falla al cargar, mostrar placeholder
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="imagen-placeholder" style={{display: 'none'}}>
            Sin imagen
          </div>
        </div>
      ) : (
        <div className="imagen-placeholder">
          Sin imagen
        </div>
      )}
      <div className="producto-info">
        <h3 className="producto-nombre">{producto.nombre}</h3>
        <p className="precio">${Number(producto.precio).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductoCard;