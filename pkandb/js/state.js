// state.js

// 1. Firebaseの初期化設定
const firebaseConfig = {
  databaseURL: "https://pkandb-8bfb4-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

export const state = {
  projects: [],
  selectedProjectId: null
};

// 2. Firebaseからデータを読み込む処理（null防御を追加）
export async function loadData() {
  const snapshot = await db.ref("pkan_data").once("value");
  const data = snapshot.val();

  if (data) {
    // 💡 Firebaseの自動配列化で null が混ざった場合、綺麗に取り除く防御
    if (Array.isArray(data.projects)) {
      state.projects = data.projects.filter(p => p !== null);
    } else if (data.projects && typeof data.projects === 'object') {
      state.projects = Object.values(data.projects);
    } else {
      state.projects = [];
    }

    // 各プロジェクト内の tasks に null が混ざっている場合も綺麗にする
    state.projects.forEach(project => {
      if (!project.tasks) {
        project.tasks = [];
      } else if (Array.isArray(project.tasks)) {
        project.tasks = project.tasks.filter(t => t !== null);
      } else if (typeof project.tasks === 'object') {
        project.tasks = Object.values(project.tasks);
      }
    });

    state.selectedProjectId = data.selectedProjectId || null;
  } else {
    state.projects = [];
    state.selectedProjectId = null;
  }
}

// 3. データを変更した後に、Firebase側へ自動で上書き保存する共通関数
async function syncToFirebase() {
  await db.ref("pkan_data").set({
    projects: state.projects,
    selectedProjectId: state.selectedProjectId
  });
}

/* ──── プロジェクト操作 ──── */
export async function moveProject(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= state.projects.length) return;
  const [p] = state.projects.splice(fromIndex, 1);
  state.projects.splice(toIndex, 0, p);
  await syncToFirebase();
}

export async function selectProject(id) {
  state.selectedProjectId = id;
  await syncToFirebase();
}

export async function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.selectedProjectId === id) state.selectedProjectId = null;
  await syncToFirebase();
}

export async function createProject(name, gnoteUrl, gdriveUrl) {
  // 💡 IDを数字ではなく、絶対に重複しない文字列（p + 現在の時刻スタンプ）にする
  const newId = "p_" + Date.now();

  state.projects.push({
    id: newId,
    name,
    gnoteUrl,
    gdriveUrl,
    memo: "",
    tasks: []
  });
  state.selectedProjectId = newId;
  await syncToFirebase();
}

/* ──── タスク（課題）操作 ──── */
export async function moveTask(projectId, fromIndex, toIndex) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  if (toIndex < 0 || toIndex >= project.tasks.length) return;

  const [t] = project.tasks.splice(fromIndex, 1);
  project.tasks.splice(toIndex, 0, t);
  await syncToFirebase();
}

export async function updateTask(projectId, taskId, newValues) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return;
  Object.assign(task, newValues);
  await syncToFirebase();
}

export async function deleteTask(projectId, taskId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  project.tasks = project.tasks.filter(t => t.id !== taskId);
  await syncToFirebase();
}

export async function createTask(projectId, taskData) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;

  // 💡 タスクのIDも同様に、文字列（t + 現在の時刻スタンプ）にする
  const newId = "t_" + Date.now();

  project.tasks.push({
    id: newId,
    ...taskData
  });
  await syncToFirebase();
}
