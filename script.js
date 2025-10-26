// --- CONFIGURAÇÃO ---
const SUPABASE_URL = "https://uwnlupxfwqeortbnuinl.supabase.co";
// CORREÇÃO: Havia um erro de digitação ('ı' em vez de '1') na chave original.
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bmx1cHhmd3Flb3J0Ym51aW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5ODcsImV4cCI6MjA3MTEyNjk4N30.sugSUyCfWkJQzuGbfbjgHqmv-nAQMqqD9-t-giohquw";
const { createClient } = supabase;
const dbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- ELEMENTOS DO DOM ---
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const logoutButton = document.getElementById("logoutButton");
const scientistsList = document.getElementById("scientistsList");
const loadingIndicator = document.getElementById("loadingIndicator");
const addScientistButton = document.getElementById("addScientistButton");

const scientistModal = document.getElementById("scientistModal");
const scientistForm = document.getElementById("scientistForm");
const modalTitle = document.getElementById("modalTitle");
const formScientistId = document.getElementById("scientistId");
const closeModalButton = document.getElementById("closeModalButton");

const quizModal = document.getElementById("quizModal");
const quizModalTitle = document.getElementById("quizModalTitle");
const quizQuestionsList = document.getElementById("quizQuestionsList");
const quizForm = document.getElementById("quizForm");
const quizFormTitle = document.getElementById("quizFormTitle");
const quizOptionsContainer = document.getElementById("quizOptionsContainer");
const quizSubmitButton = document.getElementById("quizSubmitButton");
const closeQuizModalButton = document.getElementById("closeQuizModalButton");
const quizScientistId = document.getElementById("quizScientistId");
const editingQuestionIdInput = document.getElementById("editingQuestionId");

// --- ESTADO DA APLICAÇÃO ---
let currentScientists = [];
let currentQuizQuestions = []; // Armazena as perguntas com as opções

// --- FUNÇÕES DE UI ---
const showLoading = () => (loadingIndicator.style.display = "flex");
const hideLoading = () => (loadingIndicator.style.display = "none");

function handleSupabaseError(error, action) {
  console.error(`Falha ao ${action}:`, error);
  if (
    error.message.includes("violates row-level security policy") ||
    error.code === "42501"
  ) {
    alert(
      `Erro de Permissão: A sua conta não tem a role de "admin" necessária para ${action}.`
    );
  } else {
    alert(`Ocorreu um erro ao tentar ${action}. (Mensagem: ${error.message})`);
  }
}

function renderScientists(scientists) {
  scientistsList.innerHTML = "";
  if (scientists.length === 0) {
    scientistsList.innerHTML =
      '<p class="text-gray-500">Nenhuma cientista encontrada.</p>';
    return;
  }
  scientists.forEach((scientist) => {
    const div = document.createElement("div");
    div.className =
      "bg-white p-4 rounded-lg shadow-md flex justify-between items-center";
    div.innerHTML = `
      <div>
     <h3 class="text-xl font-bold text-gray-800">${scientist.nome}</h3>
      <p class="text-gray-600">${scientist.descricao}</p>
    </div>
    <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
             <button onclick="openQuizModal(${
               scientist.id
             }, '${scientist.nome.replace(
      /'/g,
      "\\'"
    )}')" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2">
                <span>Gerenciar Quiz</span>
                       <i class="mdi mdi-text-box-edit-outline text-xl"></i>
         </button>
    <button onclick="openScientistModal(${
      scientist.id
    })" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2">
                <span>Editar</span>
                      <i class="mdi mdi-account-edit-outline text-xl"></i>
 </button>

<button onclick="handleDeleteScientist(${
      scientist.id
    })" class="bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center gap-2">
                <span>Deletar</span>
                <i class="mdi mdi-delete-outline text-xl"></i>
 </button>
</div>
`;
    scientistsList.appendChild(div);
  });
}

const openScientistModal = (id = null) => {
  scientistForm.reset();
  if (id) {
    modalTitle.textContent = "Editar Cientista";
    const scientist = currentScientists.find((s) => s.id === id);
    formScientistId.value = scientist.id;
    document.getElementById("nome").value = scientist.nome;
    document.getElementById("icone_url").value = scientist.icon_url;
    document.getElementById("descricao").value = scientist.descricao;
    document.getElementById("video_url").value = scientist.video_url;
  } else {
    modalTitle.textContent = "Adicionar Nova Cientista";
    formScientistId.value = "";
  }
  scientistModal.style.display = "flex";
};
const closeScientistModal = () => (scientistModal.style.display = "none");

// --- LÓGICA DE DADOS ---
const fetchScientists = async () => {
  showLoading();
  try {
    const { data, error } = await dbClient
      .from("cientistas")
      .select("*")
      .order("id");
    if (error) throw error;
    currentScientists = data;
    renderScientists(currentScientists);
  } catch (error) {
    handleSupabaseError(error, "buscar cientistas");
  } finally {
    hideLoading();
  }
};

