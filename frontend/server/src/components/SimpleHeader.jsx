import React from "react";
import logo from "../assets/Logo dulce hogar.png";
import "../styles/components/SimpleHeader.css";

const SimpleHeader = () => {
  return (
    <header className="simple-header">
      <div className="simple-header-logo-section">
        <img src={logo} alt="Dulce hogar logo" className="simple-header-logo-img" />
        <div className="simple-header-logo-text">
          <span className="simple-header-logo-title">Dulce hogar</span>
          <span className="simple-header-logo-subtitle">Tradición y Calidad</span>
        </div>
      </div>
      <div className="simple-header-help-icon">?</div>
    </header>
  );
};

export default SimpleHeader;

