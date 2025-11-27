import React, { useState, useRef } from "react";
import "./DescripcionProducto.css";
import Swal from "sweetalert2";
import { FaStar, FaHeart } from "react-icons/fa";
import { SiVisa, SiMastercard, SiAmericanexpress, SiJcb } from "react-icons/si";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DescripcionProducto = ({ producto, onVolver }) => {
  const [cantidad, setCantidad] = useState(1);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const [esFavorito, setEsFavorito] = useState(false);
  const navigate = useNavigate();
  const ejecutadoRef = useRef(false);
  
  // Obtener todas las imágenes del producto
  const imagenes = producto?.producto_imagen || [];
  const imagenActual = imagenes[imagenSeleccionada];

  if (!producto || !producto.nombre) {
    return (
      <div className="descripcion-producto-error">
        <p>No se encontró la información del producto.</p>
        {onVolver && (
          <button className="btn-volver" onClick={onVolver}>
            ← Volver
          </button>
        )}
      </div>
    );
  }

  // Función para manejar el clic en el corazón
  const handleFavoritoClick = () => {
    setEsFavorito(!esFavorito);
    // Aquí puedes agregar la lógica para guardar en favoritos en tu backend
    console.log("Producto marcado como favorito:", !esFavorito);
  };

  // Función para cambiar a la siguiente imagen
  const siguienteImagen = () => {
    if (imagenes.length > 1) {
      setImagenSeleccionada((prev) => (prev + 1) % imagenes.length);
    }
  };

  // Función para cambiar a la imagen anterior
  const anteriorImagen = () => {
    if (imagenes.length > 1) {
      setImagenSeleccionada((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    }
  };

  // Función para agregar al carrito
  const handleAgregarCarrito = async () => {
    const userInfo = localStorage.getItem("usuarioInfo");

    if (!userInfo) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para agregar productos al carrito.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    try {
      const productoData = {
        idproducto: producto.id_producto || producto.id || producto.idproducto,
        cantidad: cantidad,
      };

      const res = await axios.post(
        "http://localhost:4000/api/carrito/agregar",
        productoData,
        { withCredentials: true }
      );

      Swal.fire({
        icon: "success",
        title: "Producto agregado",
        text: "El producto fue añadido al carrito correctamente.",
        confirmButtonText: "Genial",
        padding: "1.5rem",
      });

    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        Swal.fire({
          icon: "error",
          title: "Sesión expirada",
          text: "Debes iniciar sesión nuevamente.",
          confirmButtonText: "Ok",
          padding: "1.5rem",
        });
        return;
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Hubo un problema al agregar el producto al carrito.",
          confirmButtonText: "Cerrar",
          padding: "1.5rem",
        });
      }
    }
  };

  // Función para Comprar Ahora - CON PREVENCIÓN DE DOBLE EJECUCIÓN
  const handleComprarAhora = () => {
    if (ejecutadoRef.current) {
      console.log("⏭️ Compra ya en proceso...");
      return;
    }

    const userInfo = localStorage.getItem("usuarioInfo");

    if (!userInfo) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para realizar una compra.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    try {
      ejecutadoRef.current = true;

      console.log("🛒 Iniciando compra directa (solo una vez)");

      // Crear objeto de compra directa
      const compraDirecta = {
        tipo: "compra_directa",
        productos: [
          {
            id: producto.id_producto || producto.id || producto.idproducto,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            imagen_url: imagenActual?.url,
            descripcion: producto.descripcion || producto.descripcion_producto || producto.descripcion_text,
            stock: producto.stock || "10"
          }
        ],
        total: producto.precio * cantidad,
        cantidadTotal: cantidad
      };

      console.log("📦 Datos de compra directa:", compraDirecta);

      // Navegar al checkout
      navigate("/checkout/forma-entrega", {
        state: {
          compraTipo: "directa",
          compraData: compraDirecta
        }
      });

    } catch (error) {
      console.error("❌ Error en compra directa:", error);
      ejecutadoRef.current = false;
    }
  };

  return (
    <div className="descripcion-producto">
      <div className="producto-detalle">
        {/* ❤️ Corazón de favoritos - AHORA EN EL CONTENEDOR PRINCIPAL */}
        <button 
          className={`corazon-favorito ${esFavorito ? 'activo' : ''}`}
          onClick={handleFavoritoClick}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <FaHeart />
        </button>

        {/* 📦 Sección de Imágenes */}
        <div className="producto-imagen-placeholder">
          {/* Imagen principal */}
          <div className="imagen-cuadro">
            {imagenActual?.url ? (
              <img 
                src={imagenActual.url} 
                alt={producto.nombre}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  borderRadius: '8px',
                  background: '#f5f5f5'
                }}
              />
            ) : (
              <p>Imagen del producto</p>
            )}
            
            {/* Flechas de navegación si hay más de una imagen */}
            {imagenes.length > 1 && (
              <>
                <button 
                  className="flecha-navegacion flecha-izquierda"
                  onClick={anteriorImagen}
                >
                  ‹
                </button>
                <button 
                  className="flecha-navegacion flecha-derecha"
                  onClick={siguienteImagen}
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Contador de imágenes - SOLO el contador, sin miniaturas */}
          {imagenes.length > 1 && (
            <div className="contador-imagenes">
              {imagenSeleccionada + 1} / {imagenes.length}
            </div>
          )}
        </div>

        {/* 📋 Información del Producto */}
        <div className="producto-info">
          <h2>{producto.nombre}</h2>
          
          {/* Descripción */}
          {producto.descripcion ? (
            <p className="producto-descripcion">{producto.descripcion}</p>
          ) : producto.descripcion_producto ? (
            <p className="producto-descripcion">{producto.descripcion_producto}</p>
          ) : producto.descripcion_text ? (
            <p className="producto-descripcion">{producto.descripcion_text}</p>
          ) : (
            <p className="producto-descripcion sin-descripcion">
              Este producto no tiene descripción disponible.
            </p>
          )}

          <div className="producto-calificacion">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} color="#FFD700" />
            ))}
            <p>Calificación promedio</p>
          </div>

          {/* ⭐ SELECT MEJORADO */}
          <div className="producto-cantidad" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <label htmlFor="cantidad">Cantidad:</label>
            <select
              id="cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              style={{
                height: "45px",
                padding: "0 15px",
                borderRadius: "8px",
                fontSize: "16px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              <option value={1}>1 unidad</option>
              <option value={2}>2 unidades</option>
              <option value={3}>3 unidades</option>
              <option value={4}>4 unidades</option>
            </select>
          </div>

          <div className="producto-stock">
            <p>N° Disponibles: {producto.stock || "10"}</p>
          </div>

          <div className="medios-pago">
            <p>Medios de pago</p>
            <div className="logos-pago">
              <SiVisa className="tarjeta-icono" title="Visa" />
              <SiMastercard className="tarjeta-icono" title="Mastercard" />
              <SiAmericanexpress className="tarjeta-icono" title="American Express" />
              <SiJcb className="tarjeta-icono" title="JCB" />
            </div>
          </div>

          <div className="botones-compra">
            <button 
              className="btn-comprar" 
              onClick={handleComprarAhora}
            >
              Comprar Ahora
            </button>
            <button className="btn-agregar" onClick={handleAgregarCarrito}>
              Agregar al carrito
            </button>
          </div>

          {onVolver && (
            <button className="btn-volver" onClick={onVolver}>
              ← Volver
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DescripcionProducto;