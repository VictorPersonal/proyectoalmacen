import "../styles/pages/RecuperarContrasena.css";
import { useNavigate, Link } from "react-router-dom";
import React, { useState } from "react";
import Swal from "sweetalert2";
import SimpleHeader from "../components/SimpleHeader";
import SimpleFooter from "../components/SimpleFooter";

const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      // Mostrar error con SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, ingresa tu correo electrónico',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar'
      });
      setMensaje("Por favor, ingresa tu correo electrónico");
      setTipoMensaje("error");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar error con SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: data.message || 'No se pudo enviar el correo de recuperación',
          confirmButtonColor: '#d33',
          confirmButtonText: 'Aceptar'
        });
        setMensaje(data.message || "No se pudo enviar el correo de recuperación");
        setTipoMensaje("error");
        return;
      }

      // Mostrar éxito con SweetAlert
      Swal.fire({
        icon: 'success',
        title: '¡Correo enviado!',
        html: `
          <p style="margin: 15px 0; font-size: 16px;">
            Correo de recuperación enviado exitosamente.
          </p>
          <p style="margin: 15px 0; font-size: 14px; color: #666;">
            Revisa tu bandeja de entrada y también la carpeta de spam.
          </p>
          <p style="margin: 15px 0; font-size: 12px; color: #999;">
            Serás redirigido al login en 3 segundos...
          </p>
        `,
        showConfirmButton: true,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Aceptar',
        timer: 3000,
        timerProgressBar: true,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      setMensaje("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      setTipoMensaje("exito");

      // Redirigir después de 3 segundos
      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      
      // Mostrar error de conexión con SweetAlert
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Aceptar'
      });
      
      setMensaje("Error al conectar con el servidor");
      setTipoMensaje("error");
    }
  };

  return (
    <div className="recuperar-page-wrapper">
      <SimpleHeader />

      <div className="recuperar-container">
        <div className="recuperar-form-box">
          <h2 className="recuperar-form-title">Recuperar contraseña</h2>

          {mensaje && (
            <div
              className={`recuperar-mensaje ${
                tipoMensaje === "exito" ? "recuperar-mensaje-exito" : "recuperar-mensaje-error"
              }`}
            >
              {mensaje}
            </div>
          )}

          <form className="recuperar-form" onSubmit={handleSubmit}>
            <div className="recuperar-form-group">
              <label className="recuperar-form-label">Email:</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="recuperar-form-input"
              />
            </div>

            <p className="recuperar-info-text">
              Al presionar <b>"Restablecer contraseña"</b> se enviará un correo
              con un link para restablecer su contraseña.
            </p>

            <button type="submit" className="recuperar-btn-enviar">
              Restablecer Contraseña
            </button>
          </form>

          <div className="recuperar-form-links">
            <p className="recuperar-login-link">
              ¿Recordaste tu contraseña?{" "}
              <Link to="/login">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <SimpleFooter />
    </div>
  );
};

export default RecuperarContrasena;