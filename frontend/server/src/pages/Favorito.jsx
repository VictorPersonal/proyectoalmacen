import React from "react";
import FavoritoProducto from "../components/FavoritoProducto";

const Favoritos = () => {
  // ✅ Se obtiene la cédula desde localStorage (puedes ajustarlo si la guardas en otro lugar)
  const cedulaUsuario = localStorage.getItem("cedula");

  return (
    <div style={{ padding: "20px" }}>
      <FavoritoProducto cedula={cedulaUsuario} />
    </div>
  );
};

export default Favoritos;
