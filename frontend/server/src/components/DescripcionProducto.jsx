import React, { useState } from "react";
import "./DescripcionProducto.css";
import { FaStar } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DescripcionProducto = ({ producto, onVolver }) => {
  const [cantidad, setCantidad] = useState(1);
  const navigate = useNavigate();

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

  // 👉 Función para agregar al carrito (con token vía cookies)
  const handleAgregarCarrito = async () => {
    try {
      // Ya no tomamos la cédula ni el token desde localStorage
      // El backend leerá el usuario autenticado desde las cookies

      const productoData = {
        idproducto: producto.id_producto || producto.id || producto.idproducto,
        cantidad: cantidad,
      };

      const res = await axios.post(
        "http://localhost:4000/api/carrito/agregar",
        productoData,
        {
          withCredentials: true, // 👈 Esto envía automáticamente las cookies al backend
        }
      );

      console.log("✅ Producto agregado:", res.data);
      alert("Producto agregado al carrito");
    } catch (error) {
      console.error("❌ Error al agregar producto:", error);

      // Si el token expiró o no hay sesión, redirigimos al login
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
        navigate("/login");
      } else {
        alert("Error al agregar producto al carrito");
      }
    }
  };

  // 👉 Función para ir al checkout
  const handleComprarAhora = () => {
    navigate("/checkout/forma-entrega");
  };

  return (
    <div className="descripcion-producto">
      <div className="producto-detalle">
        {/* 📦 Imagen */}
        <div className="producto-imagen-placeholder">
          <div className="imagen-cuadro">
            <p>Imagen del producto</p>
          </div>
          <div className="imagen-circulos">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="circulo"></span>
            ))}
          </div>
        </div>

        {/* 📋 Información */}
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
            <select
              id="cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
            >
              <option value={1}>1 unidad</option>
              <option value={2}>2 unidades</option>
              <option value={3}>3 unidades</option>
            </select>

            <div className="producto-stock">
              <p>N° Disponibles: {producto.stock || "10"}</p>
            </div>
          </div>

          <div className="medios-pago">
            <p>Medios de pago</p>
            <div className="logos-pago">{/* Aquí irán los logos más adelante */}</div>
          </div>

          <div className="botones-compra">
            <button className="btn-comprar" onClick={handleComprarAhora}>
              Comprar Ahora
            </button>
            <button className="btn-agregar" onClick={handleAgregarCarrito}>
              Agregar al carrito
            </button>
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
