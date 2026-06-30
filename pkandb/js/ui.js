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
      <button class="small btn-up" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="small btn-down" ${index === state.projects.length - 1 ? "disabled" : ""}>↓</button>
      <button class="small danger btn-del">✕ 削除</button>
      <button class="small btn-detail">詳細へ ⇒</button>
      <span>${project.name}</span>
    `;

    row.querySelector(".btn-up").onclick = () => onMove(index, index - 1);
    row.querySelector(".btn-down").onclick = () => onMove(index, index + 1);
    row.querySelector(".btn-del").onclick = () => onDelete(project.id);
    row.querySelector(".btn-detail").onclick = () => onSelect(project.id);

    dom.projectListEl.appendChild(row);
  });
}

// 💡 編集ボタンなどのコールバック関数を受け取れるように拡張
export function renderDetail(onMoveTask, onEditTask, onDeleteTask, onEditName, onEditGnote, onEditGdrive) {
  const project = state.projects.find(p => p.id === state.selectedProjectId);

  if (!project) {
    dom.noProjectSelectedEl.style.style.display = "block";
    dom.projectDetailEl.style.display = "none";
    return;
  }

  dom.noProjectSelectedEl.style.display = "none";
  dom.projectDetailEl.style.display = "block";

  dom.detailProjectNameEl.textContent = project.name;
  dom.detailProjectMemoEl.value = project.memo || "";

  // ボタンイベントの確実なバインド
  document.getElementById("edit-project-name-btn").onclick = onEditName;
  document.getElementById("edit-gnote-url-btn").onclick = onEditGnote;
  document.getElementById("edit-gdrive-url-btn").onclick = onEditGdrive;

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

  if (!project.tasks || project.tasks.length === 0) {
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
        <button class="small btn-task-up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="small btn-task-down" ${index === project.tasks.length - 1 ? "disabled" : ""}>↓</button>
      </td>
      <td>${task.due || ""}</td>
      <td>${task.title || ""}</td>
      <td>${task.detail || ""}</td>
      <td>${task.status || ""}</td>
      <td>${task.assignee || ""}</td>
      <td>${task.creator || ""}</td>
      <td class="task-actions">
        <button class="small btn-task-edit">⇐ 編集</button>
        <button class="small danger btn-task-del">✕ 削除</button>
      </td>
    `;

    tr.querySelector(".btn-task-up").onclick = () => onMoveTask(project.id, index, index - 1);
    tr.querySelector(".btn-task-down").onclick = () => onMoveTask(project.id, index, index + 1);
    tr.querySelector(".btn-task-edit").onclick = () => onEditTask(project.id, task.id);
    tr.querySelector(".btn-task-del").onclick = () => onDeleteTask(project.id, task.id);

    dom.taskListEl.appendChild(tr);
  });
}
