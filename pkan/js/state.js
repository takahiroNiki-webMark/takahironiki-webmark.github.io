// state.js
export const state = {
  projects: [],
  selectedProjectId: null
};

export async function loadData() {
  const res = await fetch("https://takahironiki-webmark.github.io/pkan/data/sample-data.json");
  const data = await res.json();
  state.projects = data.projects;
  state.selectedProjectId = data.selectedProjectId;
}

/* プロジェクト操作 */
export function moveProject(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= state.projects.length) return;
  const [p] = state.projects.splice(fromIndex, 1);
  state.projects.splice(toIndex, 0, p);
}

export function selectProject(id) {
  state.selectedProjectId = id;
}

export function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.selectedProjectId === id) state.selectedProjectId = null;
}

/* タスク操作 */
export function moveTask(projectId, fromIndex, toIndex) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  if (toIndex < 0 || toIndex >= project.tasks.length) return;

  const [t] = project.tasks.splice(fromIndex, 1);
  project.tasks.splice(toIndex, 0, t);
}

export function updateTask(projectId, taskId, newValues) {
  const project = state.projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);
  Object.assign(task, newValues);
}

export function deleteTask(projectId, taskId) {
  const project = state.projects.find(p => p.id === projectId);
  project.tasks = project.tasks.filter(t => t.id !== taskId);
}

export function createProject(name, gnoteUrl, gdriveUrl) {
  const newId = state.projects.length
    ? Math.max(...state.projects.map(p => p.id)) + 1
    : 1;

  state.projects.push({
    id: newId,
    name,
    gnoteUrl,
    gdriveUrl,
    memo: "",
    tasks: []
  });
}

export function createTask(projectId, taskData) {
  const project = state.projects.find(p => p.id === projectId);
  const newId = project.tasks.length
    ? Math.max(...project.tasks.map(t => t.id)) + 1
    : 1;

  project.tasks.push({ id: newId, ...taskData });
}
