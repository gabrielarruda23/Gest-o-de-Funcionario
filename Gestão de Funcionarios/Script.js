class Funcionario {
  static nextId = Number(localStorage.getItem('func_nextId') || 1);

  constructor(nome, idade, cargo, salario, id = null) {
    this._id = id ?? Funcionario.nextId++;
    this._nome = nome;
    this._idade = Number(idade);
    this._cargo = cargo;
    this._salario = Number(salario);
  }

  get id() { return this._id; }
  get nome() { return this._nome; }
  set nome(v) { this._nome = v; }

  get idade() { return this._idade; }
  set idade(v) { this._idade = Number(v); }

  get cargo() { return this._cargo; }
  set cargo(v) { this._cargo = v; }

  get salario() { return this._salario; }
  set salario(v) { this._salario = Number(v); }

  toString() {
    return `#${this._id} - ${this._nome} (${this._cargo}) R$ ${this._salario.toFixed(2)}`;
  }

  toJSON() {
    return { id: this._id, nome: this._nome, idade: this._idade, cargo: this._cargo, salario: this._salario };
  }
}

const state = {
  funcionarios: [],
};

const STORAGE_KEY = 'devstartup_funcionarios';

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.funcionarios.map(f => f.toJSON())));
  localStorage.setItem('func_nextId', String(Funcionario.nextId));
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const arr = JSON.parse(raw);
    state.funcionarios = arr.map(a => new Funcionario(a.nome, a.idade, a.cargo, a.salario, a.id));
    const maxId = state.funcionarios.reduce((m, f) => Math.max(m, f.id), 0);
    Funcionario.nextId = Math.max(Funcionario.nextId, maxId + 1);
  } catch(e) {
    console.error('Falha ao carregar estado:', e);
  }
};

const q = sel => document.querySelector(sel);

const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

const renderTable = (filterText = '') => {
  const tbody = q('#tableBody');
  tbody.innerHTML = '';
  const filtro = filterText.trim().toLowerCase();

  const filtered = state.funcionarios.filter(f => !filtro || f.nome.toLowerCase().includes(filtro) || f.cargo.toLowerCase().includes(filtro));

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-500">Nenhum funcionário encontrado.</td></tr>';
    return;
  }

  filtered.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2">${f.id}</td>
      <td class="p-2 font-medium">${esc(f.nome)}</td>
      <td class="p-2">${f.idade}</td>
      <td class="p-2">${esc(f.cargo)}</td>
      <td class="p-2">R$ ${f.salario.toFixed(2)}</td>
      <td class="p-2">
        <div class="flex gap-2">
          <button class="editar px-2 py-1 rounded-md border text-sm">Editar</button>
          <button class="excluir px-2 py-1 rounded-md border text-sm">Excluir</button>
        </div>
      </td>
    `;

    tr.querySelector('.editar').onclick = () => carregarParaEdicao(f.id);
    tr.querySelector('.excluir').onclick = () => { if(confirm(`Deseja excluir ${f.nome}?`)) removerFuncionario(f.id); };

    tbody.appendChild(tr);
  });
};

const cadastrarFuncionario = (nome, idade, cargo, salario) => {
  const f = new Funcionario(nome, idade, cargo, salario);
  state.funcionarios.push(f);
  saveState();
  renderTable(q('#buscar').value);
  return f;
};

const atualizarFuncionario = (id, dados) => {
  const f = state.funcionarios.find(x => x.id === id);
  if (!f) return null;
  f.nome = dados.nome;
  f.idade = dados.idade;
  f.cargo = dados.cargo;
  f.salario = dados.salario;
  saveState();
  renderTable(q('#buscar').value);
  return f;
};

const removerFuncionario = id => {
  state.funcionarios = state.funcionarios.filter(x => x.id !== id);
  saveState();
  renderTable(q('#buscar').value);
};

const carregarParaEdicao = id => {
  const f = state.funcionarios.find(x => x.id === id);
  if (!f) return;
  q('#funcId').value = f.id;
  q('#nome').value = f.nome;
  q('#idade').value = f.idade;
  q('#cargo').value = f.cargo;
  q('#salario').value = f.salario;
  q('#btnCadastrar').textContent = 'Atualizar';
};

const limparFormulario = () => {
  q('#formFuncionario').reset();
  q('#funcId').value = '';
  q('#btnCadastrar').textContent = 'Cadastrar';
};

q('#formFuncionario').addEventListener('submit', ev => {
  ev.preventDefault();
  const idVal = q('#funcId').value;
  const dados = {
    nome: q('#nome').value.trim(),
    idade: Number(q('#idade').value),
    cargo: q('#cargo').value.trim(),
    salario: Number(q('#salario').value),
  };

  if (idVal) {
    atualizarFuncionario(Number(idVal), dados);
    alert('Funcionário atualizado com sucesso!');
  } else {
    cadastrarFuncionario(dados.nome, dados.idade, dados.cargo, dados.salario);
    alert('Funcionário cadastrado com sucesso!');
  }

  limparFormulario();
});

q('#btnLimpar').addEventListener('click', limparFormulario);
q('#buscar').addEventListener('input', e => renderTable(e.target.value));

q('#btnExport').addEventListener('click', () => {
  const rows = [['id','nome','idade','cargo','salario'], ...state.funcionarios.map(f => [f.id,f.nome,f.idade,f.cargo,f.salario])];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'funcionarios.csv';
  a.click();
  URL.revokeObjectURL(url);
});

q('#relAlta').addEventListener('click', () => {
  const altos = state.funcionarios.filter(f => f.salario > 5000);
  q('#relOutput').innerHTML = altos.length === 0 ? 'Nenhum funcionário com salário > R$ 5000.' : `<strong>Salários &gt; R$ 5000:</strong><ul>${altos.map(a=>`<li>${esc(a.toString())}</li>`).join('')}</ul>`;
});

q('#relMedia').addEventListener('click', () => {
  if(state.funcionarios.length === 0){ q('#relOutput').textContent = 'Nenhum funcionário cadastrado.'; return; }
  const media = state.funcionarios.reduce((acc,f)=>acc+f.salario,0)/state.funcionarios.length;
  q('#relOutput').innerHTML = `<strong>Média salarial:</strong> R$ ${media.toFixed(2)} (com base em ${state.funcionarios.length} funcionário(s))`;
});

q('#relCargos').addEventListener('click', () => {
  const cargosUnicos = [...new Set(state.funcionarios.map(f=>f.cargo))];
  q('#relOutput').innerHTML = cargosUnicos.length===0 ? 'Nenhum cargo encontrado.' : `<strong>Cargos únicos:</strong><ul>${cargosUnicos.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`;
});

q('#relMaius').addEventListener('click', () => {
  const nomesUpper = state.funcionarios.map(f=>f.nome.toUpperCase());
  q('#relOutput').innerHTML = nomesUpper.length===0 ? 'Nenhum funcionário cadastrado.' : `<strong>Nomes em maiúsculo:</strong><ul>${nomesUpper.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`;
});

loadState();
renderTable();
window.addEventListener('beforeunload', saveState);

const buscarPorId = id => state.funcionarios.find(f=>f.id===id);
window.__app={state,Funcionario,cadastrarFuncionario,atualizarFuncionario,removerFuncionario,buscarPorId};
