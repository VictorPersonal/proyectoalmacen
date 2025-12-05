import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaShoppingCart, FaChevronRight, FaUserCircle, FaHeart, FaChevronLeft, FaChevronRight as FaRight } from "react-icons/fa";
import image1 from "../assets/home1.png";
import image2 from "../assets/home2.png";
import ProductCard from "../components/productoCard";
import Carrito from "../components/Carrito";

const Home = () => {
  const [menuMasInfo, setMenuMasInfo] = useState(false);
  const images = [image1, image2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(null);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);

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
    if (images.length <= 1) return; // No hacer nada si solo hay una imagen
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 15000); 

    return () => clearInterval(interval); // Limpiar intervalo al desmontar
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
    sessionStorage.removeItem('homeEstado'); // ✅ Limpiar estado al cerrar sesión
    setUsuarioLogueado(false);
    setUsuarioInfo(null);
    setPerfilMenuAbierto(false);
    navigate("/");
  };

  const normalizar = (texto) =>
    texto
      ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";

  // FILTRO MEJORADO - más estricto
  const filtrarProductos = (productos, query) => {
    if (!query.trim()) return productos;
    
    const q = normalizar(query);
    const palabras = q.split(' ').filter(palabra => palabra.length > 0);
    
    return productos.filter(producto => {
      const nombreNormalizado = normalizar(producto.nombre);
      const descripcionNormalizada = normalizar(producto.descripcion);
      
      // Buscar coincidencias exactas de palabras
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
      
      // Puntuación más precisa
      let aPuntos = 0;
      let bPuntos = 0;
      
      palabras.forEach(palabra => {
        // Coincidencia exacta en nombre
        if (aNombre === palabra) aPuntos += 10;
        if (bNombre === palabra) bPuntos += 10;
        
        // Empieza con la palabra
        if (aNombre.startsWith(palabra)) aPuntos += 5;
        if (bNombre.startsWith(palabra)) bPuntos += 5;
        
        // Contiene la palabra en nombre
        if (aNombre.includes(palabra)) aPuntos += 3;
        if (bNombre.includes(palabra)) bPuntos += 3;
        
        // Contiene en descripción
        if (aDesc.includes(palabra)) aPuntos += 1;
        if (bDesc.includes(palabra)) bPuntos += 1;
      });
      
      return bPuntos - aPuntos;
    });
  };

  const handleBuscar = async () => {
    const query = busqueda.trim();
    if (query === "") {
      setProductos([]);
      setProductosFiltrados([]);
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/productos?search=${encodeURIComponent(
          query
        )}&soloActivos=true`
      );
      if (!res.ok) throw new Error("Error en la búsqueda");

      const data = await res.json();
      const productosRecibidos = Array.isArray(data) ? data : [];
      
      // Aplicar filtro adicional en frontend
      const productosFiltrados = filtrarProductos(productosRecibidos, query);
      const productosOrdenados = ordenarPorRelevancia(productosFiltrados, query);
      
      setProductos(productosRecibidos);
      setProductosFiltrados(productosOrdenados);
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
      
    } catch (error) {
      setProductos([]);
      setProductosFiltrados([]);
    } finally {
      setCargando(false);
    }
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

  // ✅ FUNCIÓN ACTUALIZADA: Navegación a producto con modal superpuesto
  const handleSeleccionarProducto = (producto) => {
    navigate(`/producto/${producto.id_producto || producto.id || producto.idproducto}`, {
      state: { 
        backgroundLocation: location,
        productoData: producto,
        from: 'producto' // ✅ Indicar que venimos del producto
      }
    });
  };

  // FUNCIÓN NUEVA PARA CARGAR PRODUCTOS POR CATEGORÍA
  const cargarProductosPorCategoria = async (idCategoria) => {
    setCategoriaSeleccionada(idCategoria);   
    setCargando(true);
    setBusqueda("");
    setMensajeCategoria("");

    try {
      const res = await fetch(
        `http://localhost:4000/api/categorias/${idCategoria}/productos`
      );

      const data = await res.json();

      if (res.status === 404 || data.message === "No hay productos en esta categoría") {
        setProductos([]);
        setProductosFiltrados([]);
        setMensajeCategoria("No se encontraron productos para esta categoría.");
        return;
      }

      const productosData = Array.isArray(data) ? data : [];
      setProductos(productosData);
      setProductosFiltrados(productosData);

    } catch (err) {
      setProductos([]);
      setProductosFiltrados([]);
      setMensajeCategoria("Error al cargar productos.");
    } finally {
      setCargando(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA: Limpiar búsqueda completamente
  const limpiarBusqueda = () => {
    setBusqueda("");
    setProductos([]);
    setProductosFiltrados([]);
    setCategoriaSeleccionada(null);
    setMensajeCategoria("");
    sessionStorage.removeItem('homeEstado');
  };

  // Determinar qué productos mostrar
  const productosAMostrar = categoriaSeleccionada ? productosFiltrados : productosFiltrados;

  // ✅ NUEVO: Determinar si mostrar el carrusel o los resultados
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
              <p>ALMACÉN DE ELECTRODOMÉSTICOS</p>
            </div>
          </div>

          {/* ✅ BUSCADOR CORREGIDO - Solo un botón visible a la vez */}
          <div className="search-container-home" id="search-container">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            
            {/* Botón X - Solo visible cuando hay texto */}
            <button
              className="clear-btn"
              onClick={limpiarBusqueda}
              title="Limpiar búsqueda"
              style={{ display: busqueda.trim() ? 'flex' : 'none' }}
            >
              ✕
            </button>
            
            {/* Botón Lupa - Solo visible cuando NO hay texto */}
            <button
              className="search-btn"
              onClick={handleBuscar}
              title="Buscar"
              style={{ display: busqueda.trim() ? 'none' : 'flex' }}
            >
              🔍
            </button>
          </div>

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

            <Link to="/promociones" className="nav-link">
              Promociones
            </Link>
            <a href="#" className="nav-link">
              Contacto
            </a>
            <a href="#" className="nav-link">
              Ayuda
            </a>
          </div>
        </nav>

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
      </header>

      {/* CARRITO */}
      {mostrarCarrito && (
        <Carrito
          abierto={mostrarCarrito}
          cedula={usuarioInfo?.cedula}
          onCerrar={() => setMostrarCarrito(false)}
        />
      )}

      {/* CONTENIDO ACTUALIZADO */}
      {mostrarCarrusel ? (
        <main id="main">
          {/* ✅ CARRUSEL ACTUALIZADO CON NUEVA TRANSICIÓN */}
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
              
              {/* Indicadores de slide */}
              <div className="carousel-indicators">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                  />
                ))}
              </div>
            </div>

            <button className="carousel-btn next" onClick={nextSlide}>
              <FaRight />
            </button>
          </section>

          {busqueda.trim().length === 0 && (
            <div className="info-toggle-wrapper">
              <button
                className={`info-toggle-btn ${menuMasInfo ? 'abierto' : ''}`}
                onClick={() => setMenuMasInfo(!menuMasInfo)}
              >
                Más información ▾
              </button>

              {menuMasInfo && (
                <div className="info-panel">
                  <div className="info-column">
                    <h4>Acerca de</h4>
                    <Link to="/Acerca-de/Dulce-Hogar">Dulce Hogar</Link>
                  </div>

                  <div className="info-column">
                    <h4>Redes sociales</h4>
                    <a
                      href="https://www.facebook.com/dulce.hogar.3192479"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://www.instagram.com/dulcehogarcaicedonia?igsh=ZnA2MWVicnZod2ly"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://wa.me/573103749429?text=Hola,+quiero+más+información"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      ) : (
        /* Mostrar productos ya sea por búsqueda o por categoría */
        <main className="resultados">
          {/* ⭐ Si hay mensaje por categoría (sin productos) */}
          {mensajeCategoria && (
            <p className="no-result">{mensajeCategoria}</p>
          )}

          {/* Información de búsqueda */}
          {busqueda.trim() && (
            <div className="resultados-header">
              <span className="resultados-count">
                Búsqueda: "{busqueda}" - Encontrados: {productosFiltrados.length} de {productos.length}
              </span>
            </div>
          )}

          {/*Contador de resultados para categorías*/}
          {!busqueda.trim() && !cargando && productosFiltrados.length > 0 && (
            <div className="resultados-header">
              <span className="resultados-count">
                Resultados: {productosFiltrados.length}
              </span>
            </div>
          )}

          {/*Mostrar los productos*/}    
          {cargando ? (
            <p className="loading">Cargando productos...</p>
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
      <footer id="footer">
        <div className="footer-links">
          <Link to="/ConsejodeSeguridad">Consejo de Seguridad</Link>
          <span>/</span>
          <Link to="/terminosycondiciones">Términos y Condiciones</Link>
          <span>/</span>
          <Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link>
        </div>

        <div className="footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default Home;