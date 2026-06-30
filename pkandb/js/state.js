// state.js

// 💡 1. 作成したFirebaseデータベースの初期化設定
const firebaseConfig = {
  databaseURL: "https://pkandb-8bfb4-default-rtdb.firebaseio.com/"
};

// 2回初期化されないようにチェックして初期化
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

export const state = {
  projects: [],
  selectedProjectId: null
};

// 💡 2. Firebaseからデータを読み込む処理に変更
export async function loadData() {
  // Firebaseの 'pkan_data' という場所からデータを1回取得する
  const snapshot = await db.ref("pkan_data").once("value");
  const data = snapshot.val();

  if (data) {
    state.projects = data.projects || [];
    state.selectedProjectId = data.selectedProjectId || null;
  } else {
    // 💡 初回アクセス時など、Firebaseが完全に空っぽの時は空の配列にする
    state.projects = [];
    state.selectedProjectId = null;
  }
}

// 💡 3. データを変更した後に、Firebase側へ自動で上書き保存する共通関数
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
  await syncToFirebase(); // Firebaseに保存
}

export async function selectProject(id) {
  state.selectedProjectId = id;
  await syncToFirebase(); // 選択状態をFirebaseに保存
}

export async function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.selectedProjectId === id) state.selectedProjectId = null;
  await syncToFirebase(); // Firebaseに保存
}

export async function createProject(name, gnoteUrl, gdriveUrl) {
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
  state.selectedProjectId = newId;
  await syncToFirebase(); // Firebaseに保存
}

/* ──── タスク（課題）操作 ──── */
export async function moveTask(projectId, fromIndex, toIndex) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  if (toIndex < 0 || toIndex >= project.tasks.length) return;

  const [t] = project.tasks.splice(fromIndex, 1);
  project.tasks.splice(toIndex, 0, t);
  await syncToFirebase(); // Firebaseに保存
}

export async function updateTask(projectId, taskId, newValues) {
  const project = state.projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);
  Object.assign(task, newValues);
  await syncToFirebase(); // Firebaseに保存
}

export async function deleteTask(projectId, taskId) {
  const project = state.projects.find(p => p.id === projectId);
  project.tasks = project.tasks.filter(t => t.id !== taskId);
  await syncToFirebase(); // Firebaseに保存
}

export async function createTask(projectId, taskData) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;

  const newId = project.tasks.length
    ? Math.max(...project.tasks.map(t => t.id)) + 1
    : 1;

  project.tasks.push({
    id: newId,
    ...taskData
  });
  await syncToFirebase(); // Firebaseに保存
}
