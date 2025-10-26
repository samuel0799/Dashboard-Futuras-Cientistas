// --- CONFIGURAÇÃO ---
const SUPABASE_URL = "https://uwnlupxfwqeortbnuinl.supabase.co";
// CORREÇÃO: Havia um erro de digitação ('ı' em vez de '1') na chave original.
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bmx1cHhmd3Flb3J0Ym51aW5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5ODcsImV4cCI6MjA3MTEyNjk4N30.sugSUyCfWkJQzuGbfbjgHqmv-nAQMqqD9-t-giohquw";
const { createClient } = supabase;
const dbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET_NAME = 'icones_cientistas';

// --- ELEMENTOS DO DOM ---
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const logoutButton = document.getElementById("logoutButton");
const scientistsList = document.getElementById("scientistsList");
const loadingIndicator = document.getElementById("loadingIndicator");
const addScientistButton = document.getElementById("addScientistButton");
const searchBar = document.getElementById("searchBar");

const scientistModal = document.getElementById("scientistModal");
const scientistForm = document.getElementById("scientistForm");
const modalTitle = document.getElementById("modalTitle");
const formScientistId = document.getElementById("scientistId");
const currentIconPathInput = document.getElementById("currentIconPath"); // Input hidden para path atual
const iconFileInput = document.getElementById("icone_file");         // Input para upload
const iconPreview = document.getElementById("icone_preview");       // Imagem de preview
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

function renderScientists(scientistsToRender) {
  scientistsList.innerHTML = "";
  if (!scientistsToRender || scientistsToRender.length === 0) {
    scientistsList.innerHTML =
      '<p class="text-white text-center">Nenhuma cientista encontrada.</p>'; // Texto branco
    return;
  }
  scientistsToRender.forEach((scientist) => {
    const div = document.createElement("div");
    div.className =
      "bg-white p-4 rounded-lg shadow-md flex justify-between items-center";

    // Constrói a URL pública completa da imagem a partir do path guardado
    const imageUrl = scientist.icon_url
        ? `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${scientist.icon_url}`
        : './images/placeholder.png'; // Use um placeholder local se não houver imagem

    div.innerHTML = `
            <div class="flex items-center space-x-4 flex-1 min-w-0"> {/* Garante que o conteúdo não transborde */}
                 <img src="${imageUrl}" alt="Ícone de ${scientist.nome}" class="h-16 w-16 rounded-full object-cover border-2 border-gray-300 flex-shrink-0">
                 <div class="min-w-0"> {/* Permite que o texto quebre */}
                    <h3 class="text-xl font-bold text-gray-800 truncate">${scientist.nome}</h3>
                    <p class="text-gray-600 truncate">${scientist.descricao}</p>
                 </div>
            </div>
            <div class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 flex-shrink-0 ml-4"> {/* Evita que os botões encolham */}
                <button onclick="openQuizModal(${scientist.id}, '${scientist.nome.replace(/'/g, "\\'")}')" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm md:text-base">Quiz</button>
                <button onclick="openScientistModal(${scientist.id})" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm md:text-base">Editar</button>
                <button onclick="handleDeleteScientist(${scientist.id})" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm md:text-base">Deletar</button>
            </div>
        `;
    scientistsList.appendChild(div);
  });
}

