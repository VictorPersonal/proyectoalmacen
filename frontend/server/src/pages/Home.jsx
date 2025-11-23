import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaChevronRight, FaUserCircle } from "react-icons/fa";
import image1 from "../assets/home1.png";
import image2 from "../assets/home2.png";
import ProductCard from "../components/productoCard";
import DescripcionProducto from "../components/DescripcionProducto";
import Carrito from "../components/Carrito";

const Home = () => {
  const [menuMasInfo, setMenuMasInfo] = useState(false);
  const images = [image1, image2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(null);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  const [usuarioLogueado, setUsuarioLogueado] = useState(false);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const navigate = useNavigate();

  const [mensajeCategoria, setMensajeCategoria] = useState("");
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

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
        console.error("Error al parsear usuario:", error);
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
    setUsuarioLogueado(false);
    setUsuarioInfo(null);
    setPerfilMenuAbierto(false);
    navigate("/");
    window.location.reload();
  };

  const normalizar = (texto) =>
    texto
      ? texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      : "";

  const ordenarPorRelevancia = (lista, query) => {
    const q = normalizar(query);
    return lista.sort((a, b) => {
      const aNombre = normalizar(a.nombre);
      const bNombre = normalizar(b.nombre);
      const aCoin = aNombre.startsWith(q) ? 2 : aNombre.includes(q) ? 1 : 0;
      const bCoin = bNombre.startsWith(q) ? 2 : bNombre.includes(q) ? 1 : 0;
      return bCoin - aCoin;
    });
  };

  const handleBuscar = async () => {
    const query = busqueda.trim();
    if (query === "") {
      setProductos([]);
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(
        `https://backend-tpeu.onrender.com/api/productos?search=${encodeURIComponent(
          query
        )}&soloActivos=true`
      );
      if (!res.ok) throw new Error("Error en la búsqueda");

      const data = await res.json();
      setProductos(
        ordenarPorRelevancia(Array.isArray(data) ? data : [], query)
      );
      setCategoriaSeleccionada(null);
      setMensajeCategoria("");
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (busqueda.trim() !== "") handleBuscar();
      else if (!categoriaSeleccionada) {
        setProductos([]);
        setMensajeCategoria("");
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [busqueda]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const toggleCarrito = () => setMostrarCarrito(!mostrarCarrito);

  // FUNCIÓN NUEVA PARA CARGAR PRODUCTOS POR CATEGORÍA
  const cargarProductosPorCategoria = async (idCategoria) => {
    setCategoriaSeleccionada(idCategoria);   
    setCargando(true);
    setBusqueda("");
    setProductoSeleccionado(null);
    setMensajeCategoria("");

    try {
      const res = await fetch(
        `https://backend-tpeu.onrender.com/api/categorias/${idCategoria}/productos`
      );

      const data = await res.json();
      console.log("Productos recibidos:", data);
      console.log("URL llamada:", `https://backend-tpeu.onrender.com/api/categorias/${idCategoria}/productos`);


      if (res.status === 404 || data.message === "No hay productos en esta categoría") {
        setProductos([]);
        setMensajeCategoria("No se encontraron productos para esta categoría.");
        return;
      }

      setProductos(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Error cargando productos por categoría:", err);
      setProductos([]);
      setMensajeCategoria("Error al cargar productos.");
    } finally {
      setCargando(false);
    }
  };

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

          <div className="search-container-home" id="search-container">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              className="search-btn"
              id="search-btn"
              onClick={handleBuscar}
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

            <a href="#" className="nav-link">
              Promociones
            </a>
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
                  {/* 👉 SOLO ADMIN: acceso al panel admin */}
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
            ❤️ Favoritos
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

      {/* CONTENIDO */}
      {productoSeleccionado ? (
        <main id="main">
          <DescripcionProducto
            producto={productoSeleccionado}
            onVolver={() => setProductoSeleccionado(null)}
            cedula={usuarioInfo?.cedula}
          />
        </main>
      ) : !categoriaSeleccionada && busqueda.trim().length === 0 && productos.length === 0 ? (
        <main id="main">
          <section className="hero-section" id="hero-section">
            <button className="carousel-btn prev" onClick={prevSlide}>
              ‹
            </button>

            <div className="carousel-container">
              <img
                src={images[currentIndex]}
                alt={`slide-${currentIndex}`}
                className="carousel-image"
              />
            </div>

            <button className="carousel-btn next" onClick={nextSlide}>
              ›
            </button>
          </section>

          {/* MAS INFORMACIÓN */}
          {busqueda.trim().length === 0 && (
            <div className="info-toggle-wrapper">
              <button
                className="info-toggle-btn"
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

          {/*Contador de resultados*/}
          {!cargando && productos.length > 0 && (
            <div className="resultados-header">
              <span className="resultados-count">
                Resultados: {productos.length}
              </span>
            </div>
          )}

          {/*Mostrar los productos*/}    
          {cargando ? (
            <p className="loading">Cargando productos...</p>
          ) : productos.length > 0 ? (
            <div className="productos-grid">  
              {productos.map((prod) => (
                <div
                  key={prod.id_producto}
                  onClick={() => setProductoSeleccionado(prod)}
                >
                  <ProductCard producto={prod} />
                </div>
              ))}
            </div>
          ) : null}
        </main>
      )}

      {/* FOOTER */}
      <footer id="footer">
        <div className="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <Link to="/terminosycondiciones">Términos y Condiciones</Link>
        </div>

        <div className="footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default Home;