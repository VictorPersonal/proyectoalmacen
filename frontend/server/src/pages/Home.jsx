import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaChevronRight, FaUserCircle } from "react-icons/fa";
import image1 from "../assets/images.jpg";
import image2 from "../assets/soga.jpg";
import ProductCard from "../components/productoCard";
import DescripcionProducto from "../components/DescripcionProducto";

const Home = () => {
  const images = [image1, image2];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(null);
  const [perfilMenuAbierto, setPerfilMenuAbierto] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estado para la autenticación
  const [usuarioLogueado, setUsuarioLogueado] = useState(false);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const navigate = useNavigate();

  const categorias = ["Muebles", "Electrodomésticos", "Tecnología"];

  const subcategorias = {
    tecnología: ["Televisores", "Celulares", "Computadores"],
    electrodomésticos: ["Neveras", "Lavadoras"],
  };

  // Verificar autenticación al cargar el componente
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
        console.error("Error al parsear información del usuario:", error);
        localStorage.removeItem("usuarioInfo");
      }
    }
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
    setSubmenuAbierto(null);
  };

  const toggleSubmenu = (categoria) => {
    if (submenuAbierto === categoria) {
      setSubmenuAbierto(null);
    } else {
      setSubmenuAbierto(categoria);
    }
  };

  const togglePerfilMenu = () => {
    setPerfilMenuAbierto(!perfilMenuAbierto);
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem("usuarioInfo");
    setUsuarioLogueado(false);
    setUsuarioInfo(null);
    setPerfilMenuAbierto(false);
    navigate("/");
    window.location.reload();
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
        `http://localhost:4000/api/productos?search=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Error en la búsqueda");
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al buscar productos:", error);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleBuscar();
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

          <div className="search-container" id="search-container">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button className="search-btn" id="search-btn" onClick={handleBuscar}>
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
                        {categoria === "Tecnología" || categoria === "Electrodomésticos" ? (
                          <div
                            className="categoria-item con-submenu"
                            onMouseEnter={() => toggleSubmenu(categoria.toLowerCase())}
                            onMouseLeave={() => setSubmenuAbierto(null)}
                          >
                            <span>{categoria}</span>
                            <FaChevronRight className="submenu-icon" />
                            {submenuAbierto === categoria.toLowerCase() &&
                              subcategorias[categoria.toLowerCase()] && (
                                <div className="submenu">
                                  {subcategorias[categoria.toLowerCase()].map(
                                    (subitem, subIndex) => (
                                      <a key={subIndex} href="#" className="submenu-item">
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
                  <button className="perfil-item cerrar-sesion" onClick={handleCerrarSesion}>
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
          <div className="cart-icon">
            <FaShoppingCart />
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      {productoSeleccionado ? (
        <DescripcionProducto
          producto={productoSeleccionado}
          onVolver={() => setProductoSeleccionado(null)}
        />
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
        </main>
      )}

      {/* PIE DE PÁGINA */}
      <footer id="footer">
        <div className="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div className="footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default Home;
