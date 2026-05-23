import React, { useState, useEffect } from "react";
import "../styles/pages/Home.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaShoppingCart, FaChevronRight, FaUserCircle, FaHeart, FaChevronLeft, FaChevronRight as FaRight, FaSearch, FaSlidersH } from "react-icons/fa";
import image1 from "../assets/home1.png";
import image2 from "../assets/home2.png";
import ProductCard from "../components/productoCard";
import Carrito from "../components/Carrito";
import SimpleFooter from "../components/SimpleFooter";
import PromocionesModal from "../components/PromocionesModal";
import FiltrosModal from "../components/FiltrosModal";

const Home = () => {
  const [menuMasInfo, setMenuMasInfo] = useState(false);
  const images = [image1, image2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(null);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);
  const [mostrarPromociones, setMostrarPromociones] = useState(false);

  // ✅ INICIALIZAR ESTADO DESDE sessionStorage
  const getEstadoInicial = () => {
    const estadoGuardado = sessionStorage.getItem('homeEstado');
    if (estadoGuardado) {
      try {
        return JSON.parse(estadoGuardado);
      } catch (error) {
        console.error("Error parsing saved state:", error);
        sessionStorage.removeItem('homeEstado');
      }
    }
    return {
      busqueda: "",
      productos: [],
      productosFiltrados: [],
      categoriaSeleccionada: null,
      mensajeCategoria: ""
    };
  };

  const estadoInicial = getEstadoInicial();
  
  const [busqueda, setBusqueda] = useState(estadoInicial.busqueda);
  const [productos, setProductos] = useState(estadoInicial.productos);
  const [productosFiltrados, setProductosFiltrados] = useState(estadoInicial.productosFiltrados);
  const [cargando, setCargando] = useState(false);

  const [usuarioLogueado, setUsuarioLogueado] = useState(false);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [mensajeCategoria, setMensajeCategoria] = useState(estadoInicial.mensajeCategoria);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(estadoInicial.categoriaSeleccionada);

  // \u2500\u2500 FILTROS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const FILTROS_DEFAULT = { ordenar: "recientes", precioMin: 0, precioMax: 5000000, idMarca: "todas" };
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState(FILTROS_DEFAULT);

  const hayFiltrosAplicados = (f) =>
    f.ordenar !== "recientes" || f.precioMin > 0 || f.precioMax < 5000000 || f.idMarca !== "todas";

  // ✅ GUARDAR ESTADO EN sessionStorage CUANDO CAMBIE
  useEffect(() => {
    const estado = {
      busqueda,
      productos,
      productosFiltrados,
      categoriaSeleccionada,
      mensajeCategoria
    };
    sessionStorage.setItem('homeEstado', JSON.stringify(estado));
  }, [busqueda, productos, productosFiltrados, categoriaSeleccionada, mensajeCategoria]);

  // ✅ LIMPIAR ESTADO CUANDO SE ENTRE DIRECTAMENTE AL HOME SIN BÚSQUEDA ACTIVA
  useEffect(() => {
    // Solo limpiar si venimos de una navegación externa (no del modal de producto)
    const isNavigationFromProduct = 
      location.state?.from === 'producto' || 
      location.state?.backgroundLocation;
    
    const hasActiveSearch = estadoInicial.busqueda || estadoInicial.categoriaSeleccionada;
    
    if (!isNavigationFromProduct && !hasActiveSearch) {
      // Limpiar todo el estado
      setBusqueda("");
      setProductos([]);
      setProductosFiltrados([]);
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
      sessionStorage.removeItem('homeEstado');
    }
  }, [location]);

  // ✅ EFECTO PARA CAMBIO AUTOMÁTICO DE SLIDES
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 15000); 

    return () => clearInterval(interval);
  }, [images.length]);

  // CATEGORÍAS ACTUALIZADAS - Estructura mejorada con IDs
  const categorias = [
    {
      nombre: "Tecnología",
      subcategorias: [
        { id: 1, nombre: "Televisores" },
        { id: 6, nombre: "Celulares" },
        { id: 7, nombre: "Computadores" }
      ]
    },
    {
      nombre: "Electrodomésticos",
      subcategorias: [
        { id: 2, nombre: "Aspiradoras" },
        { id: 3, nombre: "Lavadoras" },
        { id: 4, nombre: "Refrigeradores" },
        { id: 5, nombre: "Neveras" }
      ]
    },
    {
      nombre: "Muebles",
      subcategorias: [
        { id: 8, nombre: "Muebles" }
      ]
    }
  ];

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = () => {
    const usuarioGuardado = localStorage.getItem("usuarioInfo");
    if (usuarioGuardado) {
      try {
        const usuario = JSON.parse(usuarioGuardado);
        setUsuarioLogueado(true);
        setUsuarioInfo(usuario);
      } catch (error) {
        localStorage.removeItem("usuarioInfo");
      }
    }
  };

  const prevSlide = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const nextSlide = () =>
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
    setSubmenuAbierto(null);
  };

  const toggleSubmenu = (categoriaIndex) => {
    setSubmenuAbierto(submenuAbierto === categoriaIndex ? null : categoriaIndex);
  };

  const togglePerfilMenu = () => setPerfilMenuAbierto(!perfilMenuAbierto);

  const handleCerrarSesion = () => {
    localStorage.removeItem("usuarioInfo");
    sessionStorage.removeItem('homeEstado');
    setUsuarioLogueado(false);
    setUsuarioInfo(null);
    setPerfilMenuAbierto(false);
    navigate("/");
  };

  const normalizar = (texto) =>
    texto
      ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";

  const filtrarProductos = (productos, query) => {
    if (!query.trim()) return productos;
    
    const q = normalizar(query);
    const palabras = q.split(' ').filter(palabra => palabra.length > 0);
    
    return productos.filter(producto => {
      const nombreNormalizado = normalizar(producto.nombre);
      const descripcionNormalizada = normalizar(producto.descripcion);
      
      return palabras.some(palabra => 
        nombreNormalizado.includes(palabra) || 
        descripcionNormalizada.includes(palabra)
      );
    });
  };

  const ordenarPorRelevancia = (lista, query) => {
    const q = normalizar(query);
    const palabras = q.split(' ').filter(palabra => palabra.length > 0);
    
    return lista.sort((a, b) => {
      const aNombre = normalizar(a.nombre);
      const bNombre = normalizar(b.nombre);
      const aDesc = normalizar(a.descripcion);
      const bDesc = normalizar(b.descripcion);
      
      let aPuntos = 0;
      let bPuntos = 0;
      
      palabras.forEach(palabra => {
        if (aNombre === palabra) aPuntos += 10;
        if (bNombre === palabra) bPuntos += 10;
        if (aNombre.startsWith(palabra)) aPuntos += 5;
        if (bNombre.startsWith(palabra)) bPuntos += 5;
        if (aNombre.includes(palabra)) aPuntos += 3;
        if (bNombre.includes(palabra)) bPuntos += 3;
        if (aDesc.includes(palabra)) aPuntos += 1;
        if (bDesc.includes(palabra)) bPuntos += 1;
      });
      
      return bPuntos - aPuntos;
    });
  };

  // Construye la URL con filtros completos
  const construirURL = (query, filtros) => {
    const params = new URLSearchParams();
    if (query && query.trim()) params.set("search", query.trim());
    if (filtros.idMarca && filtros.idMarca !== "todas") params.set("idMarca", filtros.idMarca);
    if (filtros.precioMin > 0) params.set("precioMin", filtros.precioMin);
    if (filtros.precioMax < 5000000) params.set("precioMax", filtros.precioMax);
    if (filtros.ordenar && filtros.ordenar !== "recientes") params.set("ordenar", filtros.ordenar);
    return `http://localhost:4000/api/productos?${params.toString()}`;
  };

  const handleBuscar = async (filtrosOverride) => {
    const query = busqueda.trim();
    const filtros = filtrosOverride || filtrosActivos;
    const tieneQuery = query !== "";
    const tieneFiltros = hayFiltrosAplicados(filtros);

    if (!tieneQuery && !tieneFiltros) {
      setProductos([]);
      setProductosFiltrados([]);
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
      return;
    }
    setCargando(true);
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));
    try {
      const url = construirURL(query, filtros);
      const [_, response] = await Promise.all([minLoadingTime, fetch(url)]);
      if (!response.ok) throw new Error("Error en la busqueda");
      const data = await response.json();
      const productosRecibidos = Array.isArray(data) ? data : [];
      let resultados = productosRecibidos;
      if (tieneQuery && (filtros.ordenar === "recientes" || !filtros.ordenar)) {
        const filtradosTexto = filtrarProductos(productosRecibidos, query);
        resultados = ordenarPorRelevancia(filtradosTexto, query);
      }
      setProductos(productosRecibidos);
      setProductosFiltrados(resultados);
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
    } catch (error) {
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
  };

  const handleAplicarFiltros = (nuevosFiltros) => {
    setFiltrosActivos(nuevosFiltros);
    // Use ref trick: call buscar with new filtros directly
    const query = document.querySelector('.search-container-home input')?.value.trim() || "";
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (nuevosFiltros.idMarca && nuevosFiltros.idMarca !== "todas") params.set("idMarca", nuevosFiltros.idMarca);
    if (nuevosFiltros.precioMin > 0) params.set("precioMin", nuevosFiltros.precioMin);
    if (nuevosFiltros.precioMax < 5000000) params.set("precioMax", nuevosFiltros.precioMax);
    if (nuevosFiltros.ordenar && nuevosFiltros.ordenar !== "recientes") params.set("ordenar", nuevosFiltros.ordenar);
    setCargando(true);
    fetch(`http://localhost:4000/api/productos?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setProductos(lista);
        setProductosFiltrados(lista);
        setCategoriaSeleccionada(null);
        setMensajeCategoria(lista.length === 0 ? "No se encontraron productos con esos filtros." : "");
      })
      .catch(() => { setProductos([]); setProductosFiltrados([]); })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (busqueda.trim() !== "") handleBuscar();
      else if (!categoriaSeleccionada) {
        setProductos([]);
        setProductosFiltrados([]);
        setMensajeCategoria("");
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [busqueda]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const toggleCarrito = () => setMostrarCarrito(!mostrarCarrito);

  const handleSeleccionarProducto = (producto) => {
    navigate(`/producto/${producto.id_producto || producto.id || producto.idproducto}`, {
      state: { 
        backgroundLocation: location,
        productoData: producto,
        from: 'producto'
      }
    });
  };

  const cargarProductosPorCategoria = async (idCategoria) => {
    setCategoriaSeleccionada(idCategoria);   
    setCargando(true);
    
    setBusqueda("");
    setMensajeCategoria("");

    try {
      const response = await fetch(`http://localhost:4000/api/productos`);
      const data = await response.json();
      
      const productosFiltradosPorCategoria = data.filter(
        producto => Number(producto.idcategoria) === Number(idCategoria)
      );
      
      setProductos(productosFiltradosPorCategoria);
      setProductosFiltrados(productosFiltradosPorCategoria);
      
      if (productosFiltradosPorCategoria.length === 0) {
        setMensajeCategoria("No se encontraron productos para esta categoría.");
      }
      
    } catch (err) {
      console.error("Error cargando productos:", err);
      setMensajeCategoria("Error al cargar productos.");
    } finally {
      setCargando(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
    setProductos([]);
    setProductosFiltrados([]);
    setCategoriaSeleccionada(null);
    setMensajeCategoria("");
    setFiltrosActivos(FILTROS_DEFAULT);
    sessionStorage.removeItem('homeEstado');
  };

  const mostrarCarrusel = !categoriaSeleccionada && busqueda.trim().length === 0 && productos.length === 0;

  return (
    <div>
      {/* ENCABEZADO */}
      <header id="header">
        <nav className="navbar" id="navbar">
          <div className="logo-container" id="logo-container">
            <div className="logo-icon" id="logo-icon">
              <img src={logo} alt="Dulce hogar logo" />
            </div>
            <div className="logo-text" id="logo-text">
              <h1>Dulce hogar</h1>
              <p>Tradición y calidad</p>
            </div>
          </div>

          <div className="search-and-filter-wrapper">
            <div className="search-container-home" id="search-container">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              
              <button
                className="clear-btn"
                onClick={limpiarBusqueda}
                title="Limpiar búsqueda"
                style={{ display: busqueda.trim() ? 'flex' : 'none' }}
              >
                ✕
              </button>
              
              <button
                className="search-btn"
                onClick={() => handleBuscar()}
                title="Buscar"
                style={{ display: busqueda.trim() ? 'none' : 'flex' }}
              >
                <FaSearch />
              </button>
            </div>

            <button
              className={`filtros-toggle-btn${hayFiltrosAplicados(filtrosActivos) ? " filtros-toggle-activo" : ""}`}
              onClick={() => setMostrarFiltros(true)}
              title="Filtros"
            >
              <FaSlidersH className="filtros-toggle-icon" />
              {hayFiltrosAplicados(filtrosActivos) && (
                <span className="filtros-badge" />
              )}
            </button>
          </div>

          <div className="auth-links" id="auth-links">
            {usuarioLogueado ? (
              <div className="perfil-menu">
                <button className="perfil-btn" onClick={togglePerfilMenu}>
                  <FaUserCircle className="perfil-icon" />
                  <span className="nombre-usuario">
                    {usuarioInfo?.nombre || usuarioInfo?.cedula}
                  </span>
                </button>

                {perfilMenuAbierto && (
                  <div className="perfil-desplegable">
                    <Link
                      to="/ajustes-de-cuenta"
                      className="perfil-item"
                      onClick={() => setPerfilMenuAbierto(false)}
                    >
                      Ajustes de cuenta
                    </Link>

                    <button
                      className="perfil-item cerrar-sesion"
                      onClick={handleCerrarSesion}
                    >
                      Cerrar sesión
                    </button>
                    {usuarioInfo?.rol === "administrador" && (
                      <button
                        className="nav-link admin-panel-btn"
                        onClick={() => navigate("/admin")}
                        style={{ marginRight: "10px" }}
                      >
                        Panel Admin
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/registro" id="link-registrarse">
                  Registrarse
                </Link>
                <Link to="/login" id="link-login">
                  Iniciar sesión
                </Link>
              </>
            )}

            <Link to="/favoritos" className="nav-link favoritos-link">
              <FaHeart className="favoritos-icon" />
              Favoritos
            </Link>

            <div className="cart-icon" onClick={toggleCarrito}>
              <FaShoppingCart />
            </div>
          </div>
        </nav>

        <div className="nav-links" id="nav-links">
          <div className="categorias-menu">
            <button className="nav-link categorias-btn" onClick={toggleMenu}>
              Categorías ∨
            </button>

            {menuAbierto && (
              <div className="menu-desplegable">
                <div className="categorias-lista">
                  {categorias.map((categoria, index) => (
                    <div key={index} className="categoria-item-container">
                      {categoria.subcategorias.length > 1 ? (
                        <div
                          className="categoria-item con-submenu"
                          onMouseEnter={() => toggleSubmenu(index)}
                          onMouseLeave={() => setSubmenuAbierto(null)}
                        >
                          <span>{categoria.nombre}</span>
                          <FaChevronRight className="submenu-icon" />

                          {submenuAbierto === index && (
                            <div className="submenu">
                              {categoria.subcategorias.map((sub, i) => (
                                <button
                                  key={i}
                                  className="submenu-item"
                                  onClick={() => {
                                    cargarProductosPorCategoria(sub.id);
                                    setMenuAbierto(false);
                                  }}
                                >
                                  {sub.nombre}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          className="categoria-item"
                          onClick={() => {
                            cargarProductosPorCategoria(
                              categoria.subcategorias[0].id
                            );
                            setMenuAbierto(false);
                          }}
                        >
                          {categoria.nombre}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ✅ Botón Promociones - Ahora abre el modal */}
          <button 
            className="nav-link promociones-btn" 
            onClick={() => setMostrarPromociones(true)}
          >
            Promociones
          </button>

          <a href="#" className="nav-link">
            Ayuda
          </a>
        </div>
      </header>

      {/* CARRITO */}
      {mostrarCarrito && (
        <Carrito
          abierto={mostrarCarrito}
          cedula={usuarioInfo?.cedula}
          onCerrar={() => setMostrarCarrito(false)}
        />
      )}

      {/* MODAL DE PROMOCIONES */}
      <PromocionesModal 
        isOpen={mostrarPromociones} 
        onClose={() => setMostrarPromociones(false)} 
      />

      {/* MODAL DE FILTROS */}
      <FiltrosModal
        isOpen={mostrarFiltros}
        onClose={() => setMostrarFiltros(false)}
        onAplicar={handleAplicarFiltros}
        filtrosActivos={filtrosActivos}
      />

      {/* CONTENIDO ACTUALIZADO */}
      {mostrarCarrusel ? (
        <main id="main">
          <section className="hero-section" id="hero-section">
            <button className="carousel-btn prev" onClick={prevSlide}>
              <FaChevronLeft />
            </button>

            <div className="carousel-container">
              <div className="carousel-images-container">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`slide-${index}`}
                    className={`carousel-image ${
                      index === currentIndex ? 'active' : ''
                    } ${
                      index === (currentIndex === 0 ? images.length - 1 : currentIndex - 1) ? 'previous' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <button className="carousel-btn next" onClick={nextSlide}>
              <FaRight />
            </button>
          </section>
        </main>
      ) : (
        <main className="resultados">
          {mensajeCategoria && (
            <p className="no-result">{mensajeCategoria}</p>
          )}

          {busqueda.trim() && (
            <div className="resultados-header">
              <span className="resultados-count">
                Búsqueda: "{busqueda}" - Encontrados: {productosFiltrados.length} de {productos.length}
              </span>
            </div>
          )}

          {!busqueda.trim() && !cargando && productosFiltrados.length > 0 && (
            <div className="resultados-header">
              <span className="resultados-count">
                Resultados: {productosFiltrados.length}
              </span>
            </div>
          )}

          {cargando ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p className="loading-text">Cargando productos...</p>
              <p className="loading-subtext">Por favor espera, esto puede tomar unos segundos</p>
            </div>
          ) : productosFiltrados.length > 0 ? (
            <div className="productos-grid">  
              {productosFiltrados.map((prod) => (
                <div
                  key={prod.idproducto}
                  onClick={() => handleSeleccionarProducto(prod)}
                >
                  <ProductCard producto={prod} />
                </div>
              ))}
            </div>
          ) : busqueda.trim() && productos.length > 0 ? (
            <p className="no-result">
              No se encontraron productos que coincidan exactamente con "{busqueda}".
              Se encontraron {productos.length} productos similares.
            </p>
          ) : null}
        </main>
      )}

      {/* FOOTER */}
      <SimpleFooter />
    </div>
  );
};

export default Home;