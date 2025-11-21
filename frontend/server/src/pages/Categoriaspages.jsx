import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductoCard from "../components/productoCard"; // <── Importas tu propio componente

const CategoriaPage = () => {
  const { id } = useParams();
  const [productos, setProductos] = useState([]);
  const [tituloCategoria, setTituloCategoria] = useState("");

  useEffect(() => {
    fetch(`https://backend-tpeu.onrender.com/api/categorias/${id}/productos`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProductos(data);
          setTituloCategoria(data[0]?.categoria || "Productos");
        }
      })
      .catch((err) => console.log("Error productos:", err));
  }, [id]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{tituloCategoria}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {productos.map((producto) => (
          <ProductoCard key={producto.id} producto={producto} />
        ))}
      </div>
    </div>
  );
};

export default CategoriaPage;
