import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import "./ModificarDireccion.css";
import { useNavigate, Link } from "react-router-dom";
import Swal from 'sweetalert2';
import logo from "../../assets/Logo dulce hogar.png";
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaHome, 
  FaCity, 
  FaExclamationCircle,
  FaLightbulb,
  FaTimes,
  FaCheck,
  FaQuestionCircle
} from 'react-icons/fa';

// Fix para los iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para actualizar el centro del mapa
function UpdateMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// Función mejorada para formatear la dirección en formato colombiano
const formatearDireccionColombiana = (address, busquedaOriginal = "") => {
  if (!address) return busquedaOriginal;

  // Extraer componentes importantes
  const { road, house_number, neighbourhood, suburb, city, town, village, municipality, county } = address;
  
  let direccionFormateada = "";
  
  // Construir dirección en formato colombiano: Calle/Carrera # Número - Barrio
  if (road) {
    // Detectar si es calle, carrera, avenida, etc.
    let tipoVia = road;
    if (road.includes('Calle')) {
      tipoVia = 'Calle';
    } else if (road.includes('Carrera')) {
      tipoVia = 'Carrera';
    } else if (road.includes('Avenida') || road.includes('Av.')) {
      tipoVia = 'Avenida';
    } else if (road.includes('Transversal')) {
      tipoVia = 'Transversal';
    } else if (road.includes('Diagonal')) {
      tipoVia = 'Diagonal';
    }
    
    // Extraer números de la calle (ej: "Calle 10" -> "10")
    const numerosVia = road.match(/\d+/g);
    const numeroVia = numerosVia ? numerosVia[0] : '';
    
    direccionFormateada = tipoVia + (numeroVia ? ` ${numeroVia}` : '');
    
    // Agregar número de casa si existe
    if (house_number) {
      direccionFormateada += ` # ${house_number}`;
    } else if (numerosVia && numerosVia.length > 1) {
      // Si hay múltiples números, usar el segundo como número de casa
      direccionFormateada += ` # ${numerosVia[1]}`;
    }
    
    // Agregar barrio si existe (preferir neighbourhood, luego suburb)
    const barrio = neighbourhood || suburb;
    if (barrio && !barrio.includes('Urbanización') && !barrio.includes('Sector')) {
      direccionFormateada += ` - ${barrio}`;
    }
  }
  
  // Si no se pudo construir una dirección formateada, usar la búsqueda original
  if (!direccionFormateada && busquedaOriginal) {
    // Limpiar la búsqueda original - quitar la ciudad si está incluida
    let direccionLimpia = busquedaOriginal
      .replace(/,\s*Colombia$/i, '')
      .replace(/,\s*[A-Za-záéíóúñ\s]+$/i, '') // Quitar la última coma y lo que sigue (ciudad)
      .trim();
    
    return direccionLimpia;
  }
  
  return direccionFormateada || busquedaOriginal;
};

// Función mejorada para extraer ciudad
const extraerCiudad = (address, busquedaOriginal = "") => {
  // Prioridad: city > town > village > municipality > county
  const ciudad = address.city || address.town || address.village || address.municipality || address.county || "";
  
  if (ciudad) return ciudad;
  
  // Si no se encuentra en address, intentar extraer de la búsqueda original
  if (busquedaOriginal) {
    const partes = busquedaOriginal.split(',');
    if (partes.length > 1) {
      // Tomar la última parte como ciudad
      return partes[partes.length - 1].trim();
    }
  }
  
  return "";
};

