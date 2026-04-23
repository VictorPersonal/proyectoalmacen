import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../styles/pages/RestablecerContrasena.css";
import SimpleHeader from "../components/SimpleHeader";
import SimpleFooter from "../components/SimpleFooter";

const RestablecerContrasena = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [errores, setErrores] = useState({});
  const navigate = useNavigate();
  const { token } = useParams();

  // Función para validar la contraseña
  const validarContrasena = (contrasena) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena);
  };

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar contraseña
    if (!nuevaContrasena) {
      nuevosErrores.contrasena = "La contraseña es requerida";
    } else if (!validarContrasena(nuevaContrasena)) {
      nuevosErrores.contrasena = "La contraseña no cumple con los requisitos";
    }

    // Validar confirmación de contraseña
    if (!confirmarContrasena) {
      nuevosErrores.confirmacion = "Debes confirmar tu contraseña";
    } else if (nuevaContrasena !== confirmarContrasena) {
      nuevosErrores.confirmacion = "Las contraseñas no coinciden";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejar cambio de contraseña
  const handleContrasenaChange = (e) => {
    const valor = e.target.value;
    setNuevaContrasena(valor);
    
    // Limpiar error si se está corrigiendo
    if (errores.contrasena) {
      setErrores(prev => ({ ...prev, contrasena: "" }));
    }
    
    // Si hay confirmación, verificar si coinciden
    if (confirmarContrasena && confirmarContrasena !== valor) {
      setErrores(prev => ({ ...prev, confirmacion: "Las contraseñas no coinciden" }));
    } else if (confirmarContrasena && confirmarContrasena === valor) {
      setErrores(prev => ({ ...prev, confirmacion: "" }));
    }
  };

  // Manejar cambio de confirmación
  const handleConfirmacionChange = (e) => {
    const valor = e.target.value;
    setConfirmarContrasena(valor);
    
    // Limpiar error si se está corrigiendo
    if (errores.confirmacion) {
      setErrores(prev => ({ ...prev, confirmacion: "" }));
    }
    
    // Verificar si coinciden
    if (nuevaContrasena && nuevaContrasena !== valor) {
      setErrores(prev => ({ ...prev, confirmacion: "Las contraseñas no coinciden" }));
    } else if (nuevaContrasena && nuevaContrasena === valor) {
      setErrores(prev => ({ ...prev, confirmacion: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar formulario
    if (!validarFormulario()) {
      setMensaje("Por favor, corrige los errores en el formulario");
      setTipoMensaje("error");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaContrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Contraseña actualizada correctamente. Serás redirigido al login...");
        setTipoMensaje("exito");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setMensaje(data.message || "Error al restablecer contraseña");
        setTipoMensaje("error");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
      setTipoMensaje("error");
    }
  };

  return (
    <div className="restablecer-page-wrapper">
      {/* ===== HEADER ===== */}
      <SimpleHeader />

      {/* ===== BODY ===== */}
      <main className="restablecer-container">
        <div className="restablecer-form-box">
          <h2 className="restablecer-form-title">Restablecer Contraseña</h2>

          {mensaje && (
            <div
              className={`restablecer-mensaje ${
                tipoMensaje === "exito" ? "restablecer-mensaje-exito" : "restablecer-mensaje-error"
              }`}
            >
              {mensaje}
            </div>
          )}

          <form className="restablecer-form" onSubmit={handleSubmit}>
            {/* Contenedor para campos de contraseña - PRIMERO */}
            <div className="restablecer-password-fields">
              {/* Campo 1: Nueva Contraseña */}
              <div className="restablecer-form-group">
                <label className="restablecer-form-label">Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="Ingresa tu nueva contraseña"
                  value={nuevaContrasena}
                  onChange={handleContrasenaChange}
                  className={`restablecer-form-input ${
                    errores.contrasena ? "restablecer-error-input" : ""
                  }`}
                />
                {errores.contrasena && (
                  <span className="restablecer-error-message">{errores.contrasena}</span>
                )}
              </div>

              {/* Campo 2: Confirmar Contraseña */}
              <div className="restablecer-form-group">
                <label className="restablecer-form-label">Confirmar Contraseña</label>
                <input
                  type="password"
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmarContrasena}
                  onChange={handleConfirmacionChange}
                  className={`restablecer-form-input ${
                    errores.confirmacion ? "restablecer-error-input" : ""
                  }`}
                />
                {errores.confirmacion && (
                  <span className="restablecer-error-message">{errores.confirmacion}</span>
                )}
              </div>
            </div>

            {/* Sugerencia de contraseña */}
            <div className="restablecer-password-hint">
              La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial (@$!%*?&)
            </div>

            {/* Botón */}
            <button type="submit" className="restablecer-btn-actualizar">
              Actualizar Contraseña
            </button>
          </form>

          <div className="restablecer-form-links">
            <Link to="/login">Volver al inicio de sesión</Link>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <SimpleFooter />
    </div>
  );
};

export default RestablecerContrasena;
