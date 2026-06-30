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

// Firebaseからデータを読み込む
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
  } else {
    state.projects = [];
  }
  
  // 💡 初期表示で勝手に選択されるのを防ぐため、読み込み直後は必ずnull（未選択）にする
  state.selectedProjectId = null;
}

// Firebaseへのデータ同期（選択状態IDは保存せず、プロジェクトデータのみをクリーンに保存）
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
  // 選択切り替え時はFirebaseに保存しない（ローカル状態として保持）
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
