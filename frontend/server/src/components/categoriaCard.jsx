import { Link } from "react-router-dom";

const CategoriaCard = ({ id, descripcion }) => {
  return (
    <Link
      to={`/categorias/${id}`}
      className="block bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
    >
      <h3 className="text-lg font-bold text-gray-800">{descripcion}</h3>
    </Link>
  );
};

export default CategoriaCard;

