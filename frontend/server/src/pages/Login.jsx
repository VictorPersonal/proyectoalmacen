import "./Login.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Swal from "sweetalert2";

const Login = () => {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // 🔹 Validación de campos vacíos
    if (!correo || !contrasena) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, completa todos los campos.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // 🔹 Simulación de validación de usuario
    const correoValido = "admin@dulcehogar.com";
    const contrasenaValida = "123456";

    if (correo === correoValido && contrasena === contrasenaValida) {
      Swal.fire({
        icon: "success",
        title: "Inicio de sesión exitoso",
        text: "Bienvenido a Dulce Hogar",
        showConfirmButton: false,
        timer: 1800,
      }).then(() => {
        navigate("/"); // Redirige al home
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Credenciales incorrectas",
        text: "Revisa tu usuario y contraseña e inténtalo de nuevo.",
        confirmButtonColor: "#d33",
      });
    }
  };

  return (
    <div className="page-wrapper">
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Dulce hogar logo" id="logo-img" />
          <div className="logo-text">
            <span className="logo-title">Dulce hogar</span>
            <span className="logo-subtitle">
              ALMACÉN DE ELECTRODOMÉSTICOS
            </span>
          </div>
        </div>
        <div className="help-icon">?</div>
      </header>

      <main className="container">
        <div className="login-box">
          <h1 className="form-title">Inicio de sesión</h1>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="correo">Correo:</label>
              <input
                type="text"
                id="correo"
                placeholder="Correo o Teléfono"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contrasena">Contraseña:</label>
              <input
                type="password"
                id="contrasena"
                placeholder="********"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-ingresar">
              Ingresar
            </button>

            <div className="form-links">
              <p className="forgot-password">
                ¿Olvidaste tu contraseña? <a href="#">Recupérala aquí</a>
              </p>
              <p className="register-link">
                ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
              </p>
            </div>
          </form>
        </div>
      </main>

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
