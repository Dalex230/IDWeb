
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const publicDir = path.join(__dirname, 'public');
const dataFile = path.join(__dirname, 'data', 'estudiantes.json');

// Tipos de contenido para los archivos estáticos
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

// Enviar una respuesta JSON
function responderJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8'
  });

  res.end(JSON.stringify(data));
}

// Crear el servidor
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // GET /api/estudiantes
  if (req.url === '/api/estudiantes' && req.method === 'GET') {
    fs.readFile(dataFile, 'utf8', (err, contenido) => {
      if (err) {
        return responderJSON(res, 500, {
          message: 'Error al leer los estudiantes'
        });
      }

      try {
        const estudiantes = JSON.parse(contenido);
        responderJSON(res, 200, estudiantes);
      } catch (error) {
        responderJSON(res, 500, {
          message: 'El archivo JSON no tiene un formato válido'
        });
      }
    });

    return;
  }

  // POST /api/estudiantes
  if (req.url === '/api/estudiantes' && req.method === 'POST') {
    let body = '';

    // Recibir los fragmentos del cuerpo de la petición
    req.on('data', (chunk) => {
      body += chunk;
    });

    // Procesar los datos cuando termina la recepción
    req.on('end', () => {
      let nuevoEstudiante;

      try {
        nuevoEstudiante = JSON.parse(body);
      } catch (error) {
        return responderJSON(res, 400, {
          message: 'El cuerpo de la petición no es JSON válido'
        });
      }

      // Validar los campos obligatorios
      if (
        !nuevoEstudiante ||
        typeof nuevoEstudiante !== 'object' ||
        Array.isArray(nuevoEstudiante) ||
        typeof nuevoEstudiante.nombre !== 'string' ||
        nuevoEstudiante.nombre.trim() === '' ||
        typeof nuevoEstudiante.carrera !== 'string' ||
        nuevoEstudiante.carrera.trim() === '' ||
        !Number.isInteger(nuevoEstudiante.edad) ||
        nuevoEstudiante.edad <= 0
      ) {
        return responderJSON(res, 400, {
          message: 'Envía nombre, carrera y edad válida'
        });
      }

      // Leer la lista actual
      fs.readFile(dataFile, 'utf8', (err, contenido) => {
        if (err) {
          return responderJSON(res, 500, {
            message: 'Error al leer el archivo de estudiantes'
          });
        }

        let estudiantes;

        try {
          estudiantes = JSON.parse(contenido);

          if (!Array.isArray(estudiantes)) {
            throw new Error('El contenido no es una lista');
          }
        } catch (error) {
          return responderJSON(res, 500, {
            message: 'El archivo de estudiantes no es válido'
          });
        }

        // Generar un identificador y agregar el registro
        const siguienteId = estudiantes.reduce(
          (maxId, estudiante) => Math.max(maxId, estudiante.id || 0),
          0
        ) + 1;

        const estudianteGuardado = {
          id: siguienteId,
          nombre: nuevoEstudiante.nombre.trim(),
          carrera: nuevoEstudiante.carrera.trim(),
          edad: nuevoEstudiante.edad
        };

        estudiantes.push(estudianteGuardado);

        // Guardar la lista actualizada
        fs.writeFile(
          dataFile,
          JSON.stringify(estudiantes, null, 2),
          'utf8',
          (errorEscritura) => {
            if (errorEscritura) {
              return responderJSON(res, 500, {
                message: 'Error al guardar el estudiante'
              });
            }

            responderJSON(res, 201, estudianteGuardado);
          }
        );
      });
    });

    return;
  }

  // GET / y otros archivos estáticos de public
  if (req.method === 'GET') {
    let rutaSolicitada;

    try {
      rutaSolicitada = decodeURIComponent(
        new URL(req.url, 'http://localhost').pathname
      );
    } catch (error) {
      return responderJSON(res, 400, {
        message: 'Ruta inválida'
      });
    }

    const archivo = rutaSolicitada === '/'
      ? 'index.html'
      : rutaSolicitada.slice(1);

    const filePath = path.resolve(publicDir, archivo);
    const rutaRelativa = path.relative(publicDir, filePath);

    // Impedir el acceso a archivos fuera de public
    if (
      rutaRelativa === '..' ||
      rutaRelativa.startsWith('..' + path.sep) ||
      path.isAbsolute(rutaRelativa)
    ) {
      return responderJSON(res, 403, {
        message: 'Acceso denegado'
      });
    }

    fs.readFile(filePath, (err, contenido) => {
      if (err) {
        return responderJSON(res, 404, {
          message: 'Recurso no encontrado'
        });
      }

      const extension = path.extname(filePath).toLowerCase();
      const contentType = contentTypes[extension] ||
        'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType
      });

      res.end(contenido);
    });

    return;
  }

  // Método HTTP no admitido para las demás rutas
  responderJSON(res, 404, {
    message: 'Recurso no encontrado'
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
