import React, { useState } from "react";
import "./DescripcionProducto.css";
import Swal from "sweetalert2";
import { FaStar } from "react-icons/fa";
import { SiVisa, SiMastercard, SiAmericanexpress, SiJcb } 
from "react-icons/si";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DescripcionProducto = ({ producto, onVolver }) => {
  const [cantidad, setCantidad] = useState(1);
  const navigate = useNavigate();
  
  // 👇 DEBUG DETALLADO - Agrega esto para verificar
  console.log("Producto completo:", producto);
  console.log("Descripción:", producto?.descripcion);
  console.log("Todas las propiedades:", Object.keys(producto || {}));

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
    const userInfo = localStorage.getItem("usuarioInfo");

    // ❌ No redirige
    if (!userInfo) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para agregar productos al carrito.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    try {
      const productoData = {
        idproducto: producto.id_producto || producto.id || producto.idproducto,
        cantidad: cantidad,
      };

      const res = await axios.post(
        "http://localhost:4000/api/carrito/agregar",
        productoData,
        { withCredentials: true }
      );

      console.log("✅ Producto agregado:", res.data);

      Swal.fire({
        icon: "success",
        title: "Producto agregado",
        text: "El producto fue añadido al carrito correctamente.",
        confirmButtonText: "Genial",
        padding: "1.5rem",
      });

    } catch (error) {
      console.error("❌ Error al agregar producto:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Sesión expirada",
          text: "Debes iniciar sesión nuevamente.",
          confirmButtonText: "Ok",
          padding: "1.5rem",
        });
        return;
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al agregar el producto al carrito.",
          confirmButtonText: "Cerrar",
          padding: "1.5rem",
        });
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
            {producto.imagen_url ? (
              <img 
                src={producto.imagen_url} 
                alt={producto.nombre}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  background: '#f5f5f5'
                }}
              />
            ) : (
              <p>Imagen del producto</p>
            )}
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
          
          {/* 👇 DESCRIPCIÓN CON VALIDACIÓN MEJORADA */}
          {producto.descripcion ? (
            <p className="producto-descripcion">{producto.descripcion}</p>
          ) : producto.descripcion_producto ? (
            <p className="producto-descripcion">{producto.descripcion_producto}</p>
          ) : producto.descripcion_text ? (
            <p className="producto-descripcion">{producto.descripcion_text}</p>
          ) : (
            <p className="producto-descripcion sin-descripcion">
              Este producto no tiene descripción disponible.
            </p>
          )}

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
              <option value={4}>4 unidades</option>
            </select>

            <div className="producto-stock">
              <p>N° Disponibles: {producto.stock || "10"}</p>
            </div>
          </div>

          <div className="medios-pago">
            <p>Medios de pago</p>
            <div className="logos-pago">
              <SiVisa className="tarjeta-icono" title="Visa" />
              <SiMastercard className="tarjeta-icono" title="Mastercard" />
              <SiAmericanexpress className="tarjeta-icono" title="American Express" />
              <SiJcb className="tarjeta-icono" title="JCB" />
            </div>
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