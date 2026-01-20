import React, { useEffect, useState } from "react";
import { FaTrashAlt, FaShoppingCart, FaHeart } from "react-icons/fa";
import { RiErrorWarningLine } from "react-icons/ri";
import Swal from "sweetalert2";
import "./FavoritoProducto.css";

const FavoritoProducto = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  useEffect(() => {
    obtenerFavoritos();
  }, []);

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

  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Entendido'
    });
  };

  const mostrarConfirmacion = (titulo, texto, icono = 'warning') => {
    return Swal.fire({
      title: titulo,
      text: texto,
      icon: icono,
      showCancelButton: true,
      confirmButtonColor: '#D84040',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });
  };

  const obtenerFavoritos = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/favoritos", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error al obtener favoritos (status: ${response.status})`);
      }

      const data = await response.json();
      setFavoritos(data);
    } catch (error) {
      console.error("❌ Error al cargar favoritos:", error);
      mostrarError("Error al cargar favoritos. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarFavorito = async (idproducto, nombreProducto) => {
    const result = await mostrarConfirmacion(
      "¿Eliminar de favoritos?",
      `¿Estás seguro de eliminar "${nombreProducto}" de favoritos?`
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/favoritos/${idproducto}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar favorito");
      }

      setFavoritos(favoritos.filter(item => item.idproducto !== idproducto));
      
      mostrarExito("Producto eliminado de favoritos correctamente.");

    } catch (error) {
      console.error("❌ Error al eliminar favorito:", error);
      mostrarError(`Error: ${error.message}`);
    }
  };

  const comprarAhora = async (idproducto, nombreProducto) => {
    const result = await mostrarConfirmacion(
      "¿Agregar al carrito?",
      `¿Quieres agregar "${nombreProducto}" al carrito de compras?`,
      'question'
    );

    if (result.isConfirmed) {
      mostrarExito(`"${nombreProducto}" fue agregado al carrito.`);
    }
  };

  if (loading) {
    return (
      <div className="favoritos-loading-container">
        <FaHeart className="favoritos-loading-icon" />
        <p className="favoritos-mensaje-vacio">Cargando favoritos...</p>
      </div>
    );
  }

  return (
    <div className="favoritos-container">
      <h2 className="favoritos-titulo-favoritos">
        <FaHeart className="favoritos-titulo-icono" /> Mis Productos Favoritos
      </h2>

      {mensaje.texto && (
        <div className={`favoritos-mensaje favoritos-${mensaje.tipo}`}>
          {mensaje.tipo === "error" && <RiErrorWarningLine />}
          {mensaje.texto}
        </div>
      )}

      {favoritos.length === 0 ? (
        <div className="favoritos-empty-favoritos">
          <FaHeart className="favoritos-empty-icon" />
          <p className="favoritos-mensaje-vacio">No tienes productos en favoritos.</p>
        </div>
      ) : (
        <div className="favoritos-grid">
          {favoritos.map((item) => (
            <div key={item.idfavorito} className="favorito-card">
              <div className="favorito-imagen-container">
                <img
                  src={item.imagen || "https://via.placeholder.com/300x200"}
                  alt={item.nombre}
                  className="favorito-imagen"
                />
                <div className="favorito-acciones">
                  <button
                    className="favoritos-btn-comprar-ahora"
                    onClick={() => comprarAhora(item.idproducto, item.nombre)}
                    title="Comprar ahora"
                  >
                    <FaShoppingCart /> Comprar ahora
                  </button>
                  <button
                    className="favoritos-btn-eliminar"
                    onClick={() => eliminarFavorito(item.idproducto, item.nombre)}
                    title="Eliminar de favoritos"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
              <div className="favorito-info">
                <h3 className="favoritos-nombre-producto">{item.nombre}</h3>
                <p className="favoritos-precio">${parseFloat(item.precio).toFixed(2)}</p>
                <div className="favoritos-producto-detalles">
                  {item.descripcion && (
                    <p className="favoritos-descripcion">{item.descripcion.substring(0, 100)}...</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritoProducto;