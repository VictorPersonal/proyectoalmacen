import React, { useState, useRef, useEffect } from "react";
import "../styles/components/DescripcionProducto.css";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Carrito from "./Carrito";

import { 
  FaStar,
  FaHeart,
  FaShoppingCart,
  FaArrowLeft,
  FaExclamationTriangle,
  FaPenFancy,
  FaCheckCircle,
  FaUserCircle,
  FaCalendarAlt
} from "react-icons/fa";

import { 
  SiVisa,
  SiMastercard,
  SiAmericanexpress,
  SiJcb
} from "react-icons/si";

// =========================================================
// COMPONENTE PARA ESTRELLAS CON FRACCIONES (4.5, 3.7, etc.)
// =========================================================
const EstrellasPromedio = ({ promedio, size = "18px" }) => {
  const pct = (parseFloat(promedio) / 5) * 100;
  return (
    <div style={{ position: "relative", display: "inline-flex", fontSize: size }}>
      {/* Estrellas grises de fondo */}
      <div style={{ display: "flex", gap: "4px", color: "#e2e8f0" }}>
        {[...Array(5)].map((_, i) => <FaStar key={i} />)}
      </div>
      {/* Estrellas doradas encima, recortadas al porcentaje */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "hidden",
        width: `${pct}%`,
        display: "flex",
        gap: "4px",
        color: "#fbbf24",
        whiteSpace: "nowrap"
      }}>
        {[...Array(5)].map((_, i) => <FaStar key={i} />)}
      </div>
    </div>
  );
};