const handleSaveScientist = async (event) => {
  event.preventDefault();
  showLoading();
  const id = formScientistId.value;
  const scientistData = {
    nome: document.getElementById("nome").value.trim(),
    icon_url: document.getElementById("icone_url").value.trim(),
    descricao: document.getElementById("descricao").value.trim(),
    video_url: document.getElementById("video_url").value.trim(),
  };

  try {
    if (id) {
      const { error } = await dbClient
        .from("cientistas")
        .update(scientistData)
        .eq("id", id);
      if (error) throw error;
      closeScientistModal();
      await fetchScientists();
    } else {
      const { data, error } = await dbClient
        .from("cientistas")
        .insert(scientistData)
        .select()
        .single();
      if (error) throw error;
      closeScientistModal();
      await fetchScientists();
      openQuizModal(data.id, data.nome);
    }
  } catch (error) {
    handleSupabaseError(error, "salvar cientista");
  } finally {
    hideLoading();
  }
};

const handleDeleteScientist = async (id) => {
  if (
    !confirm(
      "Tem certeza que deseja excluir esta cientista? Isso também excluirá todas as perguntas do quiz associadas a ela."
    )
  )
    return;
  showLoading();
  try {
    const { error } = await dbClient.from("cientistas").delete().eq("id", id);
    if (error) throw error;
    await fetchScientists();
  } catch (error) {
    handleSupabaseError(error, "deletar cientista");
  } finally {
    hideLoading();
  }
};

// --- LÓGICA DO QUIZ ---
const openQuizModal = async (scientistId, scientistName) => {
  quizModalTitle.textContent = `Quiz de ${scientistName}`;
  quizScientistId.value = scientistId;
  resetQuizForm();
  await fetchQuiz(scientistId);
  quizModal.style.display = "flex";
};

const closeQuizModal = () => {
  quizModal.style.display = "none";
  currentQuizQuestions = [];
};

const fetchQuiz = async (scientistId) => {
  showLoading();
  try {
    const { data, error } = await dbClient
      .from("perguntas")
      .select(`*, opcoes(*)`)
      .eq("cientista_id", scientistId)
      .order("id", { foreignTable: "opcoes", ascending: true });
    if (error) throw error;
    currentQuizQuestions = data;
    renderQuiz(data);
  } catch (error) {
    handleSupabaseError(error, "buscar o quiz");
  } finally {
    hideLoading();
  }
};

function renderQuiz(questions) {
  quizQuestionsList.innerHTML = "";
  if (questions.length === 0) {
    quizQuestionsList.innerHTML =
      '<p class="text-gray-500">Nenhuma pergunta cadastrada.</p>';
    return;
  }
  questions.forEach((q) => {
    const div = document.createElement("div");
    div.className =
      "bg-gray-100 p-3 rounded-md flex justify-between items-center";
    div.innerHTML = `
            <span class="truncate">${q.texto_pergunta}</span>
            <div class="flex space-x-2">
                <button onclick="openEditQuestionModal(${q.id})" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 text-sm rounded">Editar</button>
                <button onclick="handleDeleteQuestion(${q.id})" class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 text-sm rounded">Excluir</button>
            </div>
        `;
    quizQuestionsList.appendChild(div);
  });
}

const openEditQuestionModal = (questionId) => {
  const question = currentQuizQuestions.find((q) => q.id === questionId);
  if (!question) return;

  resetQuizForm();
  quizFormTitle.textContent = "Editar Pergunta";
  quizSubmitButton.textContent = "Salvar Alterações";
  quizSubmitButton.classList.replace("bg-green-500", "bg-blue-500");
  quizSubmitButton.classList.replace("hover:bg-green-700", "hover:bg-blue-700");

  editingQuestionIdInput.value = question.id;
  document.getElementById("texto_pergunta").value = question.texto_pergunta;

  generateOptionsInputs(question.opcoes);
  quizForm.scrollIntoView({ behavior: "smooth" });
};

function generateOptionsInputs(options = null) {
  quizOptionsContainer.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const optionData = options ? options[i] : null;
    const optionId = optionData ? optionData.id : "";
    const optionText = optionData ? optionData.texto_opcao : "";
    const isCorrect = optionData ? optionData.e_correta : i === 0;

    const div = document.createElement("div");
    div.innerHTML = `
            <label class="block text-gray-700">Opção ${i + 1}</label>
            <div class="flex items-center">
                 <input type="radio" name="opcao_correta" value="${i}" class="mr-2" ${
      isCorrect ? "checked" : ""
    } required>
                 <input type="text" name="opcao" class="modal-input w-full" value="${optionText}" data-option-id="${optionId}" required>
            </div>
        `;
    quizOptionsContainer.appendChild(div);
  }
}

