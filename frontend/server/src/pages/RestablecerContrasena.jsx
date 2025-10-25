import { useNavigate, useParams } from "react-router-dom";
import React, { useState } from "react";

const RestablecerContrasena = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();
  const { token } = useParams(); // 👈 cambia esto

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevaContrasena) {
      setMensaje("Por favor, ingresa una nueva contraseña");
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
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setMensaje(data.message || "Error al restablecer contraseña");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  return (
    <div className="restablecer-wrapper">
      <h2>Restablecer Contraseña</h2>

      {mensaje && <p>{mensaje}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={nuevaContrasena}
          onChange={(e) => setNuevaContrasena(e.target.value)}
        />
        <button type="submit">Actualizar Contraseña</button>
      </form>
    </div>
  );
};

export default RestablecerContrasena;
