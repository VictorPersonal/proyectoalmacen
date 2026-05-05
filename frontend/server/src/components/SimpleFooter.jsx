import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import "../styles/components/SimpleFooter.css";

const SimpleFooter = () => {
  return (
    <footer className="simple-footer">
      <div className="social-media">
        <h4>Redes sociales</h4>
        <div className="social-icons">
          <a className="social-icon"
            href="https://www.facebook.com/dulce.hogar.3192479"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF />
          </a>
          <a className="social-icon"
            href="https://www.instagram.com/dulcehogarcaicedonia?igsh=ZnA2MWVicnZod2ly"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram />
          </a>
          <a className="social-icon"
            href="https://wa.me/573103749429?text=Hola,+quiero+más+información"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp /> 
          </a>
        </div>
      </div>
      <div className="info-footer">
        <p>Dulce hogar del Norte S.A.S<br></br>
        NIT<br></br>
        Ubicados en:<br></br>
        Cra 16 #7-17<br></br>
        </p>

      </div>
      <div className="simple-footer-links">
        <Link to="/consejo-de-seguridad">Consejo de Seguridad</Link>
        <span>/</span>
        <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
        <span>/</span>
        <Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link>
      </div>
      <div className="simple-footer-copyright">
        © 2025 FDO, todos los derechos reservados
      </div>
    </footer>
  );
};

export default SimpleFooter;

