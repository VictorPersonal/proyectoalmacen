import React from "react";
import "./TerminosYCondiciones.css"; // opcional si tienes estilos

const TerminosYCondiciones = () => {
  return (
    <div className="terminos-container">
      <h1>TÉRMINOS Y CONDICIONES DE USO</h1>

      <h2>1. Aceptación de los Términos</h2>
      <p>
        Al acceder y utilizar esta aplicación web, usted acepta cumplir con estos Términos
        y Condiciones. Si no está de acuerdo, debe abstenerse de utilizar la plataforma.
      </p>

      <h2>2. Descripción del Servicio</h2>
      <p>
        La aplicación permite visualizar, consultar disponibilidad y/o adquirir
        electrodomésticos y productos relacionados ofrecidos por <strong>[Nombre de la tienda]</strong>.
        Nos reservamos el derecho a modificar o descontinuar cualquier producto sin previo
        aviso.
      </p>

      <h2>3. Registro de Usuario</h2>
      <p>Para acceder a ciertas funciones puede ser necesario crear una cuenta. El usuario se compromete a:</p>
      <ul>
        <li>Proporcionar información veraz y actualizada.</li>
        <li>Mantener la confidencialidad de sus credenciales.</li>
        <li>Asumir la responsabilidad por las actividades realizadas con su cuenta.</li>
      </ul>

      <h2>4. Precios y Disponibilidad</h2>
      <p>
        Los precios mostrados pueden estar sujetos a cambios sin previo aviso. La disponibilidad
        de productos puede variar según inventario. En caso de falta de existencias, nos comunicaremos
        con el usuario para ofrecer alternativas o devolución del pago.
      </p>

      <h2>5. Pagos</h2>
      <p>
        Los pagos se realizarán a través de las plataformas autorizadas por <strong>[Nombre de la tienda]</strong>.
        La información de pago es procesada por terceros seguros; no almacenamos datos financieros del usuario.
      </p>

      <h2>6. Entregas y Envíos</h2>
      <p>
        Los tiempos de entrega son estimados y pueden variar por ubicación o condiciones externas.
        El usuario es responsable de proporcionar la dirección correcta.
      </p>

      <h2>7. Garantías y Devoluciones</h2>
      <p>
        Todos los productos cuentan con garantía legal según normatividad vigente.
        Para devoluciones o reclamos, el usuario deberá presentar factura y cumplir
        las condiciones de garantía del fabricante.
      </p>

      <h2>8. Propiedad Intelectual</h2>
      <p>
        Todo el contenido (imágenes, textos, marcas, diseños) pertenece a <strong>[Nombre de la tienda]</strong>
        o a sus proveedores y está protegido por leyes de derechos de autor. Su uso no autorizado está prohibido.
      </p>

      <h2>9. Protección de Datos Personales</h2>
      <p>
        La información personal recolectada será tratada conforme a la Política de Privacidad,
        cumpliendo la legislación vigente. El usuario puede solicitar la eliminación o actualización
        de sus datos cuando lo requiera.
      </p>

      <h2>10. Limitación de Responsabilidad</h2>
      <p>
        <strong>[Nombre de la tienda]</strong> no se hace responsable de daños derivados del uso indebido
        de la plataforma o del mal manejo de productos por parte del usuario.
      </p>

      <h2>11. Modificaciones de los Términos</h2>
      <p>
        Nos reservamos el derecho de actualizar o modificar estos Términos y Condiciones en cualquier momento.
        La fecha de última actualización será publicada en esta página.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Para consultas, reclamos o solicitudes relacionadas con la plataforma:<br/>
        Correo: <strong>[tu_correo@ejemplo.com]</strong><br/>
        Teléfono: <strong>[Número de contacto]</strong>
      </p>
    </div>
  );
};

export default TerminosYCondiciones;
