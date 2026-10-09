// app.js - Módulo de Gestión
const form  = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list  = document.querySelector('#todo-list');

// Lectura segura: si el JSON está corrupto o no existe, se parte de []
let tasks = [];
try {
  tasks = JSON.parse(localStorage.getItem('tasks')) || [];
} catch (e) {
  tasks = [];
}

function save() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  list.innerHTML = '';

  if (tasks.length === 0) {
    list.innerHTML = '<li class="vacio">No hay tareas registradas.</li>';
    return;
  }

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    const span = document.createElement('span');
    span.textContent = task.text; // textContent evita inyección de HTML (XSS)

    const btn = document.createElement('button');
    btn.className = 'btn btn-danger btn-sm';
    btn.textContent = 'Eliminar';
    btn.addEventListener('click', () => deleteTask(index));

    li.append(span, btn);
    list.appendChild(li);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ text, completed: false });
  save();
  input.value = '';
  renderTasks();
});

function deleteTask(index) {
  tasks.splice(index, 1);
  save();
  renderTasks();
}

document.addEventListener('DOMContentLoaded', renderTasks);