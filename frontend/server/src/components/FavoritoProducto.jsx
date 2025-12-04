import React, { useEffect, useState } from "react";
import "./FavoritoProducto.css";

const FavoritoProducto = () => {
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerFavoritos = async () => {
      try {
        console.log("🔹 Intentando obtener favoritos...");

        const response = await fetch("http://localhost:4000/api/favoritos", {
          method: "GET",
          credentials: "include",
        });

        console.log("🔹 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Error response:", errorText);
          throw new Error(`Error al obtener favoritos (status: ${response.status})`);
        }

        const data = await response.json();
        console.log("🔹 Datos recibidos:", data);
        if (Array.isArray(data)) {
          setFavoritos(data);
        } else if (data && Array.isArray(data.favoritos)) {
          setFavoritos(data.favoritos);
        } else if (data && data.favoritos) {
          setFavoritos([data.favoritos]);
        } else {
          console.warn("⚠️ La API no devolvió un array:", data);
          setFavoritos([]); 
        }
      } catch (error) {
        console.error("❌ Error al cargar favoritos:", error);
        setFavoritos([]); 
      } finally {
        setLoading(false);
      }
    };

    obtenerFavoritos();
  }, []);
  const favoritosArray = Array.isArray(favoritos) ? favoritos : [];

  if (loading) {
    return <p className="mensaje-vacio">Cargando favoritos...</p>;
  }

  return (
    <div className="favoritos-container">
      <h2 className="titulo-favoritos">Mis Productos Favoritos</h2>
      {favoritosArray.length === 0 ? (
        <p className="mensaje-vacio">No tienes productos en favoritos.</p>
      ) : (
        favoritosArray.map((item) => (
          <div key={item.idfavorito || item.id || Math.random()} className="favorito-item">
            <img
              src={item.imagen || "https://via.placeholder.com/100"}
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