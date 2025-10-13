import React, { useState } from "react";
import "./Home.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link } from "react-router-dom";
import image1 from "../assets/images.jpg";
import image2 from "../assets/soga.jpg";

const Home = () => {
  // Lista de imágenes del carrusel
  const images = [image1, image2];

  // Estado para controlar qué imagen se muestra
  const [currentIndex, setCurrentIndex] = useState(0);

  // Función para ir a la imagen anterior
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Función para ir a la siguiente imagen
  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div>
      {/* Encabezado */}
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
            <input type="text" placeholder="Buscar productos..." />
            <button className="search-btn" id="search-btn">
              🔍
            </button>
          </div>

          <div className="nav-links" id="nav-links">
            <a href="#" className="nav-link" id="link-categorias">
              Categorías ∨
            </a>
            <a href="#" className="nav-link" id="link-promociones">
              Promociones
            </a>
            <a href="#" className="nav-link" id="link-contacto">
              Contacto
            </a>
            <a href="#" className="nav-link" id="link-ayuda">
              Ayuda
            </a>
          </div>
        </nav>

        <div className="auth-links" id="auth-links">
          <Link to="/registro" id="link-registrarse">
            Registrarse
          </Link>
          <Link to="/login" id="link-login">
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Carrusel */}
      <main id="main">
        <section className="hero-section" id="hero-section">
          <button
            className="carousel-btn prev"
            id="btn-prev"
            onClick={prevSlide}
          >
            ‹
          </button>

          <div className="carousel-container">
            <img
              src={images[currentIndex]}
              alt={`slide-${currentIndex}`}
              className="carousel-image"
            />
          </div>

          <button
            className="carousel-btn next"
            id="btn-next"
            onClick={nextSlide}
          >
            ›
          </button>
        </section>
      </main>

      {/* Pie de página */}
      <footer id="footer">
        <div className="footer-links" id="footer-links">
          <a href="#" id="link-faq">
            Preguntas frecuentes
          </a>
          <span>/</span>
          <a href="#" id="link-seguridad">
            Consejos de seguridad
          </a>
          <span>/</span>
          <a href="#" id="link-terminos">
            Términos
          </a>
        </div>
        <div className="footer-copyright" id="footer-copy">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default Home;
