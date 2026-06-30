// js/state.js

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

// Firebaseからデータを読み込む
export async function loadData() {
  const snapshot = await db.ref("pkan_data").once("value");
  const data = snapshot.val();

  if (data) {
    if (Array.isArray(data.projects)) {
      state.projects = data.projects.filter(p => p !== null);
    } else if (data.projects && typeof data.projects === 'object') {
      state.projects = Object.values(data.projects);
    } else {
      state.projects = [];
    }

    state.projects.forEach(project => {
      if (!project.tasks) {
        project.tasks = [];
      } else if (Array.isArray(project.tasks)) {
        project.tasks = project.tasks.filter(t => t !== null);
      } else if (typeof project.tasks === 'object') {
        project.tasks = Object.values(project.tasks);
      }
    });
  } else {
    state.projects = [];
  }
  
  state.selectedProjectId = null;
}

// 💡 衝突検知用：Firebase上にある特定のプロジェクトの「最新のデータ」を直接1件取得する
export async function getLatestProject(projectId) {
  // state.projects 配列の中のインデックスを探す
  const index = state.projects.findIndex(p => p.id === projectId);
  if (index === -1) return null;

  // Firebase上の該当するインデックスの場所をピンポイントで読み取る
  const snapshot = await db.ref(`pkan_data/projects/${index}`).once("value");
  return snapshot.val();
}

// Firebaseへのデータ同期
export async function syncToFirebase() {
  await db.ref("pkan_data").set({
    projects: state.projects
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
}

export async function deleteProject(id) {
  state.projects = state.projects.filter(p => p.id !== id);
  if (state.selectedProjectId === id) state.selectedProjectId = null;
  await syncToFirebase();
}

export async function createProject(name, gnoteUrl, gdriveUrl) {
  const newId = "p_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  state.projects.push({
    id: newId,
    name,
    gnoteUrl,
    gdriveUrl,
    memo: "",
    updatedAt: Date.now(), // 💡 初期作成時のタイムスタンプ
    tasks: []
  });
  state.selectedProjectId = newId;
  await syncToFirebase();
}

/* ──── タスク操作 ──── */
export async function moveTask(projectId, fromIndex, toIndex) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  if (toIndex < 0 || toIndex >= project.tasks.length) return;

  const [t] = project.tasks.splice(fromIndex, 1);
  project.tasks.splice(toIndex, 0, t);
  
  project.updatedAt = Date.now(); // 💡 タスク並び替え時も更新時間を進める
  await syncToFirebase();
}

export async function updateTask(projectId, taskId, newValues) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  const task = project.tasks.find(t => t.id === taskId);
  if (!task) return;
  Object.assign(task, newValues);
  
  project.updatedAt = Date.now(); // 💡 タスク編集時も更新時間を進める
  await syncToFirebase();
}

export async function deleteTask(projectId, taskId) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;
  project.tasks = project.tasks.filter(t => t.id !== taskId);
  
  project.updatedAt = Date.now(); // 💡 タスク削除時も更新時間を進める
  await syncToFirebase();
}

export async function createTask(projectId, taskData) {
  const project = state.projects.find(p => p.id === projectId);
  if (!project) return;

  const newId = "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  project.tasks.push({
    id: newId,
    ...taskData
  });
  
  project.updatedAt = Date.now(); // 💡 タスク追加時も更新時間を進める
  await syncToFirebase();
}
