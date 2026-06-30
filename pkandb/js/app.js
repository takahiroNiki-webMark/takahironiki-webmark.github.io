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
  createTask,
  syncToFirebase // 手動保存用
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

async function moveProjectHandler(from, to) {
  await moveProject(from, to);
  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
}

async function selectProjectHandler(id) {
  await selectProject(id);
  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

async function deleteProjectHandler(id) {
  if (!confirm("本当にこのプロジェクトを削除しますか？")) return;
  await deleteProject(id);
  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

async function moveTaskHandler(projectId, from, to) {
  await moveTask(projectId, from, to);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

async function editTaskHandler(projectId, taskId) {
  const project = state.projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById("task-edit-modal");
  const dueInput = document.getElementById("edit-task-due");
  const titleInput = document.getElementById("edit-task-title");
  const detailInput = document.getElementById("edit-task-detail");
  const statusSelect = document.getElementById("edit-task-status");
  const assigneeInput = document.getElementById("edit-task-assignee");
  const creatorInput = document.getElementById("edit-task-creator");

  dueInput.value = task.due || "";
  titleInput.value = task.title || "";
  detailInput.value = task.detail || "";
  statusSelect.value = task.status || "未着手";
  assigneeInput.value = task.assignee || "";
  creatorInput.value = task.creator || "";

  modal.style.display = "flex";

  // HTMLのID「save-task-edit-btn」に合わせて修正
  document.getElementById("save-task-edit-btn").onclick = async () => {
    const newValues = {
      due: dueInput.value,
      title: titleInput.value.trim(),
      detail: detailInput.value.trim(),
      status: statusSelect.value,
      assignee: assigneeInput.value.trim(),
      creator: creatorInput.value.trim()
    };

    if (!newValues.title) {
      alert("課題名/概要は必須です。");
      return;
    }

    await updateTask(projectId, taskId, newValues);
    modal.style.display = "none";
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  // HTMLのID「cancel-task-edit-btn」に合わせて修正
  document.getElementById("cancel-task-edit-btn").onclick = () => {
    modal.style.display = "none";
  };
}

async function deleteTaskHandler(projectId, taskId) {
  if (!confirm("本当にこの課題を削除しますか？")) return;
  await deleteTask(projectId, taskId);
  renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
}

function setupEvents() {
  // プロジェクト新規作成
  document.getElementById("create-project-btn").onclick = async () => {
    const nameInput = document.getElementById("new-project-name");
    const gnoteInput = document.getElementById("new-project-gnote");
    const gdriveInput = document.getElementById("new-project-gdrive");

    const name = nameInput.value.trim();
    if (!name) {
      alert("案件名称は必須です。");
      return;
    }

    await createProject(name, gnoteInput.value.trim(), gdriveInput.value.trim());

    nameInput.value = "";
    gnoteInput.value = "";
    gdriveInput.value = "";

    renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  // プロジェクト名称の編集を追加（未実装だった部分）
  document.getElementById("edit-project-name-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    const newName = prompt("プロジェクト名称を変更", project.name || "");
    if (newName === null) return;
    if (!newName.trim()) {
      alert("名称を入力してください。");
      return;
    }

    project.name = newName.trim();
    await syncToFirebase();
    renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  // メモ欄のリアルタイム保存（※「メモ保存」ボタンを使用しない自動保存。もしボタンを使う場合は別途処理が必要です）
  let memoTimeout;
  document.getElementById("detail-project-memo").oninput = (e) => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;
    project.memo = e.target.value;
    
    clearTimeout(memoTimeout);
    memoTimeout = setTimeout(async () => {
      await syncToFirebase();
    }, 500);
  };
  
  // HTML側にある「メモ保存」ボタン（save-project-memo-btn）を押したときも即時保存するように補強
  document.getElementById("save-project-memo-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;
    project.memo = document.getElementById("detail-project-memo").value;
    await syncToFirebase();
    alert("メモを保存しました。");
  };

  // GoogleNoteURL編集（HTMLのIDに合わせて -url-btn に修正）
  document.getElementById("edit-gnote-url-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    const url = prompt("GoogleNoteBookLMのURLを編集", project.gnoteUrl || "");
    if (url === null) return;

    project.gnoteUrl = url.trim();
    await syncToFirebase();
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  // GoogleDriveURL編集（HTMLのIDに合わせて -url-btn に修正）
  document.getElementById("edit-gdrive-url-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) return;

    const url = prompt("GoogleDriveフォルダのURLを編集", project.gdriveUrl || "");
    if (url === null) return;

    project.gdriveUrl = url.trim();
    await syncToFirebase();
    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };

  // 課題（タスク）新規作成
  document.getElementById("create-task-btn").onclick = async () => {
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

    await createTask(project.id, taskData);

    document.getElementById("new-task-due").value = "";
    document.getElementById("new-task-title").value = "";
    document.getElementById("new-task-detail").value = "";
    document.getElementById("new-task-assignee").value = "";
    document.getElementById("new-task-creator").value = "";

    renderDetail(moveTaskHandler, editTaskHandler, deleteTaskHandler);
  };
}

init();
