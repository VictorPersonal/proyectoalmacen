import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import "./Carrito.css";

const Carrito = ({ abierto, onCerrar }) => {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);

  // 🔄 Cargar carrito del usuario autenticado
  useEffect(() => {
    if (abierto) {
      axios
        .get("http://localhost:4000/api/carrito", { withCredentials: true })
        .then((res) => {
          setProductos(res.data);

          const totalCalc = res.data.reduce(
            (acc, prod) => acc + parseFloat(prod.subtotal),
            0
          );
          setTotal(totalCalc);
        })
        .catch((err) => {
          console.error("❌ Error al cargar carrito:", err);

          if (err.response?.status === 401 || err.response?.status === 403) {
            Swal.fire({
              icon: "warning",
              title: "Sesión expirada",
              text: "Tu sesión ha expirado. Inicia sesión nuevamente.",
            });
          }
        });
    }
  }, [abierto]);

  // 🗑️ Eliminar un solo producto del carrito
  const handleEliminarProducto = async (idproducto) => {
    const confirmar = await Swal.fire({
      icon: "question",
      title: "¿Eliminar producto?",
      text: "¿Deseas eliminar este producto del carrito?",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await axios.delete(
        `http://localhost:4000/api/carrito/eliminar/${idproducto}`,
        { withCredentials: true }
      );

      // Actualizar estado
      const nuevoCarrito = productos.filter((p) => p.idproducto !== idproducto);
      setProductos(nuevoCarrito);

      const nuevoTotal = nuevoCarrito.reduce(
        (acc, prod) => acc + parseFloat(prod.subtotal),
        0
      );
      setTotal(nuevoTotal);

      Swal.fire({
        icon: "success",
        title: "Producto eliminado",
      });

    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Inicia sesión nuevamente.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el producto.",
        });
      }
    }
  };

  // 🧹 Vaciar todo el carrito
  const handleVaciarCarrito = async () => {
    const confirmar = await Swal.fire({
      icon: "warning",
      title: "Vaciar carrito",
      text: "¿Seguro que deseas vaciar todo el carrito?",
      showCancelButton: true,
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await axios.delete("http://localhost:4000/api/carrito/vaciar", {
        withCredentials: true,
      });

      setProductos([]);
      setTotal(0);

      Swal.fire({
        icon: "success",
        title: "Carrito vaciado",
      });

    } catch (error) {
      console.error("❌ Error al vaciar carrito:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Inicia sesión nuevamente.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo vaciar el carrito.",
        });
      }
    }
  };

  return (
    <div className={`carrito-modal ${abierto ? "visible" : ""}`}>
      <div className="carrito-contenido">
        <button className="cerrar-btn" onClick={onCerrar}>
          ✕
        </button>
        <h3>🛒 Carrito</h3>

        {productos.length === 0 ? (
          <p>No tienes productos agregados.</p>
        ) : (
          <>
            <ul className="lista-carrito">
              {productos.map((p) => (
                <li key={p.idproducto} className="item-carrito">
                  <div className="info-producto">
                    <span>
                      {p.nombre} ({p.cantidad})
                    </span>
                    <span className="precio">${p.subtotal}</span>
                  </div>

                  <button
                    className="btn-eliminar"
                    onClick={() => handleEliminarProducto(p.idproducto)}
                    title="Eliminar producto"
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>

            <hr />
            <h4>Total: ${total.toFixed(2)}</h4>

            <div className="botones-carrito">
              <button className="btn-comprar2">💰 Finalizar compra</button>

              <button
                className="btn-vaciar"
                onClick={handleVaciarCarrito}
                disabled={productos.length === 0}
              >
                🧹 Vaciar carrito
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Carrito;
