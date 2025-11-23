import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FaTrash, 
  FaShoppingCart, 
  FaTimes, 
  FaShoppingBag, 
  FaCreditCard, 
  FaPlus, 
  FaMinus 
} from "react-icons/fa";
import { MdRemoveShoppingCart } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Carrito.css";

const Carrito = ({ abierto, onCerrar }) => {
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook para navegación

  // 🔄 Cargar carrito del usuario autenticado
  useEffect(() => {
    if (abierto) {
      cargarCarrito();
    }
  }, [abierto]);

  const cargarCarrito = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        "http://localhost:4000/api/carrito",
        { withCredentials: true }
      );

      console.log("CARRITO DATA desde backend:", res.data);

      let productosData = Array.isArray(res.data) ? res.data : [];

      // 🔥 SOLUCIÓN: Obtener imágenes individualmente desde /api/productos
      if (productosData.length > 0) {
        console.log("🔄 Obteniendo imágenes individualmente...");
        
        const productosConImagenes = await Promise.all(
          productosData.map(async (productoCarrito) => {
            try {
              // Obtener información completa del producto
              const resProducto = await axios.get(
                `http://localhost:4000/api/productos/${productoCarrito.idproducto}`
              );
              
              console.log(`✅ Imagen obtenida para ${productoCarrito.idproducto}:`, resProducto.data.imagen_url);
              
              return {
                id: productoCarrito.idproducto,
                idproducto: productoCarrito.idproducto,
                nombre: productoCarrito.nombre,
                precio: productoCarrito.precio,
                imagen_url: resProducto.data.imagen_url, // ← Esta SÍ funciona
                cantidad: productoCarrito.cantidad,
                subtotal: productoCarrito.subtotal
              };
            } catch (error) {
              console.error(`❌ Error obteniendo producto ${productoCarrito.idproducto}:`, error);
              return {
                ...productoCarrito,
                id: productoCarrito.idproducto,
                imagen_url: null
              };
            }
          })
        );
        
        productosData = productosConImagenes;
      }

      console.log("🎯 Productos finales con imágenes:", productosData);

      // 🔍 DEBUG
      productosData.forEach((producto, index) => {
        console.log(`Producto ${index + 1} en carrito:`, {
          id: producto.id,
          nombre: producto.nombre,
          imagen_url: producto.imagen_url, // ← Ahora debería tener valor
          cantidad: producto.cantidad,
          subtotal: producto.subtotal
        });
      });

      setProductos(productosData);

      // Calcular total
      const totalCalc = productosData.reduce(
        (acc, prod) => acc + parseFloat(prod.subtotal || 0),
        0
      );
      setTotal(totalCalc);

    } catch (err) {
      console.error("❌ Error al cargar carrito:", err);
      manejarError(err);
    } finally {
      setLoading(false);
    }
  };

  const manejarError = (error) => {
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
        text: "Ha ocurrido un error inesperado.",
      });
    }
  };

  // ➕➖ Actualizar cantidad de producto
  const handleActualizarCantidad = (idproducto, nuevaCantidad) => {
    axios.put(
      "http://localhost:4000/api/carrito/actualizar",
      { idproducto, cantidad: nuevaCantidad },
      { withCredentials: true }
    )
    .then(() => cargarCarrito())
    .catch(manejarError);
  };


  // 🗑️ Eliminar un solo producto del carrito
  const handleEliminarProducto = async (idproducto, nombreProducto) => {
    const confirmar = await Swal.fire({
      icon: "question",
      title: "¿Eliminar producto?",
      html: `¿Deseas eliminar <strong>"${nombreProducto}"</strong> del carrito?`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await axios.delete(
        `http://localhost:4000/api/carrito/eliminar/${idproducto}`,
        { withCredentials: true }
      );

      // Actualizar estado local
      const nuevoCarrito = productos.filter((p) => p.idproducto !== idproducto);
      setProductos(nuevoCarrito);

      const nuevoTotal = nuevoCarrito.reduce(
        (acc, prod) => acc + parseFloat(prod.subtotal || 0),
        0
      );
      setTotal(nuevoTotal);

      Swal.fire({
        icon: "success",
        title: "Producto eliminado",
        text: `"${nombreProducto}" fue eliminado del carrito`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
      manejarError(error);
    }
  };

  // 🧹 Vaciar todo el carrito
  const handleVaciarCarrito = async () => {
    const confirmar = await Swal.fire({
      icon: "warning",
      title: "Vaciar carrito",
      text: "¿Seguro que deseas vaciar todo el carrito? Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, vaciar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
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
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

    } catch (error) {
      console.error("❌ Error al vaciar carrito:", error);
      manejarError(error);
    }
  };

  // 🛒 Finalizar compra - ACTUALIZADO con navegación
  const handleFinalizarCompra = () => {
    if (productos.length === 0) return;

    Swal.fire({
      icon: "info",
      title: "Procesando compra...",
      text: "Serás redirigido al proceso de pago",
      confirmButtonText: "Continuar",
      confirmButtonColor: "#28a745",
    }).then((result) => {
      if (result.isConfirmed) {
        // Cerrar el modal del carrito
        onCerrar();
        
        // Navegar a la ruta de forma de entrega
        navigate("/checkout/forma-entrega");
      }
    });
  };

  return (
    <>
      {/* Overlay solo cuando el carrito está abierto */}
      {abierto && <div className="carrito-modal-overlay" onClick={onCerrar}></div>}
      
      <div className={`carrito-modal-container ${abierto ? "visible" : ""}`}>
        <div className="carrito-modal-content">
          {/* Header del carrito */}
          <div className="carrito-modal-header">
            <div className="carrito-modal-title">
              <FaShoppingCart className="carrito-modal-icon" />
              <h3>Mi Carrito</h3>
              <span className="carrito-product-count">({productos.length})</span>
            </div>
            <button className="carrito-close-btn" onClick={onCerrar}>
              <FaTimes />
            </button>
          </div>

          {/* Lista de productos */}
          <div className="carrito-modal-body">
            {loading ? (
              <div className="carrito-loading-state">
                <div className="carrito-spinner"></div>
                <p>Cargando carrito...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="carrito-empty-state">
                <MdRemoveShoppingCart className="carrito-empty-icon" />
                <p>Tu carrito está vacío</p>
                <span>Agrega algunos productos para comenzar</span>
              </div>
            ) : (
              <ul className="carrito-product-list">
                {productos.map((producto) => (
                  <li key={producto.idproducto} className="carrito-product-item">
                    {/* Imagen del producto */}
                    <div className="carrito-product-image">
                      {producto.imagen_url ? (
                        <img 
                          src={producto.imagen_url} 
                          alt={producto.nombre || "Producto sin nombre"}
                          onError={(e) => {
                            console.error(`Error cargando imagen del carrito: ${producto.imagen_url}`);
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement.querySelector('.carrito-image-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                          onLoad={() => console.log(`Imagen del carrito cargada: ${producto.imagen_url}`)}
                        />
                      ) : (
                        <div className="carrito-image-placeholder">
                          <FaShoppingBag />
                          <span>Sin imagen</span>
                        </div>
                      )}
                    </div>

                    {/* Información del producto */}
                    <div className="carrito-product-info">
                      <h4 className="carrito-product-name">
                        {producto.nombre || "Producto sin nombre"}
                      </h4>
                      <p className="carrito-product-unit-price">
                        ${(producto.subtotal / producto.cantidad).toFixed(2)} c/u
                      </p>
                      
                      {/* Controles de cantidad */}
                      <div className="carrito-quantity-controls">
                        <button
                          className="carrito-quantity-btn"
                          onClick={() => handleActualizarCantidad(producto.idproducto, producto.cantidad - 1)}
                          disabled={producto.cantidad <= 1}
                        >
                          <FaMinus />
                        </button>
                        <span className="carrito-quantity">{producto.cantidad}</span>
                        <button
                          className="carrito-quantity-btn"
                          onClick={() => handleActualizarCantidad(producto.idproducto, producto.cantidad + 1)}
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal y eliminar */}
                    <div className="carrito-product-actions">
                      <div className="carrito-subtotal-container">
                        <span className="carrito-subtotal-label">Subtotal</span>
                        <span className="carrito-product-subtotal">
                          ${producto.subtotal}
                        </span>
                      </div>
                      <button
                        className="carrito-delete-btn"
                        onClick={() => handleEliminarProducto(
                          producto.idproducto, 
                          producto.nombre || "Este producto"
                        )}
                        title={`Eliminar ${producto.nombre || "producto"} del carrito`}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer del carrito */}
          {productos.length > 0 && (
            <div className="carrito-modal-footer">
              <div className="carrito-summary">
                <div className="carrito-total-amount">
                  <span>Total:</span>
                  <strong>${total.toFixed(2)}</strong>
                </div>
                
                <div className="carrito-shipping-info">
                  <small>Envío gratuito en compras mayores a $50</small>
                </div>
              </div>
              
              <div className="carrito-action-buttons">
                <button 
                  className="carrito-checkout-btn"
                  onClick={handleFinalizarCompra}
                >
                  <FaCreditCard />
                  Finalizar Compra
                </button>
                
                <button
                  className="carrito-clear-btn"
                  onClick={handleVaciarCarrito}
                >
                  <FaTrash />
                  Vaciar Carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Carrito;