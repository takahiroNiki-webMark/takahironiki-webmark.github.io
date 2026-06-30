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
  syncToFirebase
} from "https://takahironiki-webmark.github.io/pkandb/js/state.js";

import {
  dom,
  initDom,
  renderProjectList,
  renderDetail
} from "https://takahironiki-webmark.github.io/pkandb/js/ui.js";

async function init() {
  await loadData();
  
  // 初期表示時は必ず未選択にする
  state.selectedProjectId = null;

  initDom();
  doRender();
  setupEvents();
}

function doRender() {
  renderProjectList(moveProjectHandler, selectProjectHandler, deleteProjectHandler);
  renderDetail(
    moveTaskHandler,
    editTaskHandler,
    deleteTaskHandler,
    editProjectNameHandler,
    editGnoteUrlHandler,
    editGdriveUrlHandler
  );
}

/* ──── ハンドラー関数群 ──── */
async function moveProjectHandler(from, to) {
  await moveProject(from, to);
  doRender();
}

async function selectProjectHandler(id) {
  await selectProject(id);
  doRender();
}

async function deleteProjectHandler(id) {
  if (!confirm("本当にこのプロジェクトを削除しますか？")) return;
  await deleteProject(id);
  doRender();
  alert("プロジェクトを削除しました。");
}

async function moveTaskHandler(projectId, from, to) {
  await moveTask(projectId, from, to);
  doRender();
}

// 課題編集モーダルを開く処理
async function editTaskHandler(projectId, taskId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project || !project.tasks) return;
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return;

  const modal = document.getElementById("task-edit-modal");
  document.getElementById("edit-task-due").value = task.due || "";
  document.getElementById("edit-task-title").value = task.title || "";
  document.getElementById("edit-task-detail").value = task.detail || "";
  document.getElementById("edit-task-status").value = task.status || "未着手";
  document.getElementById("edit-task-assignee").value = task.assignee || "";
  document.getElementById("edit-task-creator").value = task.creator || "";

  modal.style.display = "flex";

  // モーダル内「保存」
  document.getElementById("save-task-edit-btn").onclick = async () => {
    const title = document.getElementById("edit-task-title").value.trim();
    if (!title) {
      alert("課題名/概要は必須です。");
      return;
    }

    const newValues = {
      due: document.getElementById("edit-task-due").value,
      title: title,
      detail: document.getElementById("edit-task-detail").value.trim(),
      status: document.getElementById("edit-task-status").value,
      assignee: document.getElementById("edit-task-assignee").value.trim(),
      creator: document.getElementById("edit-task-creator").value.trim()
    };

    await updateTask(projectId, taskId, newValues);
    modal.style.display = "none";
    doRender();
    alert("課題を更新しました！");
  };

  // モーダル内「キャンセル」
  document.getElementById("cancel-task-edit-btn").onclick = () => {
    modal.style.display = "none";
  };
}

async function deleteTaskHandler(projectId, taskId) {
  if (!confirm("本当にこの課題を削除しますか？")) return;
  await deleteTask(projectId, taskId);
  doRender();
  alert("課題を削除しました。");
}

// プロジェクト名編集ポップアップ
async function editProjectNameHandler() {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  const newName = prompt("プロジェクト名称を変更してください", project.name || "");
  if (newName === null) return; 
  if (!newName.trim()) {
    alert("プロジェクト名称は空にできません。");
    return;
  }

  project.name = newName.trim();
  await syncToFirebase();
  doRender();
  alert("プロジェクト名称を変更しました！");
}

// GoogleNoteBookLM URL編集
async function editGnoteUrlHandler() {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  const newUrl = prompt("GoogleNoteBookLMのURLを編集してください", project.gnoteUrl || "");
  if (newUrl === null) return;

  project.gnoteUrl = newUrl.trim();
  await syncToFirebase();
  doRender();
  alert("GoogleNoteBookLMのURLを更新しました！");
}

// GoogleDrive URL編集
async function editGdriveUrlHandler() {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  const newUrl = prompt("GoogleDriveフォルダのURLを編集してください", project.gdriveUrl || "");
  if (newUrl === null) return;

  project.gdriveUrl = newUrl.trim();
  await syncToFirebase();
  doRender();
  alert("GoogleDriveのURLを更新しました！");
}

/* ──── イベント初期設定 ──── */
function setupEvents() {
  // 新規プロジェクト作成
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

    doRender();
    alert("新規プロジェクトを作成しました！");
  };

  // メモ保存ボタン
  document.getElementById("save-project-memo-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) {
      alert("プロジェクトが選択されていません。一覧から詳細を開いてください。");
      return;
    }
    project.memo = document.getElementById("detail-project-memo").value;
    await syncToFirebase();
    alert("メモをFirebaseに保存しました！");
  };

  // メモ欄の自動保存
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

  // 課題の新規作成
  document.getElementById("create-task-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) {
      alert("プロジェクトを選択した状態で作成してください。");
      return;
    }

    const titleInput = document.getElementById("new-task-title");
    const title = titleInput.value.trim();
    if (!title) {
      alert("課題名もしくは概要は必須です。");
      return;
    }

    const taskData = {
      due: document.getElementById("new-task-due").value,
      title: title,
      detail: document.getElementById("new-task-detail").value.trim(),
      status: document.getElementById("new-task-status").value,
      assignee: document.getElementById("new-task-assignee").value.trim(),
      creator: document.getElementById("new-task-creator").value.trim()
    };

    await createTask(project.id, taskData);

    document.getElementById("new-task-due").value = "";
    titleInput.value = "";
    document.getElementById("new-task-detail").value = "";
    document.getElementById("new-task-assignee").value = "";
    document.getElementById("new-task-creator").value = "";

    doRender();
    alert("新規課題を追加しました！");
  };
}

init();
