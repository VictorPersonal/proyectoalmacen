import React from "react";
import { FaTools, FaWrench, FaCog, FaHardHat } from "react-icons/fa";
import "./Promociones.css";

const PromocionesSection = () => {
  return (
    <div className="section-placeholder maintenance-section">
      <div className="maintenance-icon">
        <FaTools size={64} className="maintenance-tools" />
        <FaWrench size={48} className="maintenance-wrench" />
        <FaCog size={36} className="maintenance-cog" />
      </div>
      
      <h2>Sección en Mantenimiento</h2>
      
      <div className="maintenance-message">
        <p>🚧 <strong>Estamos trabajando en esta funcionalidad</strong> 🚧</p>
        <p>La gestión de promociones estará disponible próximamente</p>
      </div>

      <div className="maintenance-footer">
        <FaHardHat className="hard-hat-icon" />
        <span>¡Volveremos pronto con novedades!</span>
      </div>
    </div>
  );
};

export default PromocionesSection;