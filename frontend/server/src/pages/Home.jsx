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

  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const categorias = ["Muebles", "Electrodomésticos", "Tecnología"];

  const subcategorias = {
    tecnología: ["Televisores", "Celulares", "Computadores"],
    electrodomésticos: ["Neveras", "Lavadoras"],
  };

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

  const toggleSubmenu = (categoria) => {
    setSubmenuAbierto(submenuAbierto === categoria ? null : categoria);
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
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/productos?search=${encodeURIComponent(
          query
        )}`
      );
      if (!res.ok) throw new Error("Error en la búsqueda");

      const data = await res.json();
      setProductos(
        ordenarPorRelevancia(Array.isArray(data) ? data : [], query)
      );
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
      else setProductos([]);
    }, 500);

    return () => clearTimeout(delay);
  }, [busqueda]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleBuscar();
  };

  const toggleCarrito = () => setMostrarCarrito(!mostrarCarrito);

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

          <div className="search-container" id="search-container">
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
                        {(categoria === "Tecnología" ||
                          categoria === "Electrodomésticos") ? (
                          <div
                            className="categoria-item con-submenu"
                            onMouseEnter={() =>
                              toggleSubmenu(categoria.toLowerCase())
                            }
                            onMouseLeave={() => setSubmenuAbierto(null)}
                          >
                            <span>{categoria}</span>
                            <FaChevronRight className="submenu-icon" />
                            {submenuAbierto === categoria.toLowerCase() && (
                              <div className="submenu">
                                {subcategorias[categoria.toLowerCase()].map(
                                  (subitem, subIndex) => (
                                    <a
                                      key={subIndex}
                                      href="#"
                                      className="submenu-item"
                                    >
                                      {subitem}
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <a href="#" className="categoria-item">
                            {categoria}
                          </a>
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
      ) : busqueda.trim() === "" ? (
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

                    {/* CORREGIDO */}
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
        <main className="resultados">
          {!cargando && productos.length > 0 && (
            <div className="resultados-header">
              <span className="resultados-count">
                Resultados: {productos.length}
              </span>
            </div>
          )}

          {cargando ? (
            <p className="loading">Cargando productos...</p>
          ) : productos.length > 0 ? (
            <div className="productos-grid">
              {productos.map((prod) => (
                <div
                  key={prod.id_producto || prod.id}
                  onClick={() => setProductoSeleccionado(prod)}
                >
                  <ProductCard producto={prod} />
                </div>
              ))}
            </div>
          ) : (
            <p className="no-result">No se encontraron productos.</p>
          )}

          {/* MAS INFORMACIÓN - BUSQUEDA VACÍA */}
          {busqueda.trim().length === 0 && productos.length === 0 && (
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
                      href="https://api.whatsapp.com/send?phone=573103749429&text=Hola,%20quiero%20más%20información"
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