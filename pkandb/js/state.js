// state.js

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

// Firebaseからデータを読み込む（配列・オブジェクトの両方に対応する超強力版）
export async function loadData() {
  const snapshot = await db.ref("pkan_data").once("value");
  const data = snapshot.val();

  if (data) {
    // projects の読み込みとnull除去
    if (Array.isArray(data.projects)) {
      state.projects = data.projects.filter(p => p !== null);
    } else if (data.projects && typeof data.projects === 'object') {
      state.projects = Object.values(data.projects);
    } else {
      state.projects = [];
    }

    // 各プロジェクト内の tasks のnull除去
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

// 💡 外部からでも手動保存できるように export をつけました
export async function syncToFirebase() {
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
  // IDをタイムスタンプ文字列にして自動配列化を防ぐ
  const newId = "p_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

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

/* ──── タスク操作 ──── */
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

  const newId = "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  project.tasks.push({
    id: newId,
    ...taskData
  });
  await syncToFirebase();
}