const openScientistModal = (id = null) => {
  scientistForm.reset(); // Limpa todos os campos
  iconPreview.src = '';    // Limpa URL do preview
  iconPreview.classList.add('hidden'); // Esconde preview
  currentIconPathInput.value = ''; // Limpa path guardado

  if (id) {
    modalTitle.textContent = "Editar Cientista";
    const scientist = currentScientists.find((s) => s.id === id);
    if (!scientist) return; // Segurança extra

    formScientistId.value = scientist.id;
    document.getElementById("nome").value = scientist.nome;
    // Guarda o CAMINHO relativo do ícone atual
    currentIconPathInput.value = scientist.icon_url || '';
    document.getElementById("descricao").value = scientist.descricao;
    document.getElementById("video_url").value = scientist.video_url;

    // Mostra a imagem atual no preview, se existir
    if (scientist.icon_url) {
      iconPreview.src = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${scientist.icon_url}`;
      iconPreview.classList.remove('hidden');
    }

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
    currentScientists = data || []; // Garante que é sempre um array
    displayedScientists = currentScientists; // Inicialmente mostra todas
    renderScientists(displayedScientists);
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
    const currentIconPath = currentIconPathInput.value;
    const file = iconFileInput.files[0];

    let iconPath = currentIconPath; // Assume path atual por defeito

    try {
        // 1. Upload do novo ficheiro (se existir)
        if (file) {
            console.log("Ficheiro selecionado, a fazer upload...");
            // Gera nome único para evitar conflitos e caracteres inválidos
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const filePath = `${fileName}`; // Guarda na raiz do bucket

            const { data: uploadData, error: uploadError } = await dbClient.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                    cacheControl: '3600', // Cache por 1 hora
                    upsert: false // Não sobrescreve ficheiros com o mesmo nome
                });

            if (uploadError) {
                // Trata erros comuns de upload (ex: nome duplicado se upsert=false)
                if (uploadError.message.includes('duplicate key value violates unique constraint')) {
                     throw new Error(`Erro: Já existe um ficheiro com nome parecido. Renomeie o ficheiro e tente novamente. Detalhes: ${uploadError.message}`);
                }
                throw uploadError;
            }
            
            iconPath = uploadData.path; // Guarda o CAMINHO retornado pelo Supabase
            console.log("Upload bem-sucedido. Novo path:", iconPath);

            // 2. Apagar ficheiro antigo (APENAS se estiver a EDITAR e um NOVO foi enviado E existia um antigo)
            if (id && currentIconPath && currentIconPath !== iconPath) {
                console.log(`A apagar ícone antigo: ${currentIconPath}`);
                const { error: deleteError } = await dbClient.storage
                    .from(BUCKET_NAME)
                    .remove([currentIconPath]);
                if (deleteError) {
                    // Apenas avisa, não impede o resto da operação
                    console.warn("Aviso: Falha ao apagar o ícone antigo.", deleteError);
                } else {
                    console.log("Ícone antigo apagado.");
                }
            }
        } else {
            console.log("Nenhum ficheiro novo selecionado.");
        }

        // 3. Preparar dados para o banco (usando o iconPath correto)
        const scientistData = {
            nome: document.getElementById("nome").value.trim(),
            // Guarda o CAMINHO relativo, ou null se não houver imagem
            icon_url: iconPath || null, 
            descricao: document.getElementById("descricao").value.trim(),
            video_url: document.getElementById("video_url").value.trim(),
        };
        
        // Validação básica
        if (!scientistData.nome || !scientistData.descricao || !scientistData.video_url) {
            throw new Error("Nome, Descrição e URL do Vídeo são obrigatórios.");
        }
        if (!id && !scientistData.icon_url) { // Exige imagem ao criar
             throw new Error("O Ícone é obrigatório ao adicionar uma nova cientista.");
        }


        // 4. Salvar/Atualizar na tabela 'cientistas'
        if (id) {
            console.log("A atualizar cientista ID:", id);
            const { error } = await dbClient
                .from("cientistas")
                .update(scientistData)
                .eq("id", id);
            if (error) throw error;
            console.log("Cientista atualizada com sucesso.");
        } else {
            console.log("A criar nova cientista...");
            const { data, error } = await dbClient
                .from("cientistas")
                .insert(scientistData)
                .select()
                .single();
            if (error) throw error;
            console.log("Nova cientista criada:", data);
            // Fecha o modal e abre o quiz APENAS após sucesso
            closeScientistModal();
            await fetchScientists();
            openQuizModal(data.id, data.nome);
            hideLoading(); // Esconde o loading aqui para não fechar o modal do quiz
            return; // Sai da função para não fechar o modal do quiz no finally
        }

        // Fecha o modal e atualiza a lista (para edição)
        closeScientistModal();
        await fetchScientists();

    } catch (error) {
        handleSupabaseError(error, "salvar cientista (com upload)");
    } finally {
        // Garante que o input de ficheiro é limpo
        iconFileInput.value = ''; 
        // Garante que o loading é escondido (exceto no caso de sucesso ao criar)
        if (!id) { /* não faz nada se criou */ } else { hideLoading();}
    }
};

const handleDeleteScientist = async (id) => {
  const scientistToDelete = currentScientists.find(s => s.id === id);
  if (!scientistToDelete) {
      console.error("Cientista não encontrada para deletar:", id);
      return;
  }

  if (!confirm(`Tem certeza que deseja excluir "${scientistToDelete.nome}"? Isso também excluirá o quiz e o ícone associado.`)) return;
  
  showLoading();
  try {
      // 1. Apaga a entrada da tabela 'cientistas'
      // A deleção em cascata configurada no DB deve apagar perguntas/opções
      const { error: dbError } = await dbClient.from("cientistas").delete().eq("id", id);
      if (dbError) throw dbError;
      console.log("Registo da cientista apagado do DB.");

      // 2. Apaga o ficheiro do ícone no Storage (se existir)
      if (scientistToDelete.icon_url) {
          console.log(`A apagar ícone do Storage: ${scientistToDelete.icon_url}`);
          const { error: storageError } = await dbClient.storage
              .from(BUCKET_NAME)
              .remove([scientistToDelete.icon_url]);
          // Apenas avisa sobre o erro, não impede a atualização da UI
          if (storageError) console.warn("Aviso: Falha ao apagar o ficheiro do ícone.", storageError);
          else console.log("Ficheiro do ícone apagado do Storage.");
      }

      // 3. Atualiza a lista na UI
      await fetchScientists(); // Busca a lista atualizada do DB
  } catch (error) {
      handleSupabaseError(error, "deletar cientista (e ícone)");
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

if (iconFileInput) {
    iconFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) { // Verifica se é uma imagem
            const reader = new FileReader();
            reader.onload = (e) => {
                iconPreview.src = e.target.result;
                iconPreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
        } else {
            // Limpa se não for imagem ou se o ficheiro for desmarcado
            iconPreview.src = '';
            iconPreview.classList.add('hidden');
            if (file) alert("Por favor, selecione um ficheiro de imagem válido (png, jpg, webp).");
            iconFileInput.value = ''; // Limpa o input se inválido
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
  loginSection.querySelector("form").addEventListener("submit", handleLogin);
  logoutButton.addEventListener("click", handleLogout);
  addScientistButton.addEventListener("click", () => openScientistModal());
  closeModalButton.addEventListener("click", closeScientistModal);
  scientistForm.addEventListener("submit", handleSaveScientist);
  closeQuizModalButton.addEventListener("click", closeQuizModal);
  quizForm.addEventListener("submit", handleSaveQuestion);
  searchBar.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    const filteredScientists = currentScientists.filter((scientist) => {
      return scientist.nome.toLowerCase().includes(searchTerm);
    });
    renderScientists(filteredScientists);
  });

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
