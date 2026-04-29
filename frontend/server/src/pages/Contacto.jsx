import React, { useState } from "react";
import { Link } from "react-router-dom";
import SimpleHeader from "../components/SimpleHeader";
import SimpleFooter from "../components/SimpleFooter";
import {
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaStore,
  FaArrowRight,
  FaPaperPlane,
  FaUser,
  FaComment,
} from "react-icons/fa";

const ContactoDH = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría la lógica real de envío
    setEnviado(true);
    setTimeout(() => setEnviado(false), 4000);
    setFormData({ nombre: "", email: "", mensaje: "" });
  };

  return (
    <>


      <div className="contacto-wrapper">
        <SimpleHeader />

        {/* ─── HERO ─── */}
        <section className="contacto-hero">
          <div className="contacto-hero-badge">
            <FaStore size={12} />
            Dulce Hogar · Caicedonia
          </div>
          <h1>Estamos aquí para ayudarte</h1>
          <p>
            Contáctanos por el canal que prefieras. Nuestro equipo está listo
            para responder tus preguntas y asesorarte en tu compra.
          </p>
        </section>

        {/* ─── CONTENIDO PRINCIPAL ─── */}
        <main className="contacto-main">

          {/* ──── COLUMNA IZQUIERDA ──── */}
          <div className="contacto-col-left">

            {/* Información de contacto */}
            <div className="contacto-card">
              <h2 className="contacto-card-title">
                <FaPhone /> Información de contacto
              </h2>
              <ul className="contacto-info-list">
                <li className="contacto-info-item">
                  <div className="contacto-info-icon"><FaPhone /></div>
                  <div className="contacto-info-text">
                    <strong>Teléfono</strong>
                    <span>+57 310 374 9429</span>
                  </div>
                </li>
                <li className="contacto-info-item">
                  <div className="contacto-info-icon"><FaEnvelope /></div>
                  <div className="contacto-info-text">
                    <strong>Correo electrónico</strong>
                    <span>info@dulcehogar.com</span>
                  </div>
                </li>
                <li className="contacto-info-item">
                  <div className="contacto-info-icon"><FaMapMarkerAlt /></div>
                  <div className="contacto-info-text">
                    <strong>Dirección</strong>
                    <span>Caicedonia, Valle del Cauca, Colombia</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Redes sociales */}
            <div className="contacto-card">
              <h2 className="contacto-card-title">
                <FaComment /> Síguenos y escríbenos
              </h2>
              <div className="contacto-redes-grid">

                <a
                  href="https://www.facebook.com/dulce.hogar.3192479"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contacto-red contacto-red-facebook"
                >
                  <div className="contacto-red-icon">
                    <FaFacebook />
                  </div>
                  <span className="contacto-red-label">
                    <strong style={{ display: "block", fontSize: "15px", color: "#1E293B" }}>Facebook</strong>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>dulce.hogar.3192479</span>
                  </span>
                  <FaArrowRight className="contacto-red-arrow" />
                </a>

                <a
                  href="https://www.instagram.com/dulcehogarcaicedonia?igsh=ZnA2MWVicnZod2ly"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contacto-red contacto-red-instagram"
                >
                  <div className="contacto-red-icon">
                    <FaInstagram />
                  </div>
                  <span className="contacto-red-label">
                    <strong style={{ display: "block", fontSize: "15px", color: "#1E293B" }}>Instagram</strong>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>@dulcehogarcaicedonia</span>
                  </span>
                  <FaArrowRight className="contacto-red-arrow" />
                </a>

                <a
                  href="https://wa.me/573103749429?text=Hola,+quiero+más+información"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contacto-red contacto-red-whatsapp"
                >
                  <div className="contacto-red-icon">
                    <FaWhatsapp />
                  </div>
                  <span className="contacto-red-label">
                    <strong style={{ display: "block", fontSize: "15px", color: "#1E293B" }}>WhatsApp</strong>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>+57 310 374 9429</span>
                  </span>
                  <FaArrowRight className="contacto-red-arrow" />
                </a>

              </div>
            </div>

            {/* Horario */}
            <div className="contacto-card">
              <h2 className="contacto-card-title">
                <FaClock /> Horario de atención
              </h2>
              <div>
                <div className="contacto-horario-row">
                  <span className="contacto-horario-dia">Lunes – Viernes</span>
                  <span className="contacto-horario-hora">8:00 AM – 7:00 PM</span>
                </div>
                <div className="contacto-horario-row">
                  <span className="contacto-horario-dia">Sábado</span>
                  <span className="contacto-horario-hora">8:00 AM – 6:00 PM</span>
                </div>
                <div className="contacto-horario-row">
                  <span className="contacto-horario-dia">Domingo</span>
                  <span className="contacto-horario-cerrado">Cerrado</span>
                </div>
              </div>
            </div>

            {/* Banner historia */}
            <Link to="/Acerca-de/Dulce-Hogar" className="contacto-historia-banner">
              <div className="contacto-historia-tag">
                <FaStore size={11} /> Nuestra historia
              </div>
              <h3>Conoce Dulce Hogar</h3>
              <p>
                Más de 25 años llevando calidad y confianza a los hogares de
                Caicedonia y el norte del Valle del Cauca.
              </p>
              <span className="contacto-historia-btn">
                Ver nuestra historia <FaArrowRight size={13} />
              </span>
            </Link>

          </div>

          {/* ──── COLUMNA DERECHA: FORMULARIO ──── */}


        </main>

        <SimpleFooter />
      </div>
    </>
  );
};

export default ContactoDH;
