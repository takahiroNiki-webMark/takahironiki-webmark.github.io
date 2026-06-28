/* ============================
   アプリ状態（state）
============================ */
const state = {
  projects: [],
  selectedProjectId: null
};

/* ============================
   JSON 読み込み
============================ */
async function loadData() {
  const res = await fetch("https://takahironiki-webmark.github.io/pkan/data/sample-data.json");
  const data = await res.json();
  return data;
}

/* ============================
   初期化処理
============================ */
loadData().then(data => {
  console.log("Loaded data:", data);

  // state にセット
  state.projects = data.projects;
  state.selectedProjectId = data.selectedProjectId;

  // DOM 要素取得
  initDomElements();

  // 初期描画
  renderProjectList();
  renderDetail();
});

/* ============================
   DOM 要素取得
============================ */
function initDomElements() {
  window.projectListEl = document.getElementById("project-list");
  window.noProjectSelectedEl = document.getElementById("no-project-selected");
  window.projectDetailEl = document.getElementById("project-detail");

  window.detailProjectNameEl = document.getElementById("detail-project-name");
  window.detailProjectMemoEl = document.getElementById("detail-project-memo");
  window.taskListEl = document.getElementById("task-list");
  window.detailGnoteUrlEl = document.getElementById("detail-gnote-url");
  window.detailGdriveUrlEl = document.getElementById("detail-gdrive-url");
}

  const projectListEl = document.getElementById("project-list");
  const noProjectSelectedEl = document.getElementById("no-project-selected");
  const projectDetailEl = document.getElementById("project-detail");

  const detailProjectNameEl = document.getElementById("detail-project-name");
  const detailProjectMemoEl = document.getElementById("detail-project-memo");
  const taskListEl = document.getElementById("task-list");
  const detailGnoteUrlEl = document.getElementById("detail-gnote-url");
  const detailGdriveUrlEl = document.getElementById("detail-gdrive-url");

/* プロジェクト一覧描画 */
  function renderProjectList() {
    projectListEl.innerHTML = "";
      state.projects.forEach((project, index) => {
        const row = document.createElement("div");
  row.className = "project-item";

  const indexSpan = document.createElement("span");
  indexSpan.className = "index";
  indexSpan.textContent = index + 1;

  const moveUpBtn = document.createElement("button");
  moveUpBtn.className = "small";
  moveUpBtn.textContent = "↑";
  moveUpBtn.disabled = index === 0;
        moveUpBtn.onclick = () => moveProject(index, index - 1);

  const moveDownBtn = document.createElement("button");
  moveDownBtn.className = "small";
  moveDownBtn.textContent = "↓";
  moveDownBtn.disabled = index === state.projects.length - 1;
        moveDownBtn.onclick = () => moveProject(index, index + 1);

  const detailBtn = document.createElement("button");
  detailBtn.className = "small";
  detailBtn.textContent = "詳細へ ⇒";
        detailBtn.onclick = () => selectProject(project.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "small danger";
  deleteBtn.textContent = "✕ 削除";
        deleteBtn.onclick = () => deleteProject(project.id);

  const nameSpan = document.createElement("span");
  nameSpan.textContent = project.name;

  row.appendChild(indexSpan);
  row.appendChild(moveUpBtn);
  row.appendChild(moveDownBtn);
  row.appendChild(deleteBtn);
  row.appendChild(detailBtn);
  row.appendChild(nameSpan);

  projectListEl.appendChild(row);
      });
    }

  function moveProject(fromIndex, toIndex) {
      if (toIndex < 0 || toIndex >= state.projects.length) return;
  const [p] = state.projects.splice(fromIndex, 1);
  state.projects.splice(toIndex, 0, p);
  renderProjectList();
    }

  function selectProject(id) {
    state.selectedProjectId = id;
  renderDetail();
    }

  function deleteProject(id) {
      const project = state.projects.find(p => p.id === id);
  if (!project) return;
  const ok = confirm(`プロジェクト「${project.name}」を削除しますか？`);
  if (!ok) return;
      state.projects = state.projects.filter(p => p.id !== id);
  if (state.selectedProjectId === id) {
    state.selectedProjectId = null;
      }
  renderProjectList();
  renderDetail();
    }

/* ============================
   詳細画面描画
============================ */
  function renderDetail() {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) {
    noProjectSelectedEl.style.display = "block";
  projectDetailEl.style.display = "none";
  return;
      }

  noProjectSelectedEl.style.display = "none";
  projectDetailEl.style.display = "block";

  detailProjectNameEl.textContent = project.name;
  detailProjectMemoEl.value = project.memo || "";

  // NotebookLM
  if (project.gnoteUrl) {
    detailGnoteUrlEl.textContent = project.gnoteUrl;
  detailGnoteUrlEl.href = project.gnoteUrl;
  detailGnoteUrlEl.classList.remove("muted");
      } else {
    detailGnoteUrlEl.textContent = "(未設定)";
  detailGnoteUrlEl.href = "#";
  detailGnoteUrlEl.classList.add("muted");
      }

  // GoogleDrive
  if (project.gdriveUrl) {
    detailGdriveUrlEl.textContent = project.gdriveUrl;
  detailGdriveUrlEl.href = project.gdriveUrl;
  detailGdriveUrlEl.classList.remove("muted");
      } else {
    detailGdriveUrlEl.textContent = "(未設定)";
  detailGdriveUrlEl.href = "#";
  detailGdriveUrlEl.classList.add("muted");
      }


  renderTaskList(project);
    }

