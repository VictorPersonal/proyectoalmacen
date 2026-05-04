import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/components/productoCard.css";

const ProductoCard = ({ producto }) => {
  const [cargando, setCargando] = useState(false);
  const [, setClock] = useState(Date.now());

  // 🔁 Para actualizar contador cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 🧠 Contador
  const getCountdown = () => {
    if (!producto.fecha_fin) return null;

    const ahora = new Date();
    const fin = new Date(producto.fecha_fin);

    if (ahora > fin) return "Finalizada";

    const diff = fin - ahora;
    const s = Math.floor(diff / 1000);

    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");

    return `Termina en ${h}:${m}:${sec}`;
  };

  // 🔔 Alertas
  const mostrarExito = (mensaje) => {
    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: mensaje,
      confirmButtonColor: "#D84040",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: mensaje,
      confirmButtonColor: "#D84040",
    });
  };

  const handleFavoritoClick = async (e) => {
    e.stopPropagation();
    if (cargando) return;

    setCargando(true);

    try {
      const response = await fetch(
        "http://localhost:4000/api/favoritos",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            idproducto: producto.idproducto,
            nombre: producto.nombre,
            precio: producto.tiene_promocion
              ? producto.precio_final
              : producto.precio,
            imagen: producto.producto_imagen?.[0]?.url || "",
          }),
        }
      );

      if (response.ok) {
        mostrarExito("Agregado a favoritos");
      } else {
        mostrarError("No se pudo agregar a favoritos");
      }
    } catch {
      mostrarError("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  const imagen = producto.producto_imagen?.[0]?.url;

  return (
    <div className="card">

      {/* 🔥 Badge descuento */}
      {producto.tiene_promocion && (
        <div className="discount-badge">
          -{producto.descuento_porcentaje}%
        </div>
      )}

      {/* ❤️ Favorito */}
      <button
        className="card-corazon-favorito"
        onClick={handleFavoritoClick}
      >
        <FaHeart />
      </button>

      {/* Imagen */}
      <div className="card-imagen-container">
        {imagen ? (
          <img src={imagen} alt={producto.nombre} />
        ) : (
          <div className="placeholder">Sin imagen</div>
        )}
      </div>

      {/* Info */}
      <div className="card-info">
        <h3>{producto.nombre}</h3>

        {producto.tiene_promocion ? (
          <>
            <p className="precio-original">
              ${Number(producto.precio_original).toLocaleString()}
            </p>

            <p className="precio-descuento">
              ${Number(producto.precio_final).toLocaleString()}
            </p>

            {/* ⏱ contador */}
            <p className="promo-timer">
              {getCountdown()}
            </p>
          </>
        ) : (
          <p className="card-precio">
            ${Number(producto.precio).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductoCard;