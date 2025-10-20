import React from "react";
import "./DescripcionProducto.css";
import { FaStar } from "react-icons/fa";

const DescripcionProducto = ({ producto, onVolver }) => {
  if (!producto || !producto.nombre) {
    return (
      <div className="descripcion-producto-error">
        <p>No se encontró la información del producto.</p>
        {onVolver && (
          <button className="btn-volver" onClick={onVolver}>
            ← Volver
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="descripcion-producto">
      <div className="producto-detalle">
        {/* 📦 Cuadro de imagen grande */}
        <div className="producto-imagen-placeholder">
          <div className="imagen-cuadro">
            <p>Imagen del producto</p>
          </div>
          {/* 🔵 Círculos de navegación */}
          <div className="imagen-circulos">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="circulo"></span>
            ))}
          </div>
        </div>

        {/* 📋 Información del producto */}
        <div className="producto-info">
          <h2>{producto.nombre}</h2>
          <p>{producto.descripcion}</p>

          <div className="producto-calificacion">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} color="#FFD700" />
            ))}
            <p>Calificación promedio</p>
          </div>

          <div className="producto-cantidad">
            <label htmlFor="cantidad">Cantidad: </label>
            <select id="cantidad">
              <option>1 unidad</option>
              <option>2 unidades</option>
              <option>3 unidades</option>
            </select>

            <div className="producto-stock">
              <p>N° Disponibles: {producto.stock || "10"}</p>
            </div>
          </div>

          <div className="medios-pago">
            <p>Medios de pago</p>
            <div className="logos-pago">
              {/* Aquí irán los logos más adelante */}
            </div>
          </div>

          <div className="botones-compra">
            <button className="btn-comprar">Comprar Ahora</button>
            <button className="btn-agregar">Agregar al carrito</button>
          </div>

          {onVolver && (
            <button className="btn-volver" onClick={onVolver}>
              ← Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescripcionProducto;
