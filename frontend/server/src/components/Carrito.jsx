import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import "./Carrito.css";

const Carrito = ({ cedula, abierto, onCerrar }) => {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (abierto && cedula) {
      axios
        .get(`http://localhost:4000/api/carrito/${cedula}`) //
        .then((res) => {
          setProductos(res.data);
          const totalCalc = res.data.reduce(
            (acc, prod) => acc + parseFloat(prod.subtotal),
            0
          );
          setTotal(totalCalc);
        })
        .catch((err) => console.error("Error al cargar carrito:", err));
    }
  }, [abierto, cedula]);

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
            <ul>
              {productos.map((p) => (
                <li key={p.idproducto}>
                  <span>
                    {p.nombre} ({p.cantidad})
                  </span>
                  <span>${p.subtotal}</span>
                </li>
              ))}
            </ul>
            <hr />
            <h4>Total: ${total.toFixed(2)}</h4>
          </>
        )}
      </div>
    </div>
  );
};

export default Carrito;