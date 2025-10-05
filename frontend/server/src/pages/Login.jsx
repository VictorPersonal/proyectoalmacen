import "./Login.css";
import logo from "../assets/Logo dulce hogar.png";
import { Link } from "react-router-dom";  

const Login = () => {
  return (
    <div className="page-wrapper">
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

      <main className="container">
        <div className="login-box">
          <h1 className="form-title">Inicio de sesión</h1>

          <form className="login-form">
            <div className="form-group">
              <label htmlFor="correo">Correo:</label>
              <input
                type="text"
                id="correo"
                placeholder="Correo o Teléfono"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contrasena">Contraseña:</label>
              <input
                type="password"
                id="contrasena"
                placeholder="********"
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
