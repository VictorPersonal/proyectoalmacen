import { useEffect, useState } from "react";
import CategoriaCard from "./categoriaCard";

const CategoriaList = () => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetch("https://backend-tpeu.onrender.com/api/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch((err) => console.log("Error categorías:", err));
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
      {categorias.map((cat) => (
        <CategoriaCard
          key={cat.idcategoria}
          id={cat.idcategoria}
          descripcion={cat.descripcion}
        />
      ))}
    </div>
  );
};

export default CategoriaList;
