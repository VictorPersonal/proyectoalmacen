import React from "react";
import "./ConsejodeSeguridad.css";

export default function ConsejodeSeguridad() {
  const consejos = [
    { title: "Conexión segura (HTTPS)", desc: "Asegura todo el sitio con HTTPS/TLS y renueva certificados." },
    { title: "Política de seguridad de contenidos (CSP)", desc: "Limita orígenes de scripts para evitar XSS." },
    { title: "Cookies y sesiones seguras", desc: "Usa Secure, HttpOnly y SameSite en las cookies." },
    { title: "Validación y sanitización", desc: "Valida y limpia entradas de usuarios para evitar inyecciones." },
    { title: "Pago seguro", desc: "Usa pasarelas certificadas y no almacenes datos de tarjetas." }
  ];

  return (
    <section className="cs-wrapper">
      <div className="cs-card">
        <h2 className="cs-title">Consejo de Seguridad</h2>
        <ul className="cs-list">
          {consejos.map((c, i) => (
            <li key={i} className="cs-item">
              <h3 className="cs-item-title">{c.title}</h3>
              <p className="cs-item-desc">{c.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
