import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FavoritoProducto.css";

const FavoritoProducto = ({ cedula }) => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Obtener productos favoritos desde el backend
  const obtenerFavoritos = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/favoritos/${cedula}`);
      setFavoritos(response.data);
    } catch (err) {
      console.error("❌ Error al obtener favoritos:", err);
      setError("No se pudieron cargar los productos favoritos.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Eliminar producto de favoritos
  const eliminarFavorito = async (idproducto) => {
    try {
      await axios.delete(`http://localhost:4000/api/favoritos/${cedula}/${idproducto}`);
      setFavoritos(favoritos.filter((item) => item.idproducto !== idproducto));
    } catch (err) {
      console.error("❌ Error al eliminar favorito:", err);
      alert("Error al eliminar el producto de favoritos.");
    }
  };

  useEffect(() => {
    obtenerFavoritos();
  }, []);

  if (loading) return <p>Cargando tus productos favoritos...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="favoritos-container">
      <h2 className="titulo-favoritos">Mis Favoritos</h2>

      {favoritos.length === 0 ? (
        <p className="mensaje-vacio">No tienes productos en favoritos.</p>
      ) : (
        favoritos.map((producto) => (
          <div className="favorito-item" key={producto.idproducto}>
            {/* 📌 Si tu backend incluye imagen, puedes mostrarla aquí */}
            {producto.imagen ? (
              <img
                src={`http://localhost:4000/uploads/${producto.imagen}`}
                alt={producto.nombre}
                className="favorito-imagen"
              />
            ) : (
              <div className="favorito-imagen sin-imagen"></div>
            )}

            <div className="favorito-info">
              <h3 className="nombre-producto">{producto.nombre}</h3>
              <p className="precio">Precio: ${producto.precio}</p>
              <button
                className="btn-eliminar"
                onClick={() => eliminarFavorito(producto.idproducto)}
              >
                Eliminar de favoritos
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FavoritoProducto;
