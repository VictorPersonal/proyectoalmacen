import React, { useState } from "react";
import { FaHeart } from "react-icons/fa";
import Swal from "sweetalert2";
import "../styles/components/productoCard.css";

const ProductoCard = ({ producto }) => {
  const [cargando, setCargando] = useState(false);

  const mostrarExito = (mensaje) => {
    Swal.fire({
      icon: "success",
      title: "¡Éxito!",
      text: mensaje,
      confirmButtonColor: "#D84040",
      confirmButtonText: "Aceptar",
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: mensaje,
      confirmButtonColor: "#D84040",
      confirmButtonText: "Entendido",
    });
  };

  const mostrarAdvertencia = (mensaje) => {
    Swal.fire({
      title: "Ya está en favoritos",
      text: mensaje,
      icon: "info",
      confirmButtonText: "Ver favoritos",
      confirmButtonColor: "#3085d6",
      showCancelButton: true,
      cancelButtonText: "Cerrar",
      cancelButtonColor: "#888",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/favoritos";
      }
    });
  };

  const handleFavoritoClick = async (e) => {
    e.stopPropagation();
    if (cargando) return;

    setCargando(true);

    try {
      const productoFavorito = {
        idproducto: producto.idproducto || producto.id_producto || producto.id,
        nombre: producto.nombre,
        precio: producto.tiene_promocion
          ? producto.precio_final
          : producto.precio,
        descripcion:
          producto.descripcion ||
          producto.descripcion_producto ||
          producto.descripcion_text ||
          "",
        imagen: producto.producto_imagen?.[0]?.url || "",
      };

      const response = await fetch("http://localhost:4000/api/favoritos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productoFavorito),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarExito(`"${producto.nombre}" se agregó a favoritos correctamente.`);
      } else {
        if (
          response.status === 400 &&
          (data.message?.toLowerCase().includes("ya está en favoritos") ||
            data.message?.toLowerCase().includes("already in favorites"))
        ) {
          mostrarAdvertencia(
            `"${producto.nombre}" ya está en tus favoritos. ¿Quieres ver todos tus productos favoritos?`
          );
        } else {
          mostrarError(
            data.message ||
              "No se pudo agregar el producto a favoritos. Intenta nuevamente."
          );
        }
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarError("Error de conexión. Verifica tu conexión a internet.");
    } finally {
      setCargando(false);
    }
  };

  const primeraImagen = producto.producto_imagen?.[0]?.url || null;

  const tienePromocion = Boolean(producto.tiene_promocion);
  const descuento = Number(producto.descuento_porcentaje || 0);
  const precioOriginal = Number(
    producto.precio_original ?? producto.precio ?? 0
  );
  const precioFinal = Number(producto.precio_final ?? producto.precio ?? 0);

  return (
    <div className="card">
      {/* Badge de descuento */}
      {tienePromocion && descuento > 0 && (
        <div className="discount-badge">-{descuento}%</div>
      )}

      {/* ❤️ Corazón de favoritos */}
      <button
        className={`card-corazon-favorito ${cargando ? "cargando" : ""}`}
        onClick={handleFavoritoClick}
        disabled={cargando}
        title="Agregar a favoritos"
        aria-label="Agregar a favoritos"
      >
        <FaHeart />
        {cargando && <span className="spinner-mini"></span>}
      </button>

      {/* Imagen del producto */}
      {primeraImagen ? (
        <div className="card-imagen-container">
          <img
            src={primeraImagen}
            alt={producto.nombre}
            className="card-imagen"
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = "flex";
              }
            }}
          />
          <div className="card-imagen-placeholder" style={{ display: "none" }}>
            <div className="card-placeholder-icon">📷</div>
            <div className="card-placeholder-text">Sin imagen</div>
          </div>
        </div>
      ) : (
        <div className="card-imagen-placeholder">
          <div className="card-placeholder-icon">📷</div>
          <div className="card-placeholder-text">Sin imagen</div>
        </div>
      )}

      {/* Información del producto */}
      <div className="card-info">
        <h3 className="card-nombre">{producto.nombre}</h3>

        {tienePromocion ? (
          <div className="card-precios">
            <p className="card-precio-original">
              ${precioOriginal.toFixed(2)}
            </p>
            <p className="card-precio-final">
              ${precioFinal.toFixed(2)}
            </p>
          </div>
        ) : (
          <p className="card-precio">${precioOriginal.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
};

export default ProductoCard;