const DescripcionProducto = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [verificandoFavorito, setVerificandoFavorito] = useState(false);
  
  const [reseñas, setReseñas] = useState([]);
  const [mostrarModalReseña, setMostrarModalReseña] = useState(false);
  const [nuevaReseña, setNuevaReseña] = useState({ calificacion: 5, comentario: '' });
  const [cargandoReseñas, setCargandoReseñas] = useState(false);
  
  const ejecutadoRef = useRef(false);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const cargarReseñas = async (productoId) => {
    setCargandoReseñas(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resenas/producto/${productoId}`);
      if (response.ok) {
        const data = await response.json();
        setReseñas(data);
      }
    } catch (error) {
      console.error("Error cargando reseñas:", error);
    } finally {
      setCargandoReseñas(false);
    }
  };

  const verificarFavorito = async (productoId) => {
    setVerificandoFavorito(true);
    try {
      const userInfo = localStorage.getItem("usuarioInfo");
      if (!userInfo) {
        setEsFavorito(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favoritos/verificar/${productoId}`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setEsFavorito(data.esFavorito);
      }
    } catch (error) {
      console.error("Error al verificar favorito:", error);
      setEsFavorito(false);
    } finally {
      setVerificandoFavorito(false);
    }
  };

  useEffect(() => {
    const cargarProducto = async () => {
      setCargando(true);
      
      if (location.state?.productoData) {
        setProducto(location.state.productoData);
        const productoId = location.state.productoData.id_producto || location.state.productoData.id || location.state.productoData.idproducto;
        await verificarFavorito(productoId);
        await cargarReseñas(productoId);
        setCargando(false);
      } else {
        await cargarProductoDesdeAPI();
      }
    };

    cargarProducto();
  }, [id, location.state]);

  const cargarProductoDesdeAPI = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/productos/${id}`);
      if (!response.ok) {
        throw new Error('Producto no encontrado');
      }
      const data = await response.json();
      setProducto(data);
      const productoId = data.id_producto || data.id || data.idproducto;
      await verificarFavorito(productoId);
      await cargarReseñas(productoId);
    } catch (error) {
      console.error("Error cargando producto:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la información del producto.",
        confirmButtonText: "Cerrar",
      });
    } finally {
      setCargando(false);
    }
  };

  const cerrarModal = () => {
    navigate(-1);
  };

  const handleAbrirCarrito = () => {
    setMostrarCarrito(true);
  };

  const handleCerrarCarrito = () => {
    setMostrarCarrito(false);
  };

  const handleFavoritoClick = async () => {
    const userInfo = localStorage.getItem("usuarioInfo");

    if (!userInfo) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para agregar productos a favoritos.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    const productoId = producto.id_producto || producto.id || producto.idproducto;
    const nombreProducto = producto.nombre;

    if (esFavorito) {
      const result = await Swal.fire({
        title: "¿Quitar de favoritos?",
        html: `¿Estás seguro de quitar <strong>"${nombreProducto}"</strong> de favoritos?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, quitar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favoritos/${productoId}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            setEsFavorito(false);
            Swal.fire({
              icon: "success",
              title: "¡Quitado!",
              text: "Producto quitado de favoritos correctamente.",
              confirmButtonText: "Aceptar",
              confirmButtonColor: "#22C55E",
              timer: 2000,
              timerProgressBar: true,
            });
          } else {
            throw new Error("Error al quitar de favoritos");
          }
        } catch (error) {
          console.error("Error al quitar de favoritos:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo quitar el producto de favoritos.",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#22C55E",
          });
        }
      }
    } else {
      try {
        const productoFavorito = {
          idproducto: productoId,
          nombre: producto.nombre,
          precio: producto.precio,
          descripcion: producto.descripcion || producto.descripcion_producto || producto.descripcion_text || "",
          imagen: producto.producto_imagen?.[0]?.url || "",
        };

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/favoritos`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productoFavorito),
        });

        if (response.ok) {
          setEsFavorito(true);
          Swal.fire({
            icon: "success",
            title: "¡Agregado!",
            html: `"<strong>${nombreProducto}</strong>" fue agregado a favoritos.`,
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#22C55E",
            timer: 2000,
            timerProgressBar: true,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al agregar a favoritos");
        }
      } catch (error) {
        console.error("Error al agregar a favoritos:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `No se pudo agregar el producto a favoritos: ${error.message}`,
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#22C55E",
        });
      }
    }
  };

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

    // ✅ Usar stock real (?? 0)
    const stockReal = producto?.stock ?? 0;
    
    if (stockReal <= 0) {
      Swal.fire({
        icon: "error",
        title: "Producto sin stock",
        text: "Lo sentimos, este producto no está disponible en este momento.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    if (cantidad > stockReal) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        html: `Solo hay <strong>${stockReal}</strong> unidades disponibles.<br>
               Por favor, selecciona una cantidad menor o igual al stock disponible.`,
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
        `${import.meta.env.VITE_API_URL}/api/carrito/agregar`,
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
      if (error.response?.status === 400 && error.response?.data?.message?.includes("Stock insuficiente")) {
        Swal.fire({
          icon: "warning",
          title: "Stock insuficiente",
          html: error.response.data.message,
          confirmButtonText: "Entendido",
          padding: "1.5rem",
        });
        return;
      }

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

  const handleComprarAhora = () => {
    if (ejecutadoRef.current) {
      console.log("Compra ya en proceso...");
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

    // ✅ Usar stock real (?? 0)
    const stockReal = producto?.stock ?? 0;
    
    if (stockReal <= 0) {
      Swal.fire({
        icon: "error",
        title: "Producto sin stock",
        text: "Lo sentimos, este producto no está disponible en este momento.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    if (cantidad > stockReal) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        html: `Solo hay <strong>${stockReal}</strong> unidades disponibles.<br>
              Por favor, selecciona una cantidad menor o igual al stock disponible.`,
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    try {
      ejecutadoRef.current = true;

      const precioAplicado = Number(
        producto.precio_final || producto.precio || 0
      );

      const precioOriginal = Number(
        producto.precio_original || producto.precio || precioAplicado
      );

      const productoCompra = {
        id: producto.id_producto || producto.id || producto.idproducto,
        idproducto: producto.id_producto || producto.id || producto.idproducto,
        nombre: producto.nombre,
        precio: precioAplicado,
        precio_final: precioAplicado,
        precio_original: precioOriginal,
        descuento_porcentaje: Number(producto.descuento_porcentaje || 0),
        tiene_promocion: Boolean(producto.tiene_promocion),
        promocion_nombre: producto.promocion_nombre || null,
        promocion_fecha_fin: producto.promocion_fecha_fin || null,
        cantidad,
        subtotal: precioAplicado * cantidad,
        imagen_url: producto.producto_imagen?.[0]?.url,
        descripcion:
          producto.descripcion ||
          producto.descripcion_producto ||
          producto.descripcion_text ||
          "",
        stock: producto.stock,
      };

      const compraDirecta = {
        tipo: "compra_directa",
        productos: [productoCompra],
        subtotal: precioAplicado * cantidad,
        total: precioAplicado * cantidad,
        cantidadTotal: cantidad,
      };

      console.log("Datos de compra directa con promoción:", compraDirecta);

      navigate("/checkout/forma-entrega", {
        state: {
          compraTipo: "directa",
          compraData: compraDirecta,
        },
      });
    } catch (error) {
      console.error("Error en compra directa:", error);
      ejecutadoRef.current = false;
    }
  };

  const enviarReseña = async () => {
    const userInfo = localStorage.getItem("usuarioInfo");
    if (!userInfo) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para escribir una reseña.",
        confirmButtonColor: "#22C55E"
      });
      return;
    }

    if (!nuevaReseña.comentario.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Comentario vacío",
        text: "Por favor escribe un comentario para tu reseña.",
        confirmButtonColor: "#22C55E"
      });
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resenas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id_producto: producto.id_producto || producto.id || producto.idproducto,
          calificacion: nuevaReseña.calificacion,
          comentario: nuevaReseña.comentario
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Gracias",
          text: "Tu reseña ha sido publicada",
          confirmButtonColor: "#22C55E"
        });
        setMostrarModalReseña(false);
        setNuevaReseña({ calificacion: 5, comentario: '' });
        await cargarReseñas(producto.id_producto || producto.id || producto.idproducto);
      } else {
        throw new Error("Error al publicar reseña");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo publicar la reseña",
        confirmButtonColor: "#22C55E"
      });
    }
  };

  const calcularDistribucion = () => {
    const distribucion = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reseñas.forEach(r => {
      if (distribucion[r.calificacion] !== undefined) {
        distribucion[r.calificacion]++;
      }
    });
    const total = reseñas.length;
    return [5, 4, 3, 2, 1].map(estrellas => ({
      estrellas,
      porcentaje: total > 0 ? (distribucion[estrellas] / total) * 100 : 0,
      count: distribucion[estrellas]
    }));
  };

  const calcularPromedio = () => {
    if (reseñas.length === 0) return 0;
    const suma = reseñas.reduce((acc, r) => acc + r.calificacion, 0);
    return (suma / reseñas.length).toFixed(1);
  };

  // ✅ Función CORREGIDA para opciones de cantidad
  const getCantidadOpciones = () => {
    // Usar el stock real, si es null o undefined usar 0
    const stockReal = producto?.stock ?? 0;
    const opciones = [];
    
    // Si no hay stock, retornar array vacío
    if (stockReal <= 0) {
      return opciones;
    }
    
    // Mostrar máximo 10 opciones o el stock disponible
    const maxOpciones = Math.min(stockReal, 10);
    for (let i = 1; i <= maxOpciones; i++) {
      opciones.push(i);
    }
    
    return opciones;
  };

  if (cargando) {
    return (
      <div className="descripcion-producto">
        <div className="producto-detalle">
          <button onClick={cerrarModal} className="btn-volver" title="Volver">
            <FaArrowLeft />
          </button>
          <div className="cargando-producto">
            <p>Cargando producto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!producto || !producto.nombre) {
    return (
      <div className="descripcion-producto">
        <div className="producto-detalle">
          <button onClick={cerrarModal} className="btn-volver" title="Volver">
            <FaArrowLeft />
          </button>
          <div className="descripcion-producto-error">
            <p>No se encontró la información del producto.</p>
          </div>
        </div>
      </div>
    );
  }

  const imagenes = producto?.producto_imagen || [];
  const imagenActual = imagenes[imagenSeleccionada];
  // ✅ CORREGIDO: usar ?? 0 en lugar de || 10
  const stockDisponible = producto?.stock ?? 0;
  const cantidadOpciones = getCantidadOpciones();
  const promedioCalificacion = calcularPromedio();
  const distribucionCalificaciones = calcularDistribucion();

  const siguienteImagen = () => {
    if (imagenes.length > 1) {
      setImagenSeleccionada((prev) => (prev + 1) % imagenes.length);
    }
  };

  const anteriorImagen = () => {
    if (imagenes.length > 1) {
      setImagenSeleccionada((prev) => (prev - 1 + imagenes.length) % imagenes.length);
    }
  };

  return (
    <div className="descripcion-producto">
      {!mostrarCarrito && (
        <button 
          className="carrito-modal-btn"
          onClick={handleAbrirCarrito}
          title="Ver carrito"
        >
          <FaShoppingCart />
        </button>
      )}

      <div className="producto-detalle">
        <button onClick={cerrarModal} className="btn-volver" title="Volver">
          <FaArrowLeft />
        </button>

        <button 
          className={`corazon-favorito ${esFavorito ? 'activo' : ''} ${verificandoFavorito ? 'cargando' : ''}`}
          onClick={handleFavoritoClick}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          disabled={verificandoFavorito}
          title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <FaHeart />
        </button>

        <div className="producto-contenedor">
          <div className="producto-layout-principal">
            <div className="producto-imagenes-columna">
              <div className="imagen-principal">
                {imagenActual?.url ? (
                  <img 
                    src={imagenActual.url} 
                    alt={producto.nombre}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    Sin imagen
                  </div>
                )}
                
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

              {imagenes.length > 1 && (
                <>
                  <div className="miniaturas-container">
                    {imagenes.map((img, idx) => (
                      <div 
                        key={idx}
                        className={`miniatura ${imagenSeleccionada === idx ? 'activa' : ''}`}
                        onClick={() => setImagenSeleccionada(idx)}
                      >
                        <img src={img.url} alt={`Miniatura ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                  <div className="contador-imagenes">
                    {imagenSeleccionada + 1} / {imagenes.length}
                  </div>
                </>
              )}
            </div>

            <div className="producto-info-columna">
              <h1 className="producto-titulo">{producto.nombre}</h1>
              
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

              <div className="calificacion-compacta">
                <div className="estrellas-container">
                  <EstrellasPromedio promedio={promedioCalificacion} size="18px" />
                </div>
                <span className="promedio-texto">{promedioCalificacion}</span>
                <span className="reseñas-count">({reseñas.length} reseñas)</span>
                {reseñas.length > 0 && (
                  <span 
                    className="ver-reseñas-link" 
                    onClick={() => document.querySelector('.reseñas-seccion')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Ver reseñas
                  </span>
                )}
              </div>

              <div className="producto-precio-box">
                {producto.tiene_promocion ? (
                  <>
                    <span className="producto-descuento-badge">
                      -{producto.descuento_porcentaje}% OFF
                    </span>
                    <span className="producto-precio-original">
                      ${Number(producto.precio_original || producto.precio).toLocaleString("es-CO")}
                    </span>
                    <span className="producto-precio-final">
                      ${Number(producto.precio_final || producto.precio).toLocaleString("es-CO")}
                    </span>
                    {producto.promocion_nombre && (
                      <small className="producto-promocion-nombre">
                        Promo: {producto.promocion_nombre}
                      </small>
                    )}
                  </>
                ) : (
                  <span className="producto-precio-normal">
                    ${Number(producto.precio || 0).toLocaleString("es-CO")}
                  </span>
                )}
              </div>

              <div className="cantidad-stock-container">
                <div className="producto-cantidad">
                  <label htmlFor="cantidad">Cantidad:</label>
                  <select
                    id="cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    disabled={stockDisponible <= 0}
                  >
                    {cantidadOpciones.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion} {opcion === 1 ? 'unidad' : 'unidades'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="producto-stock">
                  {stockDisponible <= 0 ? (
                    <div className="stock-out-alert">
                      <FaExclamationTriangle className="stock-out-alert-icon" />
                      <span className="stock-out-alert-text">Producto agotado</span>
                    </div>
                  ) : (
                    <p className={stockDisponible <= 5 ? "stock-bajo" : "stock-normal"}>
                      <FaCheckCircle />
                      {stockDisponible} unidades disponibles
                      {stockDisponible <= 5 && stockDisponible > 0 && " - Ultimas unidades"}
                    </p>
                  )}
                </div>
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
                  disabled={stockDisponible <= 0}
                >
                  {stockDisponible <= 0 ? "Producto agotado" : "Comprar Ahora"}
                </button>
                <button 
                  className="btn-agregar" 
                  onClick={handleAgregarCarrito}
                  disabled={stockDisponible <= 0}
                >
                  <FaShoppingCart />
                  {stockDisponible <= 0 ? "Sin stock" : "Agregar al carrito"}
                </button>
              </div>
            </div>
          </div>

          <div className="reseñas-seccion">
            <div className="reseñas-header">
              <h3>
                <FaStar className="estrella-activa" />
                Opiniones de clientes
              </h3>
              <button className="btn-escribir-reseña" onClick={() => setMostrarModalReseña(true)}>
                <FaPenFancy />
                Escribir una reseña
              </button>
            </div>

            {reseñas.length > 0 ? (
              <>
                <div className="resumen-calificaciones">
                  <div className="promedio-grande">
                    <div className="numero-promedio">{promedioCalificacion}</div>
                    <div className="estrellas-grandes">
                      <EstrellasPromedio promedio={promedioCalificacion} size="22px" />
                    </div>
                    <div className="total-reseñas">
                      {reseñas.length} {reseñas.length === 1 ? 'reseña' : 'reseñas'} verificadas
                    </div>
                  </div>

                  <div className="barras-calificacion">
                    {distribucionCalificaciones.map(({ estrellas, porcentaje, count }) => (
                      <div key={estrellas} className="barra-item">
                        <span className="barra-label">{estrellas} estrella</span>
                        <div className="barra-bg">
                          <div className="barra-fill" style={{ width: `${porcentaje}%` }}></div>
                        </div>
                        <span className="barra-porcentaje">{Math.round(porcentaje)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lista-reseñas">
                  {reseñas.map((reseña, idx) => (
                    <div key={idx} className="tarjeta-reseña">
                      <div className="reseña-header">
                        <div className="reseña-usuario">
                          <div className="avatar-placeholder">
                            {reseña.usuario_nombre?.charAt(0) || "U"}
                          </div>
                          <span className="usuario-nombre">{reseña.usuario_nombre || "Usuario"}</span>
                        </div>
                        <span className="reseña-fecha">
                          <FaCalendarAlt />
                          {new Date(reseña.fecha_creacion || reseña.fecha).toLocaleDateString("es-CO", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="reseña-estrellas">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < reseña.calificacion ? "estrella-activa" : "estrella-inactiva"}
                          />
                        ))}
                      </div>
                      <p className="reseña-comentario">{reseña.comentario}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="sin-reseñas">
                <p>
                  <FaStar className="estrella-activa" />
                  Se el primero en opinar sobre este producto
                </p>
                <p className="sin-reseñas-subtext">Tu opinión ayuda a otros compradores a tomar mejores decisiones</p>
                <button className="btn-escribir-reseña" onClick={() => setMostrarModalReseña(true)} style={{ marginTop: '20px' }}>
                  <FaPenFancy />
                  Escribir una reseña
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarModalReseña && (
        <div className="modal-reseña-overlay" onClick={() => setMostrarModalReseña(false)}>
          <div className="modal-reseña" onClick={(e) => e.stopPropagation()}>
            <h3>
              <FaPenFancy />
              Escribe tu opinión
            </h3>
            <p className="modal-subtext">Comparte tu experiencia con este producto</p>
            
            <div className="modal-campo">
              <label>Tu calificación</label>
              <select 
                value={nuevaReseña.calificacion} 
                onChange={(e) => setNuevaReseña({ ...nuevaReseña, calificacion: parseInt(e.target.value) })}
              >
                <option value={5}>5 estrellas - Excelente</option>
                <option value={4}>4 estrellas - Muy bueno</option>
                <option value={3}>3 estrellas - Bueno</option>
                <option value={2}>2 estrellas - Regular</option>
                <option value={1}>1 estrella - Malo</option>
              </select>
            </div>

            <div className="modal-campo">
              <label>Tu comentario</label>
              <textarea 
                placeholder="Que te pareció el producto? Como fue tu experiencia?"
                value={nuevaReseña.comentario}
                onChange={(e) => setNuevaReseña({ ...nuevaReseña, comentario: e.target.value })}
                rows="4"
              />
            </div>

            <div className="modal-botones">
              <button className="btn-cancelar" onClick={() => setMostrarModalReseña(false)}>
                Cancelar
              </button>
              <button 
                className="btn-enviar" 
                onClick={enviarReseña} 
                disabled={!nuevaReseña.comentario.trim()}
              >
                <FaCheckCircle />
                Publicar reseña
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarCarrito && (
        <Carrito
          abierto={mostrarCarrito}
          onCerrar={handleCerrarCarrito}
        />
      )}
    </div>
  );
};

export default DescripcionProducto;