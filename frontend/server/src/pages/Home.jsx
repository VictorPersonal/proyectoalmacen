import React, { useState, useEffect } from "react";
import "./Home.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import image1 from "../assets/images.jpg";
import image2 from "../assets/soga.jpg";
import ProductCard from "../components/productoCard";

const Home = () => {
  const images = [image1, image2];
  const [currentIndex, setCurrentIndex] = useState(0);

  const [busqueda, setBusqueda] = useState("");
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
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
            <a href="#" className="nav-link">Categorías ∨</a>
            <a href="#" className="nav-link">Promociones</a>
            <a href="#" className="nav-link">Contacto</a>
            <a href="#" className="nav-link">Ayuda</a>
          </div>

          <div className="cart-icon">
            <FaShoppingCart />
          </div>
        </nav>

        <div className="auth-links" id="auth-links">
          <Link to="/registro" id="link-registrarse">Registrarse</Link>
          <Link to="/login" id="link-login">Iniciar sesión</Link>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      {busqueda.trim() === "" ? (
        <main id="main">
          <section className="hero-section" id="hero-section">
            <button className="carousel-btn prev" onClick={prevSlide}>‹</button>
            <div className="carousel-container">
              <img
                src={images[currentIndex]}
                alt={`slide-${currentIndex}`}
                className="carousel-image"
              />
            </div>
            <button className="carousel-btn next" onClick={nextSlide}>›</button>
          </section>
        </main>
      ) : (
        <main className="resultados">
          {/* ETIQUETA DE RESULTADOS - ESQUINA IZQUIERDA */}
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
                <ProductCard key={prod.id_producto || prod.id} producto={prod} />
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