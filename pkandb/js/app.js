// js/app.js
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
  syncToFirebase,
  getLatestProject // 💡 追加
} from "./state.js";

import {
  dom,
  initDom,
  renderProjectList,
  renderDetail
} from "./ui.js";

// 💡 ユーザーが詳細画面を開いた瞬間の、そのプロジェクトの更新日時を記憶する変数
let projectOpenedAt = null;

async function init() {
  await loadData();
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

// 💡 保存処理の直前に、他人に更新されていないかを一括チェックする共通の防衛関数
async function checkCollision() {
  if (!state.selectedProjectId) return true; // 未選択ならチェック不要

  const latestProject = await getLatestProject(state.selectedProjectId);
  
  // Firebase側にデータがあり、かつその更新日時が、自分が「開いた時の日時」より新しくなっていたら衝突発生！
  if (latestProject && latestProject.updatedAt && projectOpenedAt && latestProject.updatedAt > projectOpenedAt) {
    alert("⚠️ 衝突検知：あなたがこのプロジェクトを開いた後に、別のユーザー（または別ブラウザ）が内容を更新しました。\n\nデータの変更内容が消えてしまうのを防ぐため、保存を中断しました。一度画面をリロードして最新のデータを確認してください。");
    return false; // ✕ 危険（保存してはいけない）
  }
  return true; // ◯ 安全（保存してOK）
}

/* ──── ハンドラー関数群 ──── */
async function moveProjectHandler(from, to) {
  await moveProject(from, to);
  doRender();
}

async function selectProjectHandler(id) {
  await selectProject(id);
  const project = state.projects.find(p => p.id === id);
  
  // 💡 詳細画面を開いた瞬間のタイムスタンプを記憶する
  projectOpenedAt = project ? (project.updatedAt || null) : null;
  
  doRender();
}

async function deleteProjectHandler(id) {
  if (!confirm("本当にこのプロジェクトを削除しますか？")) return;
  await deleteProject(id);
  doRender();
  alert("プロジェクトを削除しました。");
}

async function moveTaskHandler(projectId, from, to) {
  // タスク並び替え時も衝突を検知
  if (!(await checkCollision())) return;

  await moveTask(projectId, from, to);
  
  // 保存に成功したので、自分の開いた時間を最新にする
  const project = state.projects.find(p => p.id === projectId);
  if (project) projectOpenedAt = project.updatedAt;

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
    // 💡 保存する瞬間に衝突チェック
    if (!(await checkCollision())) {
      modal.style.display = "none";
      return;
    }

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
    
    // 開いた時間を最新化
    projectOpenedAt = project.updatedAt;

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
  
  // 💡 削除時も衝突チェック
  if (!(await checkCollision())) return;

  await deleteTask(projectId, taskId);
  
  const project = state.projects.find(p => p.id === projectId);
  if (project) projectOpenedAt = project.updatedAt;

  doRender();
  alert("課題を削除しました。");
}

// プロジェクト名編集ポップアップ
async function editProjectNameHandler() {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  // 💡 編集開始直前に衝突チェック
  if (!(await checkCollision())) return;

  const newName = prompt("プロジェクト名称を変更してください", project.name || "");
  if (newName === null) return; 
  if (!newName.trim()) {
    alert("プロジェクト名称は空にできません。");
    return;
  }

  project.name = newName.trim();
  project.updatedAt = Date.now(); // タイムスタンプ更新
  await syncToFirebase();
  
  projectOpenedAt = project.updatedAt;
  doRender();
  alert("プロジェクト名称を変更しました！");
}

// GoogleNoteBookLM URL編集
async function editGnoteUrlHandler() {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  if (!(await checkCollision())) return;

  const newUrl = prompt("GoogleNoteBookLMのURLを編集してください", project.gnoteUrl || "");
  if (newUrl === null) return;

  project.gnoteUrl = newUrl.trim();
  project.updatedAt = Date.now();
  await syncToFirebase();
  
  projectOpenedAt = project.updatedAt;
  doRender();
  alert("GoogleNoteBookLMのURLを更新しました！");
}

// GoogleDrive URL編集
async function editGdriveUrlHandler() {
  const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  if (!(await checkCollision())) return;

  const newUrl = prompt("GoogleDriveフォルダのURLを編集してください", project.gdriveUrl || "");
  if (newUrl === null) return;

  project.gdriveUrl = newUrl.trim();
  project.updatedAt = Date.now();
  await syncToFirebase();
  
  projectOpenedAt = project.updatedAt;
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

    // 新規作成して自動で詳細を開いたので、そのプロジェクトの作成日時を開いた日時とする
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    projectOpenedAt = project ? project.updatedAt : null;

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

    // 💡 保存する瞬間に衝突チェック
    if (!(await checkCollision())) return;

    project.memo = document.getElementById("detail-project-memo").value;
    project.updatedAt = Date.now(); // タイムスタンプ更新

    await syncToFirebase();
    projectOpenedAt = project.updatedAt; // 自分の開いた時間を最新にする
    alert("メモをFirebaseに保存しました！");
  };

  // ※メモ欄の自動保存（oninput）機能は衝突防止のため一旦安全にスキップ（または手動保存に一本化）します
  // 複数人同時編集環境下での文字入力中の自動上書きを防ぐため、上記「メモ保存」ボタンでの保存を推奨します。

  // 課題の新規作成
  document.getElementById("create-task-btn").onclick = async () => {
    const project = state.projects.find(p => p.id === state.selectedProjectId);
    if (!project) {
      alert("プロジェクトを選択した状態で作成してください。");
      return;
    }

    // 💡 保存する瞬間に衝突チェック
    if (!(await checkCollision())) return;

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
    
    // 開いた時間を最新化
    projectOpenedAt = project.updatedAt;

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
