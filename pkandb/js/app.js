// app.js
import {
  state,
  loadData,
  moveProject,
  selectProject,
  deleteProject,
  moveTask,
  updateTask,
  deleteTask,
  createProject,
  createTask
} from "https://takahironiki-webmark.github.io/pkandb/js/state.js";

import {
  dom,
  initDom,
  renderProjectList,
  renderDetail
} from "https://takahironiki-webmark.github.io/pkandb/js/ui.js";

async function init() {
  await loadData();
  initDom();

  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);

  setupEvents();
}

function moveProjectHandler(from, to) {
  moveProject(from, to);
  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
}

function selectProjectHandler(id) {
  selectProject(id);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

function deleteProjectHandler(id) {
  deleteProject(id);
  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

function moveTaskHandler(projectId, from, to) {
  moveTask(projectId, from, to);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

function editTaskHandler(projectId, taskId) {
  const modal = document.getElementById("task-edit-modal");
  modal.style.display = "flex";

  const project = state.projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);

  document.getElementById("edit-task-due").value = task.due || "";
  document.getElementById("edit-task-title").value = task.title || "";
  document.getElementById("edit-task-detail").value = task.detail || "";
  document.getElementById("edit-task-status").value = task.status || "未着手";
  document.getElementById("edit-task-assignee").value = task.assignee || "";
  document.getElementById("edit-task-creator").value = task.creator || "";

  document.getElementById("save-task-edit-btn").onclick = () => {
    updateTask(projectId, taskId, {
      due: document.getElementById("edit-task-due").value,
      title: document.getElementById("edit-task-title").value.trim(),
      detail: document.getElementById("edit-task-detail").value.trim(),
      status: document.getElementById("edit-task-status").value,
      assignee: document.getElementById("edit-task-assignee").value.trim(),
      creator: document.getElementById("edit-task-creator").value.trim()
    });

    modal.style.display = "none";
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  document.getElementById("cancel-task-edit-btn").onclick = () => {
    modal.style.display = "none";
  };
}

function deleteTaskHandler(projectId, taskId) {
  deleteTask(projectId, taskId);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

function setupEvents() {
  document.getElementById("create-project-btn").onclick = () => {
    const name = document.getElementById("new-project-name").value.trim();
    const gnote = document.getElementById("new-project-gnote").value.trim();
    const gdrive = document.getElementById("new-project-gdrive").value.trim();

    if (!name) {
      alert("プロジェクト名称は必須です。");
      return;
    }

    createProject(name, gnote, gdrive);

    document.getElementById("new-project-name").value = "";
    document.getElementById("new-project-gnote").value = "";
    document.getElementById("new-project-gdrive").value = "";

    renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
  };

  document.getElementById("edit-project-name-btn").onclick = () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    const name = prompt("プロジェクト名称を編集", project.name);
    if (name === null) return;

    project.name = name.trim() || project.name;

    renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  document.getElementById("save-project-memo-btn").onclick = () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    project.memo = document.getElementById("detail-project-memo").value;
    alert("メモを保存しました。（仮）");
  };

  document.getElementById("edit-gnote-url-btn").onclick = () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    const url = prompt("GoogleNoteBookLMのURLを編集", project.gnoteUrl || "");
    if (url === null) return;

    project.gnoteUrl = url.trim();
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  document.getElementById("edit-gdrive-url-btn").onclick = () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    const url = prompt("GoogleDriveフォルダのURLを編集", project.gdriveUrl || "");
    if (url === null) return;

    project.gdriveUrl = url.trim();
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  document.getElementById("create-task-btn").onclick = () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) {
      alert("プロジェクトを選択してください。");
      return;
    }

    const taskData = {
      due: document.getElementById("new-task-due").value,
      title: document.getElementById("new-task-title").value.trim(),
      detail: document.getElementById("new-task-detail").value.trim(),
      status: document.getElementById("new-task-status").value,
      assignee: document.getElementById("new-task-assignee").value.trim(),
      creator: document.getElementById("new-task-creator").value.trim()
    };

    if (!taskData.title) {
      alert("課題名/概要は必須です。");
      return;
    }

    createTask(project.id, taskData);

    document.getElementById("new-task-due").value = "";
    document.getElementById("new-task-title").value = "";
    document.getElementById("new-task-detail").value = "";
    document.getElementById("new-task-status").value = "未着手";
    document.getElementById("new-task-assignee").value = "";
    document.getElementById("new-task-creator").value = "";

    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };
}

init();