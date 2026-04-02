import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../assets/Logo dulce hogar.png";
import Swal from "sweetalert2";

const Login = () => {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // 🔹 Función para mostrar alertas de éxito
  const mostrarExito = (mensaje) => {
    Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Aceptar',
      timer: 1000,
      timerProgressBar: true
    });
  };

  // 🔹 Función para mostrar alertas de error
  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje,
      confirmButtonColor: '#D84040',
      confirmButtonText: 'Entendido'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !contrasena) {
      mostrarError("Correo y contraseña son obligatorios");
      return;
    }

    setCargando(true);

    try {
      const response = await fetch("https://3e34-201-182-248-71.ngrok-free.app/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, contrasena }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mensaje genérico para credenciales incorrectas
        mostrarError("Correo o contraseña incorrectos");
        return;
      }

      mostrarExito("Inicio de sesión exitoso");

      setTimeout(() => {
        localStorage.setItem('usuarioInfo', JSON.stringify(data.usuario));
        
        if (data.usuario.rol === "administrador") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }, 1500);

    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      mostrarError("Error al conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Header específico para login */}
      <header className="login-top-bar">
        <div className="login-logo-section">
          <img src={logo} alt="Dulce hogar logo" className="login-logo-img" />
          <div className="login-logo-text">
            <span className="login-logo-title">Dulce hogar</span>
            <span className="login-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="login-help-icon">?</div>
      </header>

      {/* Contenido principal */}
      <main className="login-container">
        <div className="login-form-box">
          <h2 className="login-form-title">Inicio de sesión</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label className="login-form-label">Correo:</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-form-input"
                disabled={cargando}
              />
            </div>

            <div className="login-form-group login-password-group">
              <label className="login-form-label">Contraseña:</label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="login-form-input login-password-input"
                  disabled={cargando}
                />
                <i
                  className={`fa ${
                    showPassword ? "fa-eye-slash" : "fa-eye"
                  } login-toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ cursor: cargando ? 'not-allowed' : 'pointer' }}
                ></i>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn-ingresar" 
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <div className="login-spinner"></div>
                  Iniciando sesión...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <div className="login-form-links">
            <p className="login-forgot-password">
              ¿Olvidaste tu contraseña? <Link to="/login/Recuperar-Contrasena">Recupérala aquí</Link>
            </p>
            <p className="login-register-link">
              ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer con dimensiones consistentes */}
      <footer className="login-footer">
        <div className="login-footer-links">
          <Link to="/Consejo-de-Seguridad">Consejo de Seguridad</Link>
          <span>/</span>
          <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
          <span>/</span>
          <Link to="/preguntas-frecuentes">Preguntas Frecuentes</Link>
        </div>
        <div className="login-footer-copyright">
          © 2025 FDO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default Login;