const ModificarDireccion = () => {
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [coordenadas, setCoordenadas] = useState([4.6097, -74.0817]); // Bogotá por defecto
  const [loading, setLoading] = useState(false);
  const [markerPosition, setMarkerPosition] = useState([4.6097, -74.0817]);
  const navigate = useNavigate();
  const mapRef = useRef();

  // Cargar dirección actual al iniciar
  useEffect(() => {
    const cargarDireccionActual = async () => {
      try {
        const respuesta = await fetch("http://localhost:4000/api/usuario/perfil", {
          credentials: "include"
        });
        
        if (respuesta.ok) {
          const datos = await respuesta.json();
          setDireccion(datos.direccion || "");
          setCiudad(datos.ciudad || "");
        }
      } catch (error) {
        console.error("Error al cargar dirección actual:", error);
      }
    };

    cargarDireccionActual();
  }, []);

  // Función mejorada para buscar dirección
  const buscarDireccion = async () => {
    if (!busqueda.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor, ingresa una dirección para buscar',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1a73e8'
      });
      return;
    }

    setLoading(true);
    try {
      // Primero intentar una búsqueda más específica
      let response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busqueda)}&limit=1&addressdetails=1`
      );
      
      let data = await response.json();
      
      // Si no encuentra resultados, intentar agregando "Colombia"
      if (!data || data.length === 0) {
        response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busqueda + ', Colombia')}&limit=1&addressdetails=1`
        );
        data = await response.json();
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        const newCoords = [parseFloat(result.lat), parseFloat(result.lon)];
        
        setCoordenadas(newCoords);
        setMarkerPosition(newCoords);
        
        // Formatear dirección en formato colombiano
        const direccionFormateada = formatearDireccionColombiana(result.address, busqueda);
        const city = extraerCiudad(result.address, busqueda);
        
        console.log("Resultado raw:", result);
        console.log("Address components:", result.address);
        console.log("Dirección formateada:", direccionFormateada);
        
        setDireccion(direccionFormateada);
        setCiudad(city);

        Swal.fire({
          icon: 'success',
          title: 'Dirección encontrada',
          text: 'La dirección se ha localizado en el mapa',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#28a745'
        });
        
      } else {
        // Si no encuentra en OpenStreetMap, usar la búsqueda del usuario directamente
        setDireccion(busqueda);
        // Intentar extraer ciudad de la búsqueda
        const partes = busqueda.split(',');
        if (partes.length > 1) {
          setCiudad(partes[partes.length - 1].trim());
        }

        Swal.fire({
          icon: 'info',
          title: 'Dirección guardada',
          text: 'Por favor verifica que la ubicación en el mapa sea correcta',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1a73e8'
        });
      }
    } catch (error) {
      console.error("Error al buscar dirección:", error);
      // En caso de error, usar la búsqueda del usuario
      setDireccion(busqueda);
      
      Swal.fire({
        icon: 'warning',
        title: 'Búsqueda manual',
        text: 'Dirección guardada. Por favor verifica la ubicación en el mapa.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1a73e8'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para geocodificación inversa
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const direccionFormateada = formatearDireccionColombiana(data.address, busqueda);
        const city = extraerCiudad(data.address, busqueda);
        
        if (direccionFormateada) {
          setDireccion(direccionFormateada);
        }
        
        if (city) {
          setCiudad(city);
        }
      }
    } catch (error) {
      console.error("Error en geocodificación inversa:", error);
    }
  };

  // Función para manejar el clic en el mapa
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    const newPosition = [lat, lng];
    
    setMarkerPosition(newPosition);
    setCoordenadas(newPosition);
    reverseGeocode(lat, lng);
  };

  // Función para usar mi ubicación actual
  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'Geolocalización no soportada',
        text: 'Tu navegador no soporta la geolocalización',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = [
          position.coords.latitude,
          position.coords.longitude
        ];

        setCoordenadas(userCoords);
        setMarkerPosition(userCoords);
        reverseGeocode(userCoords[0], userCoords[1]);
        setLoading(false);

        Swal.fire({
          icon: 'success',
          title: 'Ubicación detectada',
          text: 'Tu ubicación actual se ha establecido en el mapa',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#28a745'
        });
      },
      (error) => {
        setLoading(false);
        let errorMessage = "Error al obtener la ubicación";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado. Por favor habilita la ubicación en tu navegador.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado para obtener la ubicación.";
            break;
          default:
            errorMessage = "Error desconocido al obtener la ubicación.";
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de ubicación',
          text: errorMessage,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Función para confirmar y guardar la dirección
  const confirmarDireccion = async () => {
    if (!direccion.trim() || !ciudad.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Por favor, completa la dirección y ciudad',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1a73e8'
      });
      return;
    }

    try {
      const perfilResponse = await fetch("http://localhost:4000/api/usuario/perfil", {
        credentials: "include"
      });

      if (!perfilResponse.ok) {
        throw new Error("Error al obtener perfil actual");
      }

      const perfilActual = await perfilResponse.json();

      const respuesta = await fetch("http://localhost:4000/api/usuario/perfil", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direccion: direccion,
          ciudad: ciudad,
          nombre: perfilActual.nombre,
          apellido: perfilActual.apellido
        }),
      });

      if (respuesta.ok) {
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Dirección actualizada correctamente',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#28a745'
        });
        navigate(-1);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar la dirección',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
        });
      }
    } catch (error) {
      console.error("Error al guardar dirección:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error del servidor',
        text: 'Error al guardar la dirección. Intenta nuevamente.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Función para manejar cancelar
  const handleCancelar = () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Seguir editando'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(-1);
      }
    });
  };

  return (
    <div className="direccion-page-wrapper">
      {/* Header */}
      <header className="direccion-top-bar">
        <div className="direccion-logo-section">
          <img src={logo} alt="Dulce hogar logo" className="direccion-logo-img" />
          <div className="direccion-logo-text">
            <span className="direccion-logo-title">Dulce hogar</span>
            <span className="direccion-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="direccion-help-icon">
          <FaQuestionCircle />
        </div>
      </header>

      <div className="direccion-container">
        <div className="direccion-content">
          <h2 className="direccion-titulo">Modificar Dirección de Entrega</h2>
          
          {/* Buscador de Dirección */}
          <div className="direccion-buscador">
            <div className="direccion-buscador-input-group">
              <input
                type="text"
                placeholder="Ej: Calle 10 # 9-05, Caicedonia, Valle del Cauca"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarDireccion()}
                className="direccion-buscador-input"
              />
              <button 
                onClick={buscarDireccion} 
                disabled={loading}
                className="direccion-buscador-btn"
              >
                <FaSearch className="direccion-buscador-icon" />
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </div>
            <button 
              onClick={usarMiUbicacion}
              className="direccion-btn-ubicacion-actual"
            >
              <FaMapMarkerAlt className="direccion-ubicacion-icon" />
              Usar mi ubicación actual
            </button>
          </div>

          {/* Mapa de OpenStreetMap */}
          <div className="direccion-mapa-container">
            <MapContainer
              center={coordenadas}
              zoom={13}
              style={{ height: '400px', width: '100%' }}
              ref={mapRef}
              onClick={handleMapClick}
            >
              <UpdateMapCenter center={coordenadas} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker 
                position={markerPosition}
                draggable={true}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    const newPosition = [position.lat, position.lng];
                    setMarkerPosition(newPosition);
                    setCoordenadas(newPosition);
                    reverseGeocode(position.lat, position.lng);
                  }
                }}
              >
                <Popup>
                  {direccion || "Selecciona una ubicación"}
                </Popup>
              </Marker>
            </MapContainer>
            <div className="direccion-mapa-leyenda">
              <FaMapMarkerAlt className="direccion-leyenda-icon" />
              {direccion 
                ? `Ubicación: ${direccion}${ciudad ? `, ${ciudad}` : ''}` 
                : "Busca una dirección o haz clic en el mapa para seleccionar tu ubicación"}
            </div>
          </div>

          {/* Formulario de Dirección */}
          <div className="direccion-formulario">
            <h3>Confirmar Dirección</h3>
            
            <div className="direccion-campo-formulario">
              <label>
                <FaHome className="direccion-campo-icon" />
                Dirección Completa *
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej: Calle 10 # 9-05, Barrio Las Américas"
                className="direccion-input"
              />
              <small className="direccion-texto-ayuda">
                <FaExclamationCircle className="direccion-ayuda-icon" />
                Puedes editar manualmente si la dirección no se detectó correctamente
              </small>
            </div>

            <div className="direccion-campo-formulario">
              <label>
                <FaCity className="direccion-campo-icon" />
                Ciudad *
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Caicedonia, Valle del Cauca"
                className="direccion-input"
              />
            </div>

            <div className="direccion-instrucciones">
              <p>
                <FaLightbulb className="direccion-instrucciones-icon" />
                <strong>Consejo:</strong>
              </p>
              <ul>
                <li>Si la dirección no se detecta automáticamente, puedes <strong>editarla manualmente</strong> en los campos de arriba</li>
                <li>Asegúrate de que el <strong>marcador en el mapa</strong> esté en la ubicación correcta</li>
                <li>Puedes <strong>arrastrar el marcador</strong> para ajustar la posición exacta</li>
              </ul>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="direccion-botones-accion">
            <button 
              onClick={handleCancelar}
              className="direccion-btn-cancelar"
            >
              <FaTimes className="direccion-btn-icon" />
              Cancelar
            </button>
            <button 
              onClick={confirmarDireccion}
              disabled={!direccion.trim() || !ciudad.trim()}
              className="direccion-btn-confirmar"
            >
              <FaCheck className="direccion-btn-icon" />
              Confirmar Dirección
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="direccion-footer">
        <div className="direccion-footer-links">
          <Link to="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <span>/</span>
          <Link to="/consejo-de-seguridad">Consejo de Seguridad</Link>
          <span>/</span>
          <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
        </div>
        <div className="direccion-footer-copyright">
          © 2025 FDO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default ModificarDireccion;