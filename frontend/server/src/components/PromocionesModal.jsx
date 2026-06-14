import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaTimes, 
  FaTag, 
  FaPercent, 
  FaClock, 
  FaFire
} from "react-icons/fa";
import "../styles/components/PromocionesModal.css";
import API_URL from "../config/api.js";

const PromocionesModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    if (isOpen) {
      cargarProductosConPromociones();
    }
  }, [isOpen]);

  const cargarProductosConPromociones = async () => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/api/productos`);
      if (!response.ok) throw new Error("Error al cargar productos");
      
      const data = await response.json();
      
      const productosConPromo = data.filter(
        producto => producto.tiene_promocion === true
      );
      
      setProductos(productosConPromo);
      
      const cats = {};
      productosConPromo.forEach(prod => {
        if (prod.idcategoria && !cats[prod.idcategoria]) {
          cats[prod.idcategoria] = {
            id: prod.idcategoria,
            nombre: prod.nombre_categoria || `Categoría ${prod.idcategoria}`
          };
        }
      });
      
      setCategorias(Object.values(cats));
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setCargando(false);
    }
  };

  const handleProductoClick = (producto) => {
    onClose();
    navigate(`/producto/${producto.idproducto}`, {
      state: { 
        backgroundLocation: location,
        productoData: producto,
        from: 'promociones'
      }
    });
  };

  const calcularTiempoRestante = (fechaFin) => {
    if (!fechaFin) return "Tiempo limitado";
    const fin = new Date(fechaFin);
    const ahora = new Date();
    const diff = fin - ahora;
    
    if (diff <= 0) return "Finalizada";
    
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (86400000)) / 3600000);
    
    if (dias > 0) return `${dias}d ${horas}h`;
    if (horas > 0) return `${horas}h restantes`;
    return "Pocas horas";
  };

  const productosFiltrados = categoriaSeleccionada === "todas" 
    ? productos 
    : productos.filter(p => p.idcategoria == categoriaSeleccionada);

  if (!isOpen) return null;

  return (
    <div className="promociones-modal-overlay" onClick={onClose}>
      <div className="promociones-modal" onClick={(e) => e.stopPropagation()}>
        <div className="promociones-modal-header">
          <div className="header-left">
            <FaTag className="header-icon" />
            <h2>Ofertas Especiales</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="promociones-modal-subtitle">
          <FaFire className="subtitle-icon" />
          <p>Productos con descuento activo</p>
          <span className="productos-count">{productos.length} productos</span>
        </div>

        {categorias.length > 0 && (
          <div className="categorias-filtros">
            <button 
              className={`filtro-btn ${categoriaSeleccionada === "todas" ? "active" : ""}`}
              onClick={() => setCategoriaSeleccionada("todas")}
            >
              Todos
            </button>
            {categorias.map(cat => (
              <button 
                key={cat.id}
                className={`filtro-btn ${categoriaSeleccionada == cat.id ? "active" : ""}`}
                onClick={() => setCategoriaSeleccionada(cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        )}

        <div className="promociones-modal-content">
          {cargando ? (
            <div className="loading-state">
              <div className="promo-spinner"></div>
              <p>Cargando ofertas...</p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="empty-state">
              <FaTag className="empty-icon" />
              <p>No hay productos en oferta en esta categoría</p>
            </div>
          ) : (
            <div className="promo-productos-grid">
              {productosFiltrados.map((producto) => (
                <div 
                  key={producto.idproducto} 
                  className="producto-card"
                  onClick={() => handleProductoClick(producto)}
                >
                  <div className="descuento-badge">
                    <FaPercent />
                    <span>-{producto.descuento_porcentaje}%</span>
                  </div>
                  
                  <div className="timer-badge">
                    <FaClock />
                    <span>{calcularTiempoRestante(producto.promocion_fecha_fin)}</span>
                  </div>

                  <div className="producto-imagen">
                    {producto.producto_imagen && producto.producto_imagen[0]?.url ? (
                      <img src={producto.producto_imagen[0].url} alt={producto.nombre} />
                    ) : (
                      <div className="imagen-placeholder">
                        <FaTag />
                      </div>
                    )}
                  </div>

                  <div className="producto-info">
                    <h3 className="producto-nombre">{producto.nombre}</h3>
                    
                    <div className="producto-precios">
                      <span className="precio-original">
                        ${Number(producto.precio_original).toLocaleString("es-CO")}
                      </span>
                      <span className="precio-oferta">
                        ${Number(producto.precio_final).toLocaleString("es-CO")}
                      </span>
                    </div>

                    <div className="producto-ahorro">
                      <FaFire />
                      <span>Ahorra ${Number(producto.precio_original - producto.precio_final).toLocaleString("es-CO")}</span>
                    </div>

                    {producto.promocion_nombre && (
                      <div className="promo-nombre">{producto.promocion_nombre}</div>
                    )}
                  </div>

                  <button 
                    className="ver-oferta-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductoClick(producto);
                    }}
                  >
                    Ver oferta
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromocionesModal;