import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // ✅ Está en el mismo directorio

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

      // ✅ Redirigir al Home después de 1 segundo
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      setMensaje("Error al conectar con el servidor");
      setTipoMensaje("error");
    }
  };

  return (
    <div className="container">
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
                className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} toggle-password`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          <button type="submit" className="btn-ingresar">Ingresar</button>
        </form>

        <div className="form-links">
          <p className="forgot-password">
            ¿Olvidaste tu contraseña? <a href="#">Recupérala aquí</a>
          </p>
          <p className="register-link">
            ¿No tienes cuenta? <a href="/registro">Regístrate aquí</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
