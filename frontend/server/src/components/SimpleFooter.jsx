import React from "react";
import { Link } from "react-router-dom";
import "../styles/components/SimpleFooter.css";

const SimpleFooter = () => {
  return (
    <footer className="simple-footer">
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
