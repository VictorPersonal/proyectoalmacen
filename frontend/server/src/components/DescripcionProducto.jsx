import React, { useState, useRef, useEffect } from "react";
import "./DescripcionProducto.css";
import Swal from "sweetalert2";
import { FaStar, FaHeart, FaShoppingCart, FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";
import { SiVisa, SiMastercard, SiAmericanexpress, SiJcb } from "react-icons/si";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Carrito from "./Carrito";

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
  const ejecutadoRef = useRef(false);

  // 🔒 Efecto para deshabilitar el scroll cuando el modal está abierto
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Cargar producto desde API o desde state
  useEffect(() => {
    const cargarProducto = async () => {
      setCargando(true);
      
      if (location.state?.productoData) {
        setProducto(location.state.productoData);
        setCargando(false);
        // Verificar si el producto está en favoritos
        await verificarFavorito(location.state.productoData.id_producto || location.state.productoData.id || location.state.productoData.idproducto);
      } else {
        await cargarProductoDesdeAPI();
      }
    };

    cargarProducto();
  }, [id, location.state]);

  // Función para verificar si el producto está en favoritos
  const verificarFavorito = async (productoId) => {
    setVerificandoFavorito(true);
    try {
      const userInfo = localStorage.getItem("usuarioInfo");
      if (!userInfo) {
        setEsFavorito(false);
        return;
      }

      const response = await fetch(`http://localhost:4000/api/favoritos/verificar/${productoId}`, {
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

  const cargarProductoDesdeAPI = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/productos/${id}`);
      if (!response.ok) {
        throw new Error('Producto no encontrado');
      }
      const data = await response.json();
      setProducto(data);
      // Verificar si el producto está en favoritos
      await verificarFavorito(data.id_producto || data.id || data.idproducto);
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

  // 🔹 Función para agregar/quitar de favoritos
  const handleFavoritoClick = async () => {
    const userInfo = localStorage.getItem("usuarioInfo");

    if (!userInfo) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para agregar productos a favoritos.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#D84040",
      });
      return;
    }

    const productoId = producto.id_producto || producto.id || producto.idproducto;
    const nombreProducto = producto.nombre;

    if (esFavorito) {
      // Quitar de favoritos
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
          const response = await fetch(`http://localhost:4000/api/favoritos/${productoId}`, {
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
              confirmButtonColor: "#D84040",
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
            confirmButtonColor: "#D84040",
          });
        }
      }
    } else {
      // Agregar a favoritos
      try {
        const productoFavorito = {
          idproducto: productoId,
          nombre: producto.nombre,
          precio: producto.precio,
          descripcion: producto.descripcion || producto.descripcion_producto || producto.descripcion_text || "",
          imagen: producto.producto_imagen?.[0]?.url || "",
        };

        const response = await fetch("http://localhost:4000/api/favoritos", {
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
            confirmButtonColor: "#D84040",
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
          confirmButtonColor: "#D84040",
        });
      }
    }
  };

  // 🔹 Función para agregar al carrito CON VALIDACIÓN DE STOCK
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

    // Validar que haya stock disponible
    if (producto.stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Producto sin stock",
        text: "Lo sentimos, este producto no está disponible en este momento.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    // Validar que la cantidad no exceda el stock
    if (cantidad > producto.stock) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        html: `Solo hay <strong>${producto.stock}</strong> unidades disponibles.<br>
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
      // Manejar error específico de stock insuficiente
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

  // 🔹 Función para comprar ahora CON VALIDACIÓN DE STOCK
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

    // Validar que haya stock disponible
    if (producto.stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Producto sin stock",
        text: "Lo sentimos, este producto no está disponible en este momento.",
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    // Validar que la cantidad no exceda el stock
    if (cantidad > producto.stock) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        html: `Solo hay <strong>${producto.stock}</strong> unidades disponibles.<br>
               Por favor, selecciona una cantidad menor o igual al stock disponible.`,
        confirmButtonText: "Entendido",
        padding: "1.5rem",
      });
      return;
    }

    try {
      ejecutadoRef.current = true;

      console.log("🛒 Iniciando compra directa (solo una vez)");

      const compraDirecta = {
        tipo: "compra_directa",
        productos: [
          {
            id: producto.id_producto || producto.id || producto.idproducto,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            imagen_url: producto.producto_imagen?.[0]?.url,
            descripcion: producto.descripcion || producto.descripcion_producto || producto.descripcion_text,
            stock: producto.stock
          }
        ],
        total: producto.precio * cantidad,
        cantidadTotal: cantidad
      };

      console.log("📦 Datos de compra directa:", compraDirecta);

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

  // 🔹 Función para actualizar las opciones de cantidad basadas en el stock
  const getCantidadOpciones = () => {
    const stockDisponible = producto.stock || 10;
    const opciones = [];
    
    for (let i = 1; i <= Math.min(stockDisponible, 10); i++) {
      opciones.push(i);
    }
    
    return opciones;
  };

  // Si está cargando, mostrar loading
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

  // Si no hay producto después de cargar, mostrar error
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
  const stockDisponible = producto.stock || 10;
  const cantidadOpciones = getCantidadOpciones();

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
      {/* ✅ Icono del carrito FUERA del modal - SE OCULTA CUANDO EL CARRITO ESTÁ ABIERTO */}
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
        {/* ✅ Botón volver - SOLO FLECHA */}
        <button onClick={cerrarModal} className="btn-volver" title="Volver">
          <FaArrowLeft />
        </button>

        {/* ❤️ Corazón de favoritos */}
        <button 
          className={`corazon-favorito ${esFavorito ? 'activo' : ''} ${verificandoFavorito ? 'cargando' : ''}`}
          onClick={handleFavoritoClick}
          aria-label={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          disabled={verificandoFavorito}
          title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <FaHeart />
          {verificandoFavorito && <span className="cargando-favorito"></span>}
        </button>

        {/* 📦 Sección de Imágenes */}
        <div className="producto-imagen-placeholder">
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
            <div className="contador-imagenes">
              {imagenSeleccionada + 1} / {imagenes.length}
            </div>
          )}
        </div>

        {/* 📋 Información del Producto */}
        <div className="producto-info">
          <h2>{producto.nombre}</h2>
          
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

          {/* ⚠️ Mensaje de sin stock */}
          {stockDisponible <= 0 && (
            <div className="stock-out-alert">
              <FaExclamationTriangle className="stock-out-alert-icon" />
              <span className="stock-out-alert-text">
                Producto agotado temporalmente
              </span>
            </div>
          )}

          <div className="producto-cantidad" style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <label htmlFor="cantidad">Cantidad:</label>
            <select
              id="cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              disabled={stockDisponible <= 0}
              style={{
                height: "45px",
                padding: "0 15px",
                borderRadius: "8px",
                fontSize: "16px",
                border: stockDisponible <= 0 ? "1px solid #ccc" : "1px solid #ddd",
                backgroundColor: stockDisponible <= 0 ? "#f8f9fa" : "white",
                cursor: stockDisponible <= 0 ? "not-allowed" : "pointer",
                color: stockDisponible <= 0 ? "#6c757d" : "#212529"
              }}
            >
              {cantidadOpciones.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion} {opcion === 1 ? 'unidad' : 'unidades'}
                </option>
              ))}
            </select>
          </div>

          <div className="producto-stock">
            <p className={stockDisponible <= 5 ? "stock-bajo" : "stock-normal"}>
              N° Disponibles: {stockDisponible}
              {stockDisponible <= 5 && stockDisponible > 0 }
              {stockDisponible <= 0 && " ❌"}
            </p>
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
              style={{
                opacity: stockDisponible <= 0 ? 0.6 : 1,
                cursor: stockDisponible <= 0 ? "not-allowed" : "pointer"
              }}
            >
              {stockDisponible <= 0 ? "Producto agotado" : "Comprar Ahora"}
            </button>
            <button 
              className="btn-agregar" 
              onClick={handleAgregarCarrito}
              disabled={stockDisponible <= 0}
              style={{
                opacity: stockDisponible <= 0 ? 0.6 : 1,
                cursor: stockDisponible <= 0 ? "not-allowed" : "pointer"
              }}
            >
              {stockDisponible <= 0 ? "Sin stock" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ CARRITO RENDERIZADO DENTRO DEL MODAL */}
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