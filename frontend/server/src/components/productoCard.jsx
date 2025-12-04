import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa";
import "./productoCard.css";

const ProductoCard = ({ producto }) => {
  const [esFavorito, setEsFavorito] = useState(false);

  const token = localStorage.getItem("token");

  // Detectar si el producto ya es favorito (opcional si ya lo mandas desde backend)
  useEffect(() => {
    const favoritosGuardados = JSON.parse(localStorage.getItem("favoritos")) || [];
    setEsFavorito(favoritosGuardados.includes(producto.idproducto));
  }, [producto.idproducto]);

  // ------------------------------------------------------------
  // ❤️ Función para agregar a favoritos
  // ------------------------------------------------------------
  const agregarFavorito = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/favoritos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ idproducto: producto.idproducto })
      });

      const data = await res.json();
      console.log("➡️ Respuesta agregar favorito:", data);

      if (data.success) {
        setEsFavorito(true);
      } else {
        console.log("❌ Error al agregar:", data.message);
      }
    } catch (error) {
      console.error("❌ Error en fetch POST favoritos:", error);
    }
  };

  // ------------------------------------------------------------
  // 💔 Función para quitar de favoritos
  // ------------------------------------------------------------
  const eliminarFavorito = async () => {
    try {
      const res = await fetch(
        `http://localhost:4000/api/favoritos/${producto.cedula}/${producto.idproducto}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      console.log("➡️ Respuesta eliminar favorito:", data);

      if (res.ok) {
        setEsFavorito(false);
      }
    } catch (error) {
      console.error("❌ Error al eliminar favorito:", error);
    }
  };

  // ------------------------------------------------------------
  // 🔥 Evento al hacer clic en el corazón
  // ------------------------------------------------------------
  const handleFavoritoClick = async (e) => {
    e.stopPropagation();

    const usuarioInfo = localStorage.getItem("usuarioInfo");

  if (!usuarioInfo) {
    alert("Debes iniciar sesión para agregar favoritos.");
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/api/favoritos", {
      method: "POST",
      credentials: "include", // porque usas cookie
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idproducto: producto.idproducto,
        fecha: new Date().toISOString().split("T")[0],
      }),
    });

    const data = await response.json();
    console.log(data);

    if (response.ok) {
      setEsFavorito(true);
    } else {
      alert(data.message || "Error al procesar el favorito");
    }
  } catch (error) {
    console.error("Error al agregar favorito:", error);
    alert("Ocurrió un error");
  }
};


  // Obtener la imagen principal
  const primeraImagen =
    producto.producto_imagen && producto.producto_imagen.length > 0
      ? producto.producto_imagen[0].url
      : null;

  return (
    <div className="producto-card">
      {/* ❤️ Corazón de favoritos */}
      <button
        className={`corazon-favorito-card ${esFavorito ? "activo" : ""}`}
        onClick={handleFavoritoClick}
        aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <FaHeart />
      </button>

      {/* Imagen del producto */}
      {primeraImagen ? (
        <div className="imagen-container">
          <img
            src={primeraImagen}
            alt={producto.nombre}
            className="producto-imagen"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div className="imagen-placeholder" style={{ display: "none" }}>
            Sin imagen
          </div>
        </div>
      ) : (
        <div className="imagen-placeholder">Sin imagen</div>
      )}

      {/* Info */}
      <div className="producto-info">
        <h3 className="producto-nombre">{producto.nombre}</h3>
        <p className="precio">${Number(producto.precio).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductoCard;
