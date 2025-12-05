import React, { useState } from "react";
import { FaHeart } from "react-icons/fa";
import Swal from "sweetalert2";
import "./productoCard.css";

const ProductoCard = ({ producto }) => {
  const [cargando, setCargando] = useState(false);

  // 🔹 Función para mostrar alertas de éxito (igual que en DescripcionProducto)
  const mostrarExito = (mensaje) => {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Aceptar',
      timer: 2000,
      timerProgressBar: true
    });
  };

  // 🔹 Función para mostrar alertas de error (igual que en DescripcionProducto)
  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Entendido'
    });
  };

  // 🔹 Función para mostrar advertencia (cuando ya está en favoritos)
  const mostrarAdvertencia = (mensaje) => {
    Swal.fire({
      title: 'Ya está en favoritos',
      text: mensaje,
      icon: 'info',
      confirmButtonText: 'Ver favoritos',
      confirmButtonColor: '#3085d6',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#888',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Redirigir a la página de favoritos
        window.location.href = "/favoritos";
      }
    });
  };

  // Función para manejar el clic en el corazón
  const handleFavoritoClick = async (e) => {
    e.stopPropagation();
    if (cargando) return;
    
    setCargando(true);
    
    try {
      const productoFavorito = {
        idproducto: producto.idproducto || producto.id_producto || producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        descripcion: producto.descripcion || producto.descripcion_producto || producto.descripcion_text || "",
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
        // Verificar si es porque ya está en favoritos
        if (response.status === 400 && 
            (data.message?.toLowerCase().includes("ya está en favoritos") || 
             data.message?.toLowerCase().includes("already in favorites"))) {
          
          mostrarAdvertencia(`"${producto.nombre}" ya está en tus favoritos. ¿Quieres ver todos tus productos favoritos?`);
        } else {
          mostrarError(data.message || "No se pudo agregar el producto a favoritos. Intenta nuevamente.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      mostrarError("Error de conexión. Verifica tu conexión a internet.");
    } finally {
      setCargando(false);
    }
  };

  // Obtener la primera imagen
  const primeraImagen = producto.producto_imagen?.[0]?.url || null;

  return (
    <div className="producto-card">
      {/* ❤️ Corazón de favoritos */}
      <button 
        className={`corazon-favorito-card ${cargando ? 'cargando' : ''}`}
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
        <div className="imagen-container">
          <img 
            src={primeraImagen} 
            alt={producto.nombre} 
            className="producto-imagen"
            onError={(e) => {
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
      
      {/* Información del producto */}
      <div className="producto-info">
        <h3 className="producto-nombre">{producto.nombre}</h3>
        <p className="precio"> ${Number(producto.precio).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default ProductoCard;