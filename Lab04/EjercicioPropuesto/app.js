// ===== 1. Estado global y persistencia =====
const STORAGE_KEY = 'tareas-universitarias';
let tareas = cargar();      // [{ id, titulo, curso, fechaEntrega, completada }]
let filtroActual = 'todas';

function cargar() {
  try {
    const datos = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(datos) ? datos : [];
  } catch (e) {
    return [];
  }
}

function guardar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}

// ===== Referencias al DOM =====
const form     = document.querySelector('#form-tarea');
const alertas  = document.querySelector('#alertas');
const lista    = document.querySelector('#lista');
const resumen  = document.querySelector('#resumen');
const filtros  = document.querySelector('#filtros');

// ===== 2. Captura y validación =====
function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function validar({ titulo, curso, fechaEntrega }) {
  const errores = [];
  if (!titulo) errores.push('El título es obligatorio.');
  if (!curso)  errores.push('El curso es obligatorio.');
  if (!fechaEntrega) {
    errores.push('La fecha de entrega es obligatoria.');
  } else if (fechaEntrega <= hoyISO()) {
    errores.push('La fecha de entrega debe ser posterior a la fecha actual.');
  }
  return errores;
}

function mostrarErrores(errores) {
  alertas.innerHTML = '';
  errores.forEach(msg => {
    const div = document.createElement('div');
    div.textContent = msg;
    alertas.appendChild(div);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const datos = {
    titulo: form.titulo.value.trim(),
    curso: form.curso.value.trim(),
    fechaEntrega: form.fecha.value
  };

  const errores = validar(datos);
  mostrarErrores(errores);
  if (errores.length) return;

  tareas = [...tareas, { id: Date.now(), ...datos, completada: false }];
  guardar();
  form.reset();
  render();
});

// ===== 3. Manipulación dinámica del DOM =====
function filtrar(arr) {
  if (filtroActual === 'pendientes')  return arr.filter(t => !t.completada);
  if (filtroActual === 'completadas') return arr.filter(t => t.completada);
  return arr;
}

function crearItem({ id, titulo, curso, fechaEntrega, completada }) {
  const li = document.createElement('li');
  li.className = 'tarea' + (completada ? ' completada' : '');
  li.dataset.id = id;

  const chk = document.createElement('input');
  chk.type = 'checkbox';
  chk.checked = completada;
  chk.dataset.accion = 'alternar';
  chk.setAttribute('aria-label', 'Marcar como completada');

  const info = document.createElement('div');
  info.className = 'info';

  const t = document.createElement('div');
  t.className = 'titulo';
  t.textContent = titulo;

  const m = document.createElement('div');
  m.className = 'meta';
  m.textContent = `${curso} · Entrega: ${fechaEntrega}`;

  info.append(t, m);

  const del = document.createElement('button');
  del.className = 'btn-del';
  del.dataset.accion = 'eliminar';
  del.textContent = 'Eliminar';

  li.append(chk, info, del);
  return li;
}

function render() {
  lista.innerHTML = '';
  const visibles = filtrar(tareas);

  if (visibles.length === 0) {
    const li = document.createElement('li');
    li.className = 'vacio';
    li.textContent = 'No hay tareas para mostrar.';
    lista.appendChild(li);
  } else {
    visibles.forEach(t => lista.appendChild(crearItem(t)));
  }

  const pendientes = tareas.reduce((acc, t) => acc + (t.completada ? 0 : 1), 0);
  resumen.textContent =
    `${tareas.length} en total · ${pendientes} pendientes · ${tareas.length - pendientes} completadas`;

  filtros.querySelectorAll('button').forEach(b =>
    b.classList.toggle('activo', b.dataset.filtro === filtroActual));
}

// Delegación de eventos: un solo listener para alternar y eliminar
lista.addEventListener('click', (e) => {
  const accion = e.target.dataset.accion;
  if (!accion) return;

  const id = Number(e.target.closest('li').dataset.id);

  if (accion === 'alternar') {
    tareas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t);
  } else if (accion === 'eliminar') {
    tareas = tareas.filter(t => t.id !== id);
  }

  guardar();
  render();
});

// Filtro visual (Todas / Pendientes / Completadas)
filtros.addEventListener('click', (e) => {
  const f = e.target.dataset.filtro;
  if (!f) return;
  filtroActual = f;
  render();
});

// ===== 4. Carga inicial desde localStorage =====
document.addEventListener('DOMContentLoaded', render);