/* 課題一覧描画（課題なし対応） */
  function renderTaskList(project) {
    taskListEl.innerHTML = "";

  if (project.tasks.length === 0) {
        const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 9;
  td.style.textAlign = "center";
  td.style.padding = "12px";
  td.style.color = "#9bbce3";
  td.textContent = "現在、課題はありません";
  tr.appendChild(td);
  taskListEl.appendChild(tr);
  return;
      }

      project.tasks.forEach((task, index) => {
        const tr = document.createElement("tr");

  const tdIndex = document.createElement("td");
  tdIndex.textContent = index + 1;

  const tdMove = document.createElement("td");
  const upBtn = document.createElement("button");
  upBtn.className = "small";
  upBtn.textContent = "↑";
  upBtn.disabled = index === 0;
        upBtn.onclick = () => moveTask(project.id, index, index - 1);

  const downBtn = document.createElement("button");
  downBtn.className = "small";
  downBtn.textContent = "↓";
  downBtn.disabled = index === project.tasks.length - 1;
        downBtn.onclick = () => moveTask(project.id, index, index + 1);

  tdMove.appendChild(upBtn);
  tdMove.appendChild(downBtn);

  const tdDue = document.createElement("td");
  tdDue.textContent = task.due || "";

  const tdTitle = document.createElement("td");
  tdTitle.textContent = task.title || "";

  const tdDetail = document.createElement("td");
  tdDetail.textContent = task.detail || "";

  const tdStatus = document.createElement("td");
  tdStatus.textContent = task.status || "";

  const tdAssignee = document.createElement("td");
  tdAssignee.textContent = task.assignee || "";

  const tdCreator = document.createElement("td");
  tdCreator.textContent = task.creator || "";

  const tdActions = document.createElement("td");
  tdActions.className = "task-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "small";
  editBtn.textContent = "⇐ 編集";
        editBtn.onclick = () => editTask(project.id, task.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "small danger";
  deleteBtn.textContent = "✕ 削除";
        deleteBtn.onclick = () => deleteTask(project.id, task.id);

  tdActions.appendChild(editBtn);
  tdActions.appendChild(deleteBtn);

  tr.appendChild(tdIndex);
  tr.appendChild(tdMove);
  tr.appendChild(tdDue);
  tr.appendChild(tdTitle);
  tr.appendChild(tdDetail);
  tr.appendChild(tdStatus);
  tr.appendChild(tdAssignee);
  tr.appendChild(tdCreator);
  tr.appendChild(tdActions);

  taskListEl.appendChild(tr);
      });
    }

  function moveTask(projectId, fromIndex, toIndex) {
      const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  if (toIndex < 0 || toIndex >= project.tasks.length) return;
  const [t] = project.tasks.splice(fromIndex, 1);
  project.tasks.splice(toIndex, 0, t);
  renderDetail();
    }

 /*  課題編集 */
  let editingTaskProjectId = null;
  let editingTaskId = null;

  function editTask(projectId, taskId) {
      const project = state.projects.find(p => p.id === projectId);
      const task = project.tasks.find(t => t.id === taskId);

  editingTaskProjectId = projectId;
  editingTaskId = taskId;

  // モーダルに値をセット
  document.getElementById("edit-task-due").value = task.due || "";
  document.getElementById("edit-task-title").value = task.title || "";
  document.getElementById("edit-task-detail").value = task.detail || "";
  document.getElementById("edit-task-status").value = task.status || "未着手";
  document.getElementById("edit-task-assignee").value = task.assignee || "";
  document.getElementById("edit-task-creator").value = task.creator || "";

  
  // モーダル表示
  document.getElementById("task-edit-modal").style.display = "flex";
    }

    // 保存
    document.getElementById("save-task-edit-btn").onclick = () => {
      const project = state.projects.find(p => p.id === editingTaskProjectId);
      const task = project.tasks.find(t => t.id === editingTaskId);

  task.due = document.getElementById("edit-task-due").value;
  task.title = document.getElementById("edit-task-title").value.trim();
  task.detail = document.getElementById("edit-task-detail").value.trim();
  task.status = document.getElementById("edit-task-status").value;
  task.assignee = document.getElementById("edit-task-assignee").value.trim();
  task.creator = document.getElementById("edit-task-creator").value.trim();

  document.getElementById("task-edit-modal").style.display = "none";
  renderDetail();
    };

    // キャンセル
    document.getElementById("cancel-task-edit-btn").onclick = () => {
    document.getElementById("task-edit-modal").style.display = "none";
    };

  /* ============================
     課題削除
     ============================ */
  function deleteTask(projectId, taskId) {
      const project = state.projects.find(p => p.id === projectId);
  if (!project) return;

      const task = project.tasks.find(t => t.id === taskId);
  if (!task) return;

  const ok = confirm(`課題「${task.title}」を削除しますか？`);
  if (!ok) return;

      project.tasks = project.tasks.filter(t => t.id !== taskId);
  renderDetail();
    }

    /* ============================
       新規プロジェクト作成
       ============================ */
    document.getElementById("create-project-btn").onclick = () => {
      const name = document.getElementById("new-project-name").value.trim();
  const gnote = document.getElementById("new-project-gnote").value.trim();
  const gdrive = document.getElementById("new-project-gdrive").value.trim();

  if (!name) {
    alert("プロジェクト名称は必須です。");
  return;
      }

  const newId = state.projects.length
        ? Math.max(...state.projects.map(p => p.id)) + 1
  : 1;

  state.projects.push({
    id: newId,
  name,
  gnoteUrl: gnote,
  gdriveUrl: gdrive,
  memo: "",
  tasks: []
      });

  document.getElementById("new-project-name").value = "";
  document.getElementById("new-project-gnote").value = "";
  document.getElementById("new-project-gdrive").value = "";

  renderProjectList();
    };

    /* ============================
       プロジェクト名称編集
       ============================ */
    document.getElementById("edit-project-name-btn").onclick = () => {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  const name = prompt("プロジェクト名称を編集", project.name);
  if (name === null) return;

  project.name = name.trim() || project.name;

  renderProjectList();
  renderDetail();
    };


    /* ============================
       プロジェクトメモ保存
       ============================ */
    document.getElementById("save-project-memo-btn").onclick = () => {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  project.memo = document.getElementById("detail-project-memo").value;
  alert("メモを保存しました。（仮）");
    };


    /* ============================
       Gnote URL 編集
       ============================ */
    document.getElementById("edit-gnote-url-btn").onclick = () => {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  const url = prompt("GoogleNoteBookLMのURLを編集", project.gnoteUrl || "");
  if (url === null) return;

  project.gnoteUrl = url.trim();
  renderDetail();
    };

    /* ============================
       GoogleDrive URL 編集
       ============================ */
    document.getElementById("edit-gdrive-url-btn").onclick = () => {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) return;

  const url = prompt("GoogleDriveフォルダのURLを編集", project.gdriveUrl || "");
  if (url === null) return;

  project.gdriveUrl = url.trim();
  renderDetail();
    };

    /* ============================
       新規課題作成
       ============================ */
    document.getElementById("create-task-btn").onclick = () => {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
  if (!project) {
    alert("プロジェクトを選択してください。");
  return;
      }

  const due = document.getElementById("new-task-due").value;
  const title = document.getElementById("new-task-title").value.trim();
  const detail = document.getElementById("new-task-detail").value.trim();
  const status = document.getElementById("new-task-status").value;
  const assignee = document.getElementById("new-task-assignee").value.trim();
  const creator = document.getElementById("new-task-creator").value.trim();

  if (!title) {
    alert("課題名/概要は必須です。");
  return;
      }

  const newId = project.tasks.length
        ? Math.max(...project.tasks.map(t => t.id)) + 1
  : 1;

  project.tasks.push({
    id: newId,
  due,
  title,
  detail,
  status,
  assignee,
  creator
      });

  document.getElementById("new-task-due").value = "";
  document.getElementById("new-task-title").value = "";
  document.getElementById("new-task-detail").value = "";
  document.getElementById("new-task-status").value = "未着手";
  document.getElementById("new-task-assignee").value = "";
  document.getElementById("new-task-creator").value = "";

  renderDetail();
    };

  /* ============================
     初期描画
     ============================ */
  renderProjectList();
  renderDetail();
