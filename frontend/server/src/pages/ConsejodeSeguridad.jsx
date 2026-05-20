import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt, FaLock, FaCookie, FaCheckCircle, FaCreditCard } from "react-icons/fa";
import "../styles/pages/ConsejodeSeguridad.css";

export default function ConsejodeSeguridad() {
  const navigate = useNavigate();

  const consejos = [
    { 
      title: "Conexión segura (HTTPS)", 
      desc: "Asegura todo el sitio con HTTPS/TLS y renueva certificados.",
      icon: <FaLock />
    },
    { 
      title: "Política de seguridad de contenidos (CSP)", 
      desc: "Limita orígenes de scripts para evitar XSS.",
      icon: <FaShieldAlt />
    },
    { 
      title: "Cookies y sesiones seguras", 
      desc: "Usa Secure, HttpOnly y SameSite en las cookies.",
      icon: <FaCookie />
    },
    { 
      title: "Validación y sanitización", 
      desc: "Valida y limpia entradas de usuarios para evitar inyecciones.",
      icon: <FaCheckCircle />
    },
    { 
      title: "Pago seguro", 
      desc: "Usa pasarelas certificadas y no almacenes datos de tarjetas.",
      icon: <FaCreditCard />
    }
  ];

  return (
    <div className="cs-wrapper">
      <div className="cs-card">
        <button className="cs-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Volver
        </button>
        
        <h2 className="cs-title">
          <FaShieldAlt className="cs-title-icon" />
          Consejo de Seguridad
        </h2>
        <p className="cs-subtitle">Protege tu sitio web y los datos de tus usuarios</p>
        
        <ul className="cs-list">
          {consejos.map((consejo, index) => (
            <li key={index} className="cs-item">
              <div className="cs-item-header">
                <span className="cs-item-icon">{consejo.icon}</span>
                <h3 className="cs-item-title">{consejo.title}</h3>
              </div>
              <p className="cs-item-desc">{consejo.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}