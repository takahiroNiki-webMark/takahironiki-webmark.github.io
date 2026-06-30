// ui.js
import { state } from "https://takahironiki-webmark.github.io/pkandb/js/state.js";

export const dom = {};

export function initDom() {
  dom.projectListEl = document.getElementById("project-list");
  dom.noProjectSelectedEl = document.getElementById("no-project-selected");
  dom.projectDetailEl = document.getElementById("project-detail");

  dom.detailProjectNameEl = document.getElementById("detail-project-name");
  dom.detailProjectMemoEl = document.getElementById("detail-project-memo");
  dom.taskListEl = document.getElementById("task-list");
  dom.detailGnoteUrlEl = document.getElementById("detail-gnote-url");
  dom.detailGdriveUrlEl = document.getElementById("detail-gdrive-url");
}

export function renderProjectList(onMove, onSelect, onDelete) {
  dom.projectListEl.innerHTML = "";

  state.projects.forEach((project, index) => {
    const row = document.createElement("div");
    row.className = "project-item";

    row.innerHTML = `
      <span class="index">${index + 1}</span>
      <button class="small" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="small" ${index === state.projects.length - 1 ? "disabled" : ""}>↓</button>
      <button class="small danger">✕ 削除</button>
      <button class="small">詳細へ ⇒</button>
      <span>${project.name}</span>
    `;

    const [upBtn, downBtn, delBtn, detailBtn] = row.querySelectorAll("button");

    upBtn.onclick = () => onMove(index, index - 1);
    downBtn.onclick = () => onMove(index, index + 1);
    delBtn.onclick = () => onDelete(project.id);
    detailBtn.onclick = () => onSelect(project.id);

    dom.projectListEl.appendChild(row);
  });
}

export function renderDetail(onMoveTask, onEditTask, onDeleteTask) {
  const project = state.projects.find(p => p.id === state.selectedProjectId);

  if (!project) {
    dom.noProjectSelectedEl.style.display = "block";
    dom.projectDetailEl.style.display = "none";
    return;
  }

  dom.noProjectSelectedEl.style.display = "none";
  dom.projectDetailEl.style.display = "block";

  dom.detailProjectNameEl.textContent = project.name;
  dom.detailProjectMemoEl.value = project.memo || "";

  // NotebookLM
  if (project.gnoteUrl) {
    dom.detailGnoteUrlEl.textContent = project.gnoteUrl;
    dom.detailGnoteUrlEl.href = project.gnoteUrl;
    dom.detailGnoteUrlEl.classList.remove("muted");
  } else {
    dom.detailGnoteUrlEl.textContent = "(未設定)";
    dom.detailGnoteUrlEl.href = "#";
    dom.detailGnoteUrlEl.classList.add("muted");
  }

  // GoogleDrive
  if (project.gdriveUrl) {
    dom.detailGdriveUrlEl.textContent = project.gdriveUrl;
    dom.detailGdriveUrlEl.href = project.gdriveUrl;
    dom.detailGdriveUrlEl.classList.remove("muted");
  } else {
    dom.detailGdriveUrlEl.textContent = "(未設定)";
    dom.detailGdriveUrlEl.href = "#";
    dom.detailGdriveUrlEl.classList.add("muted");
  }

  renderTaskList(project, onMoveTask, onEditTask, onDeleteTask);
}

export function renderTaskList(project, onMoveTask, onEditTask, onDeleteTask) {
  dom.taskListEl.innerHTML = "";

  if (project.tasks.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9" style="text-align:center; padding:12px; color:#9bbce3;">現在、課題はありません</td>`;
    dom.taskListEl.appendChild(tr);
    return;
  }

  project.tasks.forEach((task, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <button class="small" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="small" ${index === project.tasks.length - 1 ? "disabled" : ""}>↓</button>
      </td>
      <td>${task.due || ""}</td>
      <td>${task.title || ""}</td>
      <td>${task.detail || ""}</td>
      <td>${task.status || ""}</td>
      <td>${task.assignee || ""}</td>
      <td>${task.creator || ""}</td>
      <td class="task-actions">
        <button class="small">⇐ 編集</button>
        <button class="small danger">✕ 削除</button>
      </td>
    `;

    const [upBtn, downBtn] = tr.querySelectorAll("button");
    const editBtn = tr.querySelectorAll("button")[2];
    const delBtn = tr.querySelectorAll("button")[3];

    upBtn.onclick = () => onMoveTask(project.id, index, index - 1);
    downBtn.onclick = () => onMoveTask(project.id, index, index + 1);
    editBtn.onclick = () => onEditTask(project.id, task.id);
    delBtn.onclick = () => onDeleteTask(project.id, task.id);

    dom.taskListEl.appendChild(tr);
  });
}