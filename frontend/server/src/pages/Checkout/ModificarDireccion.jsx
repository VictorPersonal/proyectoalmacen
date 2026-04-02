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
  FaQuestionCircle,
  FaCrosshairs,
  FaMapPin
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

// Función para hacer peticiones a través de un proxy CORS
const fetchWithCorsProxy = async (url) => {
  // Usar un proxy público de CORS
  const proxyUrl = 'https://api.allorigins.win/get?url=';
  
  try {
    const response = await fetch(`${proxyUrl}${encodeURIComponent(url)}`);
    let data = await response.json();
    data = JSON.parse(data.contents);
    return data;
  } catch (error) {
    console.error('Error con proxy:', error);
    
    // Intentar con proxy alternativo
    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      return await response.json();
    } catch (error2) {
      console.error('Error con proxy alternativo:', error2);
      throw error2;
    }
  }
};

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
  const [precision, setPrecision] = useState(null);
  const navigate = useNavigate();
  const mapRef = useRef();

  // Cargar dirección actual al iniciar
  useEffect(() => {
    const cargarDireccionActual = async () => {
      try {
        const respuesta = await fetch("https://3e34-201-182-248-71.ngrok-free.app/api/usuario/perfil", {
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

  // Función mejorada para buscar dirección usando proxy CORS
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
      // Usar proxy CORS para evitar bloqueos
      let searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busqueda)}&limit=1&addressdetails=1`;
      
      let data = await fetchWithCorsProxy(searchUrl);
      
      // Si no encuentra resultados, intentar agregando "Colombia"
      if (!data || data.length === 0) {
        const searchUrlWithCountry = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(busqueda + ', Colombia')}&limit=1&addressdetails=1`;
        data = await fetchWithCorsProxy(searchUrlWithCountry);
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        const newCoords = [parseFloat(result.lat), parseFloat(result.lon)];
        
        setCoordenadas(newCoords);
        setMarkerPosition(newCoords);
        
        // Formatear dirección en formato colombiano
        const direccionFormateada = formatearDireccionColombiana(result.address, busqueda);
        const city = extraerCiudad(result.address, busqueda);
        
        console.log("Resultado encontrado:", result);
        console.log("Dirección formateada:", direccionFormateada);
        console.log("Ciudad:", city);
        
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
        title: 'Modo manual',
        text: 'Usando dirección ingresada. Por favor ajusta manualmente la ubicación en el mapa.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#1a73e8'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para geocodificación inversa usando proxy CORS
  const reverseGeocode = async (lat, lng) => {
    try {
      const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
      
      const data = await fetchWithCorsProxy(reverseUrl);
      
      if (data && data.address) {
        const direccionFormateada = formatearDireccionColombiana(data.address, busqueda);
        const city = extraerCiudad(data.address, busqueda);
        
        console.log("Reverse geocode result:", data);
        
        if (direccionFormateada) {
          setDireccion(direccionFormateada);
        }
        
        if (city) {
          setCiudad(city);
        }
      }
    } catch (error) {
      console.error("Error en geocodificación inversa:", error);
      // No mostrar error al usuario para no interrumpir
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

  // Función MEJORADA para usar mi ubicación actual
  const usarMiUbicacion = () => {
    console.log("Botón 'Usar mi ubicación' clickeado");
    
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'Geolocalización no soportada',
        text: 'Tu navegador no soporta la geolocalización. Actualiza tu navegador o usa Chrome/Firefox/Edge.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    setLoading(true);
    
    // Mostrar mensaje de solicitud de permisos
    Swal.fire({
      title: 'Obteniendo ubicación precisa',
      text: 'Estamos buscando tu ubicación exacta. Por favor espera...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Opciones mejoradas para mayor precisión
    const options = {
      enableHighAccuracy: true, // Forzar alta precisión
      timeout: 30000, // 30 segundos para dar tiempo a obtener señal GPS
      maximumAge: 0 // No usar datos cacheados
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = [
          position.coords.latitude,
          position.coords.longitude
        ];

        // Calcular precisión estimada (en metros)
        const accuracy = position.coords.accuracy; // En metros
        console.log("Ubicación obtenida:", userCoords);
        console.log("Precisión:", accuracy, "metros");
        
        // Convertir precisión a mensaje entendible
        let precisionMsg = "";
        if (accuracy < 10) {
          precisionMsg = "Precisión excelente (menos de 10 metros)";
          setPrecision("excelente");
        } else if (accuracy < 50) {
          precisionMsg = "Precisión buena (menos de 50 metros)";
          setPrecision("buena");
        } else if (accuracy < 100) {
          precisionMsg = "Precisión moderada (menos de 100 metros)";
          setPrecision("moderada");
        } else {
          precisionMsg = `Precisión baja (aproximadamente ${Math.round(accuracy)} metros)`;
          setPrecision("baja");
        }

        setCoordenadas(userCoords);
        setMarkerPosition(userCoords);
        
        // Calcular zoom apropiado basado en la precisión
        let zoomLevel = 18; // Zoom por defecto muy cercano
        if (accuracy > 100) zoomLevel = 16;
        if (accuracy > 500) zoomLevel = 15;
        if (accuracy > 1000) zoomLevel = 14;
        
        // Actualizar el mapa con el nuevo zoom
        if (mapRef.current) {
          mapRef.current.setView(userCoords, zoomLevel);
        }

        // Hacer reverse geocode
        reverseGeocode(userCoords[0], userCoords[1]);
        
        setLoading(false);

        Swal.fire({
          icon: 'success',
          title: 'Ubicación detectada',
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p><strong>Coordenadas:</strong><br>
              Latitud: ${userCoords[0].toFixed(6)}<br>
              Longitud: ${userCoords[1].toFixed(6)}</p>
              <p><strong>${precisionMsg}</strong></p>
              <p><em>Si la ubicación no es exacta, puedes ajustar el marcador arrastrándolo.</em></p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#28a745',
          width: '500px'
        });
      },
      (error) => {
        setLoading(false);
        console.error("Error de geolocalización:", error);
        
        let errorMessage = "Error al obtener la ubicación";
        let icon = 'error';
        let title = 'Error de ubicación';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = `
              <div style="text-align: left; font-size: 14px;">
                <p><strong>Permiso de ubicación denegado</strong></p>
                <p>Para habilitar la ubicación:</p>
                <ol>
                  <li>Haz clic en el ícono de candado (🔒) en la barra de direcciones</li>
                  <li>Busca "Ubicación" o "Permisos de ubicación"</li>
                  <li>Cambia a "Permitir"</li>
                  <li>Recarga la página</li>
                </ol>
                <p><em>También puedes usar el buscador de direcciones manualmente.</em></p>
              </div>
            `;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Información de ubicación no disponible. Verifica que tu dispositivo tenga GPS activado y estés en un área con buena señal.";
            break;
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado. El GPS está tardando mucho en obtener una señal precisa. Intenta en un área abierta o usa el buscador de direcciones.";
            icon = 'warning';
            title = 'Tiempo agotado';
            break;
          default:
            errorMessage = "Error desconocido al obtener la ubicación. Intenta nuevamente o usa el buscador manual.";
        }

        Swal.fire({
          icon: icon,
          title: title,
          html: `<div style="white-space: pre-line;">${errorMessage}</div>`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545',
          width: '500px'
        });
      },
      options
    );
  };

  // Función alternativa: Usar ubicación aproximada basada en IP
  const usarUbicacionAproximada = async () => {
    setLoading(true);
    
    try {
      // Usar un servicio para obtener ubicación aproximada por IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const approxCoords = [data.latitude, data.longitude];
        
        setCoordenadas(approxCoords);
        setMarkerPosition(approxCoords);
        setPrecision("aproximada");
        
        Swal.fire({
          icon: 'info',
          title: 'Ubicación aproximada',
          html: `
            <div style="text-align: left; font-size: 14px;">
              <p>Ubicación aproximada basada en tu conexión a internet.</p>
              <p><strong>Ciudad detectada:</strong> ${data.city || 'Desconocida'}</p>
              <p><em>Esta ubicación puede no ser exacta. Ajusta el marcador manualmente si es necesario.</em></p>
            </div>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#1a73e8'
        });
        
        reverseGeocode(approxCoords[0], approxCoords[1]);
      }
    } catch (error) {
      console.error("Error al obtener ubicación aproximada:", error);
      Swal.fire({
        icon: 'error',
        title: 'No se pudo obtener ubicación',
        text: 'Intenta usar el buscador de direcciones manualmente.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para ajustar manualmente la ubicación
  const ajustarUbicacionManual = () => {
    Swal.fire({
      title: 'Ajustar ubicación manualmente',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Instrucciones:</strong></p>
          <ol>
            <li>Haz clic en cualquier parte del mapa para colocar el marcador</li>
            <li>O arrastra el marcador existente a la posición correcta</li>
            <li>La dirección se actualizará automáticamente</li>
          </ol>
          <p><em>También puedes usar el buscador de direcciones arriba.</em></p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#1a73e8'
    });
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
      const perfilResponse = await fetch("https://3e34-201-182-248-71.ngrok-free.app/api/usuario/perfil", {
        credentials: "include"
      });

      if (!perfilResponse.ok) {
        throw new Error("Error al obtener perfil actual");
      }

      const perfilActual = await perfilResponse.json();

      const respuesta = await fetch("https://3e34-201-182-248-71.ngrok-free.app/api/usuario/perfil", {
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
            
            {/* Botones de ubicación */}
            <div className="direccion-botones-ubicacion">
              <button 
                onClick={usarMiUbicacion}
                className={`direccion-btn-ubicacion-precisa ${loading ? 'loading' : ''}`}
                disabled={loading}
                title="Usar GPS para ubicación precisa"
              >
                <FaCrosshairs className="direccion-ubicacion-icon" />
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Detectando...
                  </>
                ) : (
                  "Ubicación precisa (GPS)"
                )}
              </button>
              
              <button 
                onClick={ajustarUbicacionManual}
                className="direccion-btn-ajustar-manual"
                title="Ajustar ubicación manualmente en el mapa"
              >
                <FaMapPin className="direccion-ajustar-icon" />
                Ajustar manualmente
              </button>
            </div>
            
            {precision && (
              <div className={`direccion-precision-indicador precision-${precision}`}>
                <FaExclamationCircle />
                {precision === 'excelente' && 'Ubicación muy precisa'}
                {precision === 'buena' && 'Ubicación precisa'}
                {precision === 'moderada' && 'Ubicación aproximada'}
                {precision === 'baja' && 'Ubicación de baja precisión'}
                {precision === 'aproximada' && 'Ubicación aproximada por IP'}
              </div>
            )}
          </div>

          {/* Mapa de OpenStreetMap */}
          <div className="direccion-mapa-container">
            <MapContainer
              center={coordenadas}
              zoom={16}
              style={{ height: '450px', width: '100%' }}
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
                    setPrecision("manual");
                  }
                }}
              >
                <Popup>
                  {direccion || "Selecciona una ubicación"}
                  <br />
                  <small>Arrastra para ajustar la posición</small>
                </Popup>
              </Marker>
            </MapContainer>
            <div className="direccion-mapa-leyenda">
              <FaMapMarkerAlt className="direccion-leyenda-icon" />
              {direccion 
                ? `Ubicación: ${direccion}${ciudad ? `, ${ciudad}` : ''}` 
                : "Busca una dirección o haz clic en el mapa para seleccionar tu ubicación"}
            </div>
            <div className="direccion-mapa-instrucciones">
              <FaExclamationCircle /> Haz clic en el mapa o arrastra el marcador para ajustar la ubicación exacta
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
                <strong>Para mejor precisión:</strong>
              </p>
              <ul>
                <li><strong>En exteriores:</strong> El GPS funciona mejor al aire libre</li>
                <li><strong>Espera unos segundos:</strong> Dale tiempo al GPS para obtener señal precisa</li>
                <li><strong>WiFi activado:</strong> Ayuda a triangular la posición</li>
                <li><strong>Si no es exacto:</strong> Arrastra el marcador a la posición correcta</li>
                <li><strong>Si el GPS no funciona:</strong> Puedes escribir tu dirección manualmente en los campos de arriba</li>
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