import { useState, useEffect } from "react";
import "./ActualizarDatos.css";
import logo from "../assets/Logo dulce hogar.png";
import { useNavigate } from "react-router-dom";

function ActualizarPerfil() {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  // 🔹 Cargar perfil desde backend (usando cookie con token)
  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      try {
        const res = await fetch("https://backend-tpeu.onrender.com/api/usuario/perfil", {
          method: "GET",
          credentials: "include", // 👈 envía la cookie JWT
        });

        if (res.status === 401 || res.status === 403) {
          setMensaje("Sesión expirada o no autorizada. Redirigiendo al login...");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        if (!res.ok) throw new Error("Error al obtener datos del perfil");

        const data = await res.json();

        // 🔹 Llenar los campos del formulario con los datos del backend
        setNombre(data.nombre || "");
        setApellido(data.apellido || "");
        setEmail(data.email || "");
        setCedula(data.cedula || "");
        setDireccion(data.direccion || "");
        setCiudad(data.ciudad || "");

        // ❌ Eliminado: No se guarda nada en localStorage
      } catch (error) {
        console.error("❌ Error al cargar el perfil:", error);
        setMensaje("Error al cargar los datos del perfil ❌");
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [navigate]);

  // 🔹 Enviar datos actualizados al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje("");

    const datosActualizados = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
    };

    try {
      const res = await fetch("https://backend-tpeu.onrender.com/api/usuario/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 importante para enviar la cookie JWT
        body: JSON.stringify(datosActualizados),
      });

      if (res.status === 401 || res.status === 403) {
        setMensaje("Sesión expirada o no autorizada. Redirigiendo al login...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar perfil");
      }

      const data = await res.json();

      // ❌ Eliminado: no se actualiza localStorage
      setMensaje("✅ Perfil actualizado exitosamente");

      // ✅ Opcional: refrescar los campos con la nueva data
      setNombre(data.usuario.nombre || "");
      setApellido(data.usuario.apellido || "");
      setDireccion(data.usuario.direccion || "");
      setCiudad(data.usuario.ciudad || "");

    } catch (error) {
      console.error("❌ Error al actualizar:", error);
      setMensaje(`❌ ${error.message || "No se pudo actualizar el perfil"}`);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    navigate("/");
  };

  return (
    <>
      <header id="top-bar">
        <div id="logo-section">
          <img src={logo} alt="Dulce hogar logo" id="logo-img" />
          <div id="logo-text">
            <span id="logo-title">Dulce hogar</span>
            <span id="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div id="help-icon">?</div>
      </header>

      <main id="container">
        <div id="form-wrapper">
          <h1 id="form-title">Actualizar Perfil</h1>

          {mensaje && (
            <div
              className={`mensaje ${mensaje.includes("✅") ? "exito" : "error"}`}
            >
              {mensaje}
            </div>
          )}

          {cargando && <div className="cargando">Cargando datos del perfil...</div>}

          <form id="actualizar-form" onSubmit={handleSubmit}>
            <div className="campos-grid">
              {/* Campos EDITABLES */}
              <div className="form-group">
                <label htmlFor="nombre">Nombre: *</label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={cargando}
                  placeholder="Ingresa tu nombre"
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido">Apellido: *</label>
                <input
                  type="text"
                  id="apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  disabled={cargando}
                  placeholder="Ingresa tu apellido"
                />
              </div>

              <div className="form-group direccion-completa">
                <label htmlFor="direccion">Dirección:</label>
                <input
                  type="text"
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={cargando}
                  placeholder="Ingresa tu dirección completa"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ciudad">Ciudad:</label>
                <input
                  type="text"
                  id="ciudad"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  disabled={cargando}
                  placeholder="Ciudad de residencia"
                />
              </div>

              {/* Campos BLOQUEADOS */}
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  readOnly
                  className="campo-bloqueado"
                  placeholder={cargando ? "Cargando..." : "Email no disponible"}
                />
                <small className="texto-ayuda">
                  El email no se puede modificar
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="cedula">Cédula:</label>
                <input
                  type="text"
                  id="cedula"
                  value={cedula}
                  readOnly
                  className="campo-bloqueado"
                />
                <small className="texto-ayuda">
                  La cédula no se puede modificar
                </small>
              </div>
            </div>

            <div className="botones-accion">
              <button type="submit" id="btn-actualizar" disabled={cargando}>
                {cargando ? "Actualizando..." : "Actualizar Perfil"}
              </button>

              <button
                type="button"
                id="btn-cancelar"
                onClick={handleCancelar}
                disabled={cargando}
              >
                Cancelar
              </button>
            </div>

            <div className="info-ayuda">
              <small>* Campos obligatorios</small>
              <br />
              <small>Puedes editar tu nombre, apellido, dirección y ciudad</small>
            </div>
          </form>
        </div>
      </main>

      <footer id="footer">
        <div id="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div id="footer-copy">© 2025 FHO, todos los derechos reservados</div>
      </footer>
    </>
  );
}

export default ActualizarPerfil;