function resetQuizForm() {
  quizForm.reset();
  quizFormTitle.textContent = "Adicionar Nova Pergunta";
  quizSubmitButton.textContent = "Adicionar Pergunta";
  quizSubmitButton.classList.replace("bg-blue-500", "bg-green-500");
  quizSubmitButton.classList.replace("hover:bg-blue-700", "hover:bg-green-700");
  editingQuestionIdInput.value = "";
  generateOptionsInputs();
}

const handleSaveQuestion = async (event) => {
  event.preventDefault();
  showLoading();

  const scientistId = parseInt(quizScientistId.value, 10);
  const editingQuestionId = editingQuestionIdInput.value
    ? parseInt(editingQuestionIdInput.value, 10)
    : null;
  const textoPergunta = document.getElementById("texto_pergunta").value.trim();
  const opcoesInputs = document.querySelectorAll('input[name="opcao"]');
  const opcaoCorretaIndex = parseInt(
    document.querySelector('input[name="opcao_correta"]:checked').value,
    10
  );

  try {
    if (editingQuestionId) {
      // --- LÓGICA DE ATUALIZAÇÃO ---
      const { error: updateError } = await dbClient
        .from("perguntas")
        .update({ texto_pergunta: textoPergunta })
        .eq("id", editingQuestionId);
      if (updateError) throw updateError;

      // *** A CORREÇÃO ESTÁ AQUI ***
      // Ao atualizar, precisamos de incluir o 'pergunta_id' em cada opção.
      const opcoesParaAtualizar = Array.from(opcoesInputs).map(
        (input, index) => ({
          id: parseInt(input.dataset.optionId, 10),
          pergunta_id: editingQuestionId, // <--- Esta linha foi adicionada
          texto_opcao: input.value.trim(),
          e_correta: index === opcaoCorretaIndex,
        })
      );

      // Usamos 'upsert' para atualizar as opções existentes.
      const { error: optionsError } = await dbClient
        .from("opcoes")
        .upsert(opcoesParaAtualizar);
      if (optionsError) throw optionsError;
    } else {
      // --- LÓGICA DE CRIAÇÃO (existente) ---
      const { data: perguntaData, error: perguntaError } = await dbClient
        .from("perguntas")
        .insert({ texto_pergunta: textoPergunta, cientista_id: scientistId })
        .select()
        .single();
      if (perguntaError) throw perguntaError;

      const opcoesParaInserir = Array.from(opcoesInputs).map(
        (input, index) => ({
          pergunta_id: perguntaData.id,
          texto_opcao: input.value.trim(),
          e_correta: index === opcaoCorretaIndex,
        })
      );
      const { error: opcoesError } = await dbClient
        .from("opcoes")
        .insert(opcoesParaInserir);
      if (opcoesError) throw opcoesError;
    }
    resetQuizForm();
    await fetchQuiz(scientistId);
  } catch (error) {
    handleSupabaseError(error, "salvar a pergunta");
  } finally {
    hideLoading();
  }
};

const handleDeleteQuestion = async (questionId) => {
  if (
    !confirm(
      "Tem certeza que deseja excluir esta pergunta e todas as suas opções?"
    )
  )
    return;
  showLoading();
  try {
    const { error } = await dbClient
      .from("perguntas")
      .delete()
      .eq("id", questionId);
    if (error) throw error;
    await fetchQuiz(quizScientistId.value);
  } catch (error) {
    handleSupabaseError(error, "deletar a pergunta");
  } finally {
    hideLoading();
  }
};

// --- LÓGICA DE LOGIN E INICIALIZAÇÃO ---
async function handleLogin(event) {
  event.preventDefault();
  showLoading();
  const email = event.target.email.value;
  const password = event.target.password.value;
  try {
    const { error } = await dbClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  } catch (error) {
    alert(error.message);
  } finally {
    hideLoading();
  }
}

const handleLogout = async () => {
  showLoading();
  await dbClient.auth.signOut();
  hideLoading();
};

document.addEventListener("DOMContentLoaded", () => {
  loginSection.querySelector("form").addEventListener("submit", handleLogin);
  logoutButton.addEventListener("click", handleLogout);
  addScientistButton.addEventListener("click", () => openScientistModal());
  closeModalButton.addEventListener("click", closeScientistModal);
  scientistForm.addEventListener("submit", handleSaveScientist);
  closeQuizModalButton.addEventListener("click", closeQuizModal);
  quizForm.addEventListener("submit", handleSaveQuestion);

  dbClient.auth.onAuthStateChange((_event, session) => {
    if (session) {
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
      fetchScientists();
    } else {
      loginSection.style.display = "block";
      dashboardSection.style.display = "none";
    }
  });
});
