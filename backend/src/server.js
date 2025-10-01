const express = require('express');
const cors = require('cors');
const { query, testConnection } = require('./config/db');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API funcionando correctamente',
    endpoints: {
      '/productos': 'GET - Obtener todos los productos',
      '/productos/:id': 'GET - Obtener un producto específico',
      '/usuarios': 'GET - Obtener todos los usuarios'
    }
  });
});

// Ruta para obtener todos los productos
app.get('/productos', async (req, res) => {
  try {
    const result = await query('SELECT * FROM productos ORDER BY id');
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para obtener un producto específico
app.get('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM productos WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const result = await query('SELECT id, nombre, email FROM usuarios ORDER BY id');
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   - http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/productos`);
  console.log(`   - http://localhost:${PORT}/usuarios`);
  
  // Verificar conexión a la base de datos
  await testConnection();
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n⏹️  Cerrando servidor...');
  process.exit(0);
});