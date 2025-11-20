import React, { useEffect, useState } from "react";
import "./FavoritoProducto.css";

const FavoritoProducto = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar los productos favoritos del usuario autenticado
  useEffect(() => {
    const obtenerFavoritos = async () => {
      try {
        const response = await fetch("https://backend-tpeu.onrender.com/api/favoritos", {
          method: "GET",
          credentials: "include", // ✅ Envía la cookie JWT, ayuda a identificar al usuario
        });

        if (!response.ok) {
          throw new Error(`Error al obtener favoritos (status: ${response.status})`);
        }

        const data = await response.json();
        setFavoritos(data);
      } catch (error) {
        console.error("❌ Error al cargar favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    obtenerFavoritos();
  }, []);

  if (loading) {
    return <p className="mensaje-vacio">Cargando favoritos...</p>;
  }

  return (
    <div className="favoritos-container">
      <h2 className="titulo-favoritos">Mis Productos Favoritos</h2>
      {favoritos.length === 0 ? (
        <p className="mensaje-vacio">No tienes productos en favoritos.</p>
      ) : (
        favoritos.map((item) => (
          <div key={item.idfavorito} className="favorito-item">
            <img
              src={item.imagen || "https://via.placeholder.com/100"} // 👈 opcional, si no tienes columna imagen
              alt={item.nombre}
              className="favorito-imagen"
            />
            <div className="favorito-info">
              <p className="nombre-producto">{item.nombre}</p>
              <p className="precio">Precio: ${item.precio}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FavoritoProducto;
