import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../assets/Logo dulce hogar.png";


const Login = () => {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!email || !contrasena) {
    setMensaje("Correo y contraseña son obligatorios");
    setTipoMensaje("error");
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, contrasena }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMensaje(data.message || "Error al iniciar sesión");
      setTipoMensaje("error");
      return;
    }

    setMensaje("Inicio de sesión exitoso");
    setTipoMensaje("exito");

    // 🔹 Redirigir según el rol
    setTimeout(() => {
  // Guardar información del usuario en localStorage
      localStorage.setItem('usuarioInfo', JSON.stringify(data.usuario));
      
      if (data.usuario.rol === "administrador") {
        navigate("/admin");
        window.location.reload(); // Forzar recarga
      } else {
        navigate("/");
        window.location.reload(); // Forzar recarga
      }
    }, 1000);
  } catch (error) {
    console.error("Error al conectar con el servidor:", error);
    setMensaje("Error al conectar con el servidor");
    setTipoMensaje("error");
  }
};

    return (
    <div className="page-wrapper">
      {/* 🔹 Header igual al de RecuperarContraseña */}
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Dulce hogar logo" id="logo-img" />
          <div className="logo-text">
            <span className="logo-title">Dulce hogar</span>
            <span className="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="help-icon">?</div>
      </header>

      {/* 🔹 Contenido principal (no modificado) */}
      <main className="container">
        <div className="login-box">
          <h2 className="form-title">Inicio de sesión</h2>

          {mensaje && (
            <div
              className={`mensaje ${
                tipoMensaje === "exito" ? "mensaje-exito" : "mensaje-error"
              }`}
            >
              {mensaje}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Correo:</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group password-group">
              <label>Contraseña:</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <i
                  className={`fa ${
                    showPassword ? "fa-eye-slash" : "fa-eye"
                  } toggle-password`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
            </div>

            <button type="submit" className="btn-ingresar">
              Ingresar
            </button>
          </form>

          <div className="form-links">
            <p className="forgot-password">
              ¿Olvidaste tu contraseña? <Link to="/login/Recuperar-Contrasena">Recupérala aquí</Link>
            </p>
            <p className="register-link">
              ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
            </p>
          </div>
        </div>
      </main>

      {/* 🔹 Footer igual al de RecuperarContraseña */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div className="footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default Login;