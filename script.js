/* ------------------ Helpers & Seed ------------------ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key, fallback){ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }

// Função auxiliar para salvar a empresa
function saveVendor(vendor){
  const vendors = load('saqua.vendors', []).map(v => v.id === vendor.id ? vendor : v);
  save('saqua.vendors', vendors);
}

function seedInitialData(){
  if(!localStorage.getItem('saqua.initialized')){
    const vendors = [
      { id:'v1', name:'Mercadão Central', description:'Produtos frescos, entregas rápidas', category:'Mercado', address:'Rua A, 123', whatsapp:'+5511999991111', avatarDataUrl:'', products:[
         {id:uid(), title:'Arroz 5kg', desc:'Arroz comb. 5kg', price:'R$24,90', image:''},
         {id:uid(), title:'Cerveja 350ml', desc:'Lata gelada', price:'R$4,50', image:''}
      ], workingHours:'08:00 - 21:00', featured:true },
      { id:'v2', name:'Sushix', description:'Sushi premium e combos', category:'Comida', address:'Av. B, 45', whatsapp:'+5511988882222', avatarDataUrl:'', products:[
         {id:uid(), title:'Combo 8 peças', desc:'Salmão + atum', price:'R$49,90', image:''}
      ], workingHours:'11:30 - 23:00', featured:false },
    ];
    const users = [
      {id:'u_admin', role:'admin', username:'admin', password:'admin123'},
      {id:'u_client', role:'client', username:'cliente', password:'cliente123'},
      {id:'u_v1', role:'vendor', username:'vendedor1', password:'senha123', vendorId:'v1'}
    ];
    const posts = [
      {id:uid(), vendorId:'v1', title:'Promoção de Arroz', description:'Arroz 5kg por R$19,90 só hoje!', mediaDataUrl:'', linkSaibaMais:'https://exemplo.com/promo-arroz', createdAt:Date.now(), createdBy:'admin'},
      {id:uid(), vendorId:'v2', title:'Novo combo sushi', description:'Combo especial com 10 peças', mediaDataUrl:'', createdAt:Date.now() - 1000*60*60*24, createdBy:'vendor'}
    ];
    save('saqua.vendors', vendors);
    save('saqua.users', users);
    save('saqua.posts', posts);
    localStorage.setItem('saqua.initialized','1');
  }
}

/* Small helpers */
function svgPlaceholder(){
  return `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%' height='100%' fill='#f3f5f7'/><text x='50%' y='50%' fill='#9aa6b2' font-size='18' dominant-baseline='middle' text-anchor='middle'>Imagem</text></svg>`;
}
function escapeHTML(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function buildWhatsAppUrl(number, text){
  const num = (number||'').replace(/\D/g,'');
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
function openModal(renderFn){
  const modalBack = document.getElementById('modalBack');
  const modalContent = document.getElementById('modalContent');
  if(!modalBack || !modalContent) return;
  modalBack.style.display = 'flex';
  modalContent.innerHTML = '';
  renderFn(modalContent);
}
function closeModal(){ 
  const modalBack = document.getElementById('modalBack');
  const modalContent = document.getElementById('modalContent');
  if(modalBack) modalBack.style.display = 'none'; 
  if(modalContent) modalContent.innerHTML = ''; 
}

/* ------------------ STATE (Persistência com localStorage) ------------------ */
let STATE = { currentUser: load('saqua.currentUser', null) };

/* ------------------ AUTH - CORREÇÃO CRÍTICA PARA PERSISTÊNCIA ------------------ */
function login(username, password){
  const users = load('saqua.users', []);
  const u = users.find(x => x.username === username && x.password === password);
  if(u){
    // PERSISTE O ESTADO NO LOCALSTORAGE
    save('saqua.currentUser', u);
    // ATUALIZA O ESTADO LOCAL
    STATE.currentUser = {...u};
    
    // Tenta renderizar se o elemento existir (útil no home.html)
    if(document.getElementById('currentUser')) renderTop();
    
    // ✅ AJUSTE 1: Redireciona para home.html se estiver na página de login (index.html)
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if(isLoginPage){
        window.location.href = 'home.html';
    }

    return true;
  }
  return false;
}


  /**
 * CORREÇÃO APLICADA AQUI: Garante que o usuário seja redirecionado para login.html
 * a menos que já esteja na página de login.
 */
function logout(){
  // REMOVE O ESTADO DO LOCALSTORAGE
  localStorage.removeItem('saqua.currentUser');
  // ATUALIZA O ESTADO LOCAL
  STATE.currentUser = null;
  
  // Tenta limpar o hash da URL se houver algum estado de rota
  if(window.location.hash) {
    window.location.hash = '';
  }

  // ✅ AJUSTE: Redireciona para 'index.html' (que agora é o seu login), a menos que já esteja nela
  if(!window.location.pathname.endsWith('index.html')){
    window.location.href = 'index.html';
  } else {
    // Se já está em index.html, apenas re-renderiza o topo/interface de login
    if(document.getElementById('currentUser')) renderTop(); 
  }
}

/* ------------------ Funções do Modal de Login Restrito (Admin/Vendedor) ------------------ */
function renderRestrictedLoginModal(modal, role){
  const modalTitle = role === 'vendor' ? 'Acesso Vendedor' : 'Acesso Admin';
  const placeholderUser = role === 'vendor' ? 'vendedor1' : 'admin';
  const placeholderPass = role === 'vendor' ? 'senha123' : 'admin123';
  
  modal.innerHTML = `
    <h3>${modalTitle}</h3>
    <p class="muted">Acesso restrito. Credenciais fornecidas pelo administrador.</p>
    <label>Usuário</label><input id="login_restricted_username" value="${placeholderUser}" />
    <label>Senha</label><input type="password" id="login_restricted_password" value="${placeholderPass}" />
    <div class="right-align">
      <button class="ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn" id="btn_do_login_restricted">Entrar</button>
    </div>
  `;

  modal.querySelector('#btn_do_login_restricted').onclick = () => {
    const username = modal.querySelector('#login_restricted_username').value.trim();
    const password = modal.querySelector('#login_restricted_password').value;

    if(login(username, password)){
      if(STATE.currentUser.role === role){
        closeModal();
        // ✅ AJUSTE 2: Redireciona para 'home.html' (a nova página principal)
        window.location.href = 'home.html'; 
      } else {
        alert(`Usuário encontrado, mas não é ${role.toUpperCase()}.`);
        logout(); 
      }
    } else {
      alert('Falha no login. Verifique seu usuário e senha.');
    }
  };
}

/* ------------------ Funções de Cadastro de Cliente ------------------ */
function renderRegisterClientModal(modal){
  modal.innerHTML = `
    <h3>Cadastro de Novo Cliente</h3>
    <p class="muted">Crie seu usuário e senha. O acesso é imediato após o cadastro.</p>
    <label>Nome de Usuário</label><input id="reg_username" placeholder="Seu nome de usuário (ex: joao123)"/>
    <label>Senha</label><input type="password" id="reg_password" placeholder="Mínimo 4 caracteres"/>
    <div class="right-align">
      <button class="ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn" id="btn_do_register">Cadastrar e Entrar</button>
    </div>
  `;

  modal.querySelector('#btn_do_register').onclick = () => {
    const username = modal.querySelector('#reg_username').value.trim();
    const password = modal.querySelector('#reg_password').value;

    if(username.length < 3 || password.length < 4){
      alert('Usuário deve ter 3+ caracteres e senha 4+ caracteres.');
      return;
    }

    const users = load('saqua.users', []);
    if(users.some(u => u.username === username)){
      alert('Este nome de usuário já está em uso.');
      return;
    }
    
    // Cadastra e loga
    users.push({ id: uid(), role: 'client', username, password });
    save('saqua.users', users);

    if(login(username, password)){
      closeModal();
      // ✅ AJUSTE 3: Redireciona para 'home.html' (a nova página principal)
      window.location.href = 'home.html'; 
    } else {
      alert('Erro ao finalizar login. Tente novamente.');
    }
  };
}

/* ------------------ Render top & sidebar actions (AJUSTE NO INDEX.HTML) ------------------ */
function renderTop(){
    const el = document.getElementById('currentUser');
    const logoutBtn = document.getElementById('btn-logout'); // Captura o botão

    // Se não estiver logado, redireciona (OBS: o redirecionamento principal ocorre no login/logout)
    if(!STATE.currentUser){
        if(el) el.textContent = 'Visitante';
        if(logoutBtn) logoutBtn.style.display = 'none'; // Usa a variável capturada
        return; 
    }
    
    // Se estiver logado:
    if(el) el.textContent = `${STATE.currentUser.role.toUpperCase()}: ${STATE.currentUser.username}`;
    
    // CORREÇÃO CRÍTICA AQUI: 
    if(logoutBtn) {
        logoutBtn.style.display = 'inline-block';
        // ADICIONE ISTO: Conecta o botão de logout à função logout()
        logoutBtn.onclick = logout; 
    }
    // Fim da correção
    
    renderSidebarActions();
    renderFeed();
}

// ... O restante das funções do seu script.js segue abaixo, pois já estavam no snippet fornecido.

/* ------------------ Funções que já existiam - Movidas para o final para organizar ------------------ */

function renderSidebarActions(){
  const box = document.getElementById('sidebar-actions');
  box.innerHTML = '';
  if(STATE.currentUser && STATE.currentUser.role === 'admin'){
    box.innerHTML = `
      <strong>Painel Admin</strong>
      <div style="margin-top:8px" class="muted">
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="ghost" id="btn-admin-create-vendor">Cadastrar vendedor</button>
          <button class="ghost" id="btn-admin-list">Listar empresas</button>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn" id="btn-admin-create-post">Criar anúncio</button>
        </div>
      </div>
    `;
    box.querySelector('#btn-admin-create-vendor').onclick = () => openModal(renderAdminCreateVendor);
    box.querySelector('#btn-admin-list').onclick = () => openModal(renderAdminListVendors);
    box.querySelector('#btn-admin-create-post').onclick = () => openModal(renderAdminCreatePost);
  } else if (STATE.currentUser && STATE.currentUser.role === 'vendor'){
    box.innerHTML = `
      <strong>Painel Vendedor</strong>
      <div style="margin-top:8px" class="muted">
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
          <button class="ghost" id="btn-vendor-products">Meus produtos</button>
          <button class="ghost" id="btn-vendor-add-product">Adicionar produto</button>
          <button class="ghost" id="btn-vendor-my-posts">Meus anúncios (feed)</button>
          <button class="ghost" id="btn-vendor-edit-profile">Editar perfil</button>
        </div>
      </div>
    `;
    box.querySelector('#btn-vendor-products').onclick = () => openModal(modal => renderVendorProductsModal(modal));
    box.querySelector('#btn-vendor-add-product').onclick = () => openModal(modal => renderVendorAddProductModal(modal));
    box.querySelector('#btn-vendor-edit-profile').onclick = () => openModal(modal => renderVendorProfileModal(modal));
    box.querySelector('#btn-vendor-my-posts').onclick = () => {
      renderFeed();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  } else {
    box.innerHTML = `<div class="muted">Faça login como admin ou vendedor para ver ações administrativas.</div>`;
  }
}


/* ------------------ Vendor: Adicionar Produto (NOVO/CORRIGIDO) ------------------ */
function renderVendorAddProductModal(modal){
  const vendor = load('saqua.vendors', []).find(v => v.id === STATE.currentUser.vendorId);
  if(!vendor){ modal.innerHTML = `<p>Empresa não encontrada.</p>`; return; }

  modal.innerHTML = `<h3>Adicionar Novo Produto</h3>
    <label>Nome do Produto</label><input id="prod_title" />
    <label>Descrição</label><textarea id="prod_desc"></textarea>
    <label>Preço (Ex: R$19,90)</label><input id="prod_price" />
    <label>Imagem (opcional)</label><input type="file" id="prod_image" accept="image/*" />
    <div class="right-align">
      <button class="ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn" id="prod_save">Salvar Produto</button>
    </div>`;

  modal.querySelector('#prod_save').onclick = async () => {
    const title = modal.querySelector('#prod_title').value.trim();
    const desc = modal.querySelector('#prod_desc').value.trim();
    const price = modal.querySelector('#prod_price').value.trim();
    const fileInput = modal.querySelector('#prod_image');

    if(!title || !price){ alert('Título e Preço são obrigatórios.'); return; }

    let imageDataUrl = '';
    if(fileInput.files && fileInput.files[0]){
      imageDataUrl = await new Promise(res=>{
        const reader = new FileReader();
        reader.onload = e=>res(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
    }

    vendor.products.push({ id: uid(), title, desc, price, image: imageDataUrl });
    saveVendor(vendor);
    closeModal();
    alert('Produto adicionado com sucesso!');
    renderFeed(); // Atualiza o feed
  };
}

/* ------------------ Vendor: Meus Produtos (NOVO/CORRIGIDO) ------------------ */
function renderVendorProductsModal(modal){
  const vendor = load('saqua.vendors', []).find(v => v.id === STATE.currentUser.vendorId);
  if(!vendor){ modal.innerHTML = `<p>Empresa não encontrada.</p>`; return; }

  const productsList = vendor.products;

  modal.innerHTML = `<h3>Meus Produtos (${productsList.length})</h3>
    <div id="vendor_products_list" style="max-height:400px; overflow:auto; display:flex; flex-direction:column; gap:8px;">
      ${productsList.length === 0 ? '<p class="muted">Você ainda não tem produtos cadastrados.</p>' : ''}
    </div>
    <div class="right-align">
      <button class="ghost" onclick="closeModal()">Fechar</button>
      <button class="btn" id="btn-add-product-modal">Adicionar Produto</button>
    </div>`;

  const listEl = modal.querySelector('#vendor_products_list');

  productsList.forEach(prod => {
    const pEl = document.createElement('div');
    pEl.className = 'product';
    pEl.style.border = '1px solid var(--border)';
    pEl.style.padding = '8px';
    pEl.style.borderRadius = '10px';
    pEl.style.display = 'flex';
    pEl.style.alignItems = 'center';
    pEl.innerHTML = `
      <img src="${prod.image || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="" style="width:60px;height:40px;object-fit:cover;border-radius:6px">
      <div style="flex:1; margin-left:12px">
        <strong>${escapeHTML(prod.title)}</strong>
        <div class="muted" style="font-size:13px">${escapeHTML(prod.price)}</div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="ghost" data-delete="${prod.id}">Excluir</button>
      </div>
    `;
    listEl.appendChild(pEl);

    // Adiciona o listener para exclusão
    pEl.querySelector(`[data-delete="${prod.id}"]`).onclick = () => {
      if(confirm(`Tem certeza que deseja excluir o produto "${prod.title}"?`)){
        vendor.products = vendor.products.filter(p => p.id !== prod.id);
        saveVendor(vendor);
        renderVendorProductsModal(modal); // Re-renderiza o modal para refletir a exclusão
        renderFeed(); // Atualiza o feed
      }
    };
  });

  // Listener para botão "Adicionar Produto" dentro deste modal
  modal.querySelector('#btn-add-product-modal').onclick = () => {
    // Fecha o modal atual e abre o modal de adição
    closeModal();
    openModal(renderVendorAddProductModal);
  };
}
/* ------------------ FIM: Funções do Vendedor (Produtos) ------------------ */


/* ------------------ Feed rendering (inclui produtos automáticos) ------------------ */
function renderFeed(){
  // load posts and vendors
  const postsAll = load('saqua.posts', []).slice().sort((a,b) => b.createdAt - a.createdAt);
  const vendors = load('saqua.vendors', []);
  const feedEl = document.getElementById('feedArea');
  // Verifica se está no home.html (nova página principal). Se não, retorna.
  if(!feedEl) return;
  feedEl.innerHTML = '';

  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const cat = (document.getElementById('categoryFilter')?.value || '');

  let posts = postsAll.slice();

  // Adicionar produtos dos vendedores como posts automáticos (apenas se ainda não viraram posts com productId)
  vendors.forEach(v => {
    v.products.forEach(prod => {
      if(!posts.some(p => p.vendorId === v.id && p.productId === prod.id)){
        posts.push({
          id: uid(),
          vendorId: v.id,
          productId: prod.id,
          title: prod.title,
          description: prod.desc + ' • ' + prod.price,
          mediaDataUrl: prod.image,
          createdAt: Date.now(),
          createdBy: 'vendor'
        });
      }
    });
  });

  // Se admin, mostrar um card de atalho para ações
  if(STATE.currentUser && STATE.currentUser.role === 'admin'){
    const adminCard = document.createElement('div');
    adminCard.className = 'card';
    adminCard.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>Painel Admin</strong>
        <div style="display:flex;gap:8px">
          <button class="ghost" id="btn-admin-create-vendor-2">Cadastrar</button>
          <button class="ghost" id="btn-admin-list-2">Listar</button>
          <button class="btn" id="btn-admin-create-post-2">Criar anúncio</button>
        </div>
      </div>
    `;
    feedEl.appendChild(adminCard);
    adminCard.querySelector('#btn-admin-create-vendor-2').onclick = () => openModal(renderAdminCreateVendor);
    adminCard.querySelector('#btn-admin-list-2').onclick = () => openModal(renderAdminListVendors);
    adminCard.querySelector('#btn-admin-create-post-2').onclick = () => openModal(renderAdminCreatePost);
  }

  for(const p of posts.sort((a,b)=>b.createdAt - a.createdAt)){
    const v = vendors.find(x => x.id === p.vendorId) || { name:'Empresa' };
    const combinedText = (p.title + ' ' + p.description + ' ' + v.name + ' ' + (v.category || '')).toLowerCase();
    if(q && !combinedText.includes(q)) continue;
    if(cat && v.category !== cat) continue;

    const postCard = document.createElement('article');
    postCard.className = 'post-card card';

    postCard.innerHTML = `
      <div class="post-top">
        <img class="avatar" src="${v.avatarDataUrl || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="Avatar">
        <div class="post-meta-title">
          <strong>${escapeHTML(v.name)}</strong>
          <span>${escapeHTML(v.category || 'Geral')} • ${new Date(p.createdAt).toLocaleString()}</span>
        </div>
      </div>
      <img class="post-image" src="${p.mediaDataUrl || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="Imagem do post">
      <div class="post-body">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="post-desc">${escapeHTML(p.title)}</div>
          <div class="muted small">${p.duration ? `${p.duration} dia(s)` : ''}</div>
        </div>
        <p class="post-desc">${escapeHTML(p.description)}</p>
        ${p.duration ? `<div class="muted small">Valor estimado: R$${(4*p.duration).toFixed(2)}</div>` : ''}
      </div>
      <div class="post-footer">
        <div class="post-actions">
          <span class="tag-ghost view-profile" style="cursor:pointer">Ver perfil</span>
          ${p.linkSaibaMais && p.createdBy === 'admin' ? `<span class="tag-ghost saiba-mais" style="cursor:pointer">Saiba mais</span>` : ''}
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn contact-btn" data-vendor="${v.id}" data-post="${p.id}">Contatar</button>
          ${STATE.currentUser && STATE.currentUser.role === 'vendor' && STATE.currentUser.vendorId === v.id ? `<button class="ghost" data-edit="${p.id}">Editar</button>` : ''}
          ${STATE.currentUser && STATE.currentUser.role === 'admin' ? `<button class="ghost" data-delete="${p.id}">Excluir</button>` : ''}
        </div>
      </div>
    `;

    feedEl.appendChild(postCard);

    // Actions
    const contactBtn = postCard.querySelector('.contact-btn');
    contactBtn.onclick = (e) => {
      const vid = e.currentTarget.dataset.vendor;
      const vendor = vendors.find(x => x.id === vid);
      if(vendor && vendor.whatsapp){
        window.open(buildWhatsAppUrl(vendor.whatsapp, `Olá ${vendor.name}, vi o anúncio "${p.title}" no Saquabusines.`), '_blank');
      } else alert('WhatsApp não configurado para este estabelecimento.');
    };

    const editBtn = postCard.querySelector('[data-edit]');
    if(editBtn) editBtn.onclick = () => openModal(modal => renderEditPostModal(modal, p));

    const delBtn = postCard.querySelector('[data-delete]');
    if(delBtn) delBtn.onclick = () => {
      if(confirm('Excluir este anúncio?')){
        deletePost(p.id);
        renderFeed();
      }
    };

    // Ver perfil
    const viewProfileBtn = postCard.querySelector('.view-profile');
    if(viewProfileBtn){
      viewProfileBtn.onclick = () => {
        const vendor = vendors.find(x => x.id === p.vendorId);
        if(!vendor){ alert('Empresa não encontrada'); return; }
        openModal(modal => {
          modal.innerHTML = `
            <div style="display:flex;gap:12px;align-items:center">
              <img class="avatar" src="${vendor.avatarDataUrl || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="Avatar" style="width:86px;height:86px;border-radius:14px">
              <div>
                <h3>${escapeHTML(vendor.name)}</h3>
                <div class="muted">${escapeHTML(vendor.category || 'Geral')}</div>
                <div class="muted" style="margin-top:6px">${escapeHTML(vendor.address || '')}</div>
                <div class="muted" style="margin-top:6px">Horário: ${escapeHTML(vendor.workingHours || '')}</div>
              </div>
            </div>
            <p style="margin-top:10px">${escapeHTML(vendor.description || '')}</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">
              ${vendor.products.map(prod => `
                <div style="border:1px solid ${'var(--border)'};padding:8px;border-radius:10px">
                  <img src="${prod.image || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:8px">
                  <div style="margin-top:8px"><strong>${escapeHTML(prod.title)}</strong></div>
                  <div class="muted" style="font-size:13px">${escapeHTML(prod.desc)} • ${escapeHTML(prod.price||'')}</div>
              </div>
            `).join('')}
            </div>
            <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-start">
              ${vendor.whatsapp ? `<button class="btn" id="contactWhatsapp">Contatar via WhatsApp</button>` : ''}
              <button class="ghost" onclick="closeModal()">Fechar</button>
            </div>
          `;
          const btn = modal.querySelector('#contactWhatsapp');
          if(btn) btn.onclick = () => {
            window.open(buildWhatsAppUrl(vendor.whatsapp, `Olá ${vendor.name}, vi sua empresa no Saquabusines.`), '_blank');
          };
        });
      };
    }

    // Saiba mais (only present if admin added link)
    const saibaBtn = postCard.querySelector('.saiba-mais');
    if(saibaBtn){
      saibaBtn.onclick = () => {
        if(p.linkSaibaMais){
          window.open(p.linkSaibaMais, '_blank');
        }
      };
    }
  } // end for posts

  if(feedEl.childNodes.length === 0){
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<div class="muted">Nenhum anúncio encontrado.</div>`;
    feedEl.appendChild(c);
  }
}
/* ------------------ FIM: Feed rendering ------------------ */


// Função deletePost (necessária para os botões de exclusão de posts)
function deletePost(postId){
    let posts = load('saqua.posts', []);
    posts = posts.filter(p => p.id !== postId);
    save('saqua.posts', posts);
}

// Função de edição de post (mock)
function renderEditPostModal(modal, post){
  modal.innerHTML = `<h3>Editar Anúncio (Mock)</h3><p class="muted">Funcionalidade de edição para o post <strong>${escapeHTML(post.title)}</strong></p>
    <div class="right-align"><button class="btn" onclick="closeModal()">Fechar</button></div>`;
}

// Função de Edição de Perfil do Vendedor (existente)
function renderVendorProfileModal(modal){
  const vendor = load('saqua.vendors', []).find(v => v.id === STATE.currentUser.vendorId);
  if(!vendor){ modal.innerHTML = `<p>Empresa não encontrada.</p>`; return; }

  modal.innerHTML = `<h3>Editar Perfil de Vendedor: ${escapeHTML(vendor.name)}</h3>
    <label>Nome da empresa</label><input id="v_name" value="${escapeHTML(vendor.name)}">
    <label>Categoria</label><input id="v_cat" value="${escapeHTML(vendor.category||'')}">
    <label>Endereço</label><input id="v_addr" value="${escapeHTML(vendor.address||'')}">
    <label>WhatsApp (+55...)</label><input id="v_wh" value="${escapeHTML(vendor.whatsapp||'')}">
    <label>Descrição</label><textarea id="v_desc">${escapeHTML(vendor.description||'')}</textarea>
    <label>Horário de atendimento</label><input id="v_hours" value="${escapeHTML(vendor.workingHours||'')}">
    <label>Avatar/Logo (opcional)</label><input type="file" id="v_avatar" accept="image/*" />

    <div class="right-align">
      <button class="ghost" onclick="closeModal()">Cancelar</button>
      <button class="btn" id="v_save">Salvar Alterações</button>
    </div>`;

  modal.querySelector('#v_save').onclick = async () => {
    vendor.name = modal.querySelector('#v_name').value.trim();
    vendor.category = modal.querySelector('#v_cat').value.trim();
    vendor.address = modal.querySelector('#v_addr').value.trim();
    vendor.whatsapp = modal.querySelector('#v_wh').value.trim();
    vendor.description = modal.querySelector('#v_desc').value.trim();
    vendor.workingHours = modal.querySelector('#v_hours').value.trim();
    
    const fileInput = modal.querySelector('#v_avatar');
    if(fileInput.files && fileInput.files[0]){
      vendor.avatarDataUrl = await new Promise(res=>{
        const reader = new FileReader();
        reader.onload = e=>res(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
    }

    saveVendor(vendor);
    closeModal();
    alert('Perfil atualizado com sucesso!');
    renderFeed(); // Atualiza o feed com a nova imagem/dados
  };
}

/* ------------------ Admin: criar anúncio (com duração e simulação) ------------------ */
function renderAdminCreatePost(modal){
  const vendors = load('saqua.vendors', []);
  if(vendors.length === 0){
    modal.innerHTML = `<p>Não há empresas cadastradas para criar anúncios.</p>`;
    return;
  }
  modal.innerHTML = `<h3>Criar anúncio para empresa</h3>
    <label>Empresa</label>
    <select id="admin-post-vendor">${vendors.map(v => `<option value="${v.id}">${escapeHTML(v.name)}</option>`).join('')}</select>
    <label>Título</label><input id="new-title" />
    <label>Descrição</label><textarea id="new-desc"></textarea>
    <label>Duração (dias 1-30)</label><input type="number" id="new-duration" value="1" min="1" max="30"/>
    <div class="small muted">Custo estimado: <span id="simul-cost">R$4,00</span></div>
    <label>Imagem (opcional)</label><input type="file" id="new-media" accept="image/*" />
    <label>Link "Saiba mais" (opcional)</label><input id="new-link" placeholder="https://exemplo.com" />
    <div class="right-align">
      <button class="ghost" id="create-cancel">Cancelar</button>
      <button class="btn" id="create-save">Publicar</button>
    </div>`;
  const durationInput = modal.querySelector('#new-duration');
  const simulCost = modal.querySelector('#simul-cost');
  durationInput.oninput = () => simulCost.textContent = `R$${(4*parseInt(durationInput.value||1)).toFixed(2)}`;

  modal.querySelector('#create-cancel').onclick = closeModal;
  modal.querySelector('#create-save').onclick = async () => {
    const vendorId = modal.querySelector('#admin-post-vendor').value;
    const title = modal.querySelector('#new-title').value.trim();
    const desc = modal.querySelector('#new-desc').value.trim();
    const duration = Math.min(Math.max(parseInt(modal.querySelector('#new-duration').value||1),1),30);
    const fileInput = modal.querySelector('#new-media');
    const link = modal.querySelector('#new-link').value.trim();
    if(!vendorId || !title || !desc){
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    let mediaDataUrl = '';
    if(fileInput.files && fileInput.files[0]){
      mediaDataUrl = await new Promise(res=>{
        const reader = new FileReader();
        reader.onload = e=>res(e.target.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
    }

    const posts = load('saqua.posts', []);
    posts.push({
      id: uid(),
      vendorId,
      title,
      description: desc,
      duration,
      mediaDataUrl,
      linkSaibaMais: link || '',
      createdAt: Date.now(),
      createdBy: 'admin'
    });
    save('saqua.posts', posts);
    closeModal();
    renderFeed();
  };
}

/* ------------------ Admin: criar/listar vendedores ------------------ */
function renderAdminCreateVendor(modal){
  modal.innerHTML = `<h3>Cadastrar Empresa / Vendedor</h3>
    <div class="row">
      <div>
        <label>Nome da empresa</label><input id="adm_name">
        <label>Categoria</label><input id="adm_cat" placeholder="Ex: Mercado">
        <label>Endereço</label><input id="adm_addr">
        <label>WhatsApp (+55...)</label><input id="adm_wh" placeholder="+5511999...">
        <label>Descrição</label><textarea id="adm_desc"></textarea>
        <label>Horário de atendimento</label><input id="adm_hours" placeholder="08:00 - 20:00">
        <label>Usuário do vendedor</label><input id="adm_username" placeholder="login do vendedor">
        <label>Senha do vendedor</label><input id="adm_password" placeholder="senha">
        <div class="right-align">
          <button class="ghost" id="adm_cancel">Cancelar</button>
          <button class="btn" id="adm_save">Salvar e criar credenciais</button>
        </div>
      </div>
    </div>`;
  modal.querySelector('#adm_cancel').onclick = closeModal;
  modal.querySelector('#adm_save').onclick = () => {
    const name = modal.querySelector('#adm_name').value.trim();
    const username = modal.querySelector('#adm_username').value.trim();
    const password = modal.querySelector('#adm_password').value.trim();
    if(!name || !username || !password){
      alert('Nome, usuário e senha são obrigatórios.');
      return;
    }
    const vendors = load('saqua.vendors', []);
    const vId = uid();
    const vendor = {
      id: vId,
      name,
      category: modal.querySelector('#adm_cat').value.trim(),
      address: modal.querySelector('#adm_addr').value.trim(),
      whatsapp: modal.querySelector('#adm_wh').value.trim(),
      description: modal.querySelector('#adm_desc').value.trim(),
      products: [],
      workingHours: modal.querySelector('#adm_hours').value.trim(),
      avatarDataUrl: '',
      featured: false
    };
    vendors.push(vendor);
    save('saqua.vendors', vendors);

    const users = load('saqua.users', []);
    users.push({
      id: uid(),
      role: 'vendor',
      username,
      password,
      vendorId: vId
    });
    save('saqua.users', users);

    modal.innerHTML = `<h3>Vendedor criado</h3>
      <div class="card">
        <strong>${escapeHTML(vendor.name)}</strong>
        <p class="muted">Usuário: <code>${escapeHTML(username)}</code><br>Senha: <code>${escapeHTML(password)}</code></p>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <button class="btn" id="adm_done">Fechar</button>
      </div>`;
    modal.querySelector('#adm_done').onclick = () => {
      closeModal();
      renderTop();
    };
  };
}

function renderAdminListVendors(modal){
  const vendors = load('saqua.vendors', []);

// ... O restante da função 'renderAdminListVendors' (que foi cortada no seu envio) continuaria aqui.
// Como não tenho o resto, o código termina aqui com o que você enviou.
}

function renderAdminListVendors(modal){
  const vendors = load('saqua.vendors', []);
  const users = load('saqua.users', []);
  modal.innerHTML = `<h3>Empresas cadastradas (${vendors.length})</h3>
    <div id="adm_list" style="max-height:400px; overflow:auto;"></div>
    <div style="display:flex;justify-content:flex-end; margin-top:12px">
      <button class="ghost" id="adm_close">Fechar</button>
    </div>`;
  modal.querySelector('#adm_close').onclick = closeModal;
  const list = modal.querySelector('#adm_list');
  vendors.forEach(v => {
    const user = users.find(u => u.role === 'vendor' && u.vendorId === v.id);
    const username = user ? user.username : '(sem usuário)';
    const password = user ? user.password : '(sem senha)';
    const d = document.createElement('div');
    d.className = 'card';
    d.style.marginBottom = '8px';
    d.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <strong>${escapeHTML(v.name)}</strong>
          <div class="muted" style="margin-top:6px">${escapeHTML(v.category||'')} • ${escapeHTML(v.address||'')}</div>
          <div class="muted" style="margin-top:6px">Credenciais → Usuário: <code>${escapeHTML(username)}</code> | Senha: <code>${escapeHTML(password)}</code></div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="ghost" data-view="${v.id}">Ver perfil</button>
          <button class="ghost" data-deluser="${v.id}">Excluir acesso</button>
        </div>
      </div>`;
    list.appendChild(d);
    d.querySelector('[data-view]').onclick = () => {
      openModal(inner => {
        inner.innerHTML = `
          <div style="display:flex;gap:12px;align-items:center">
            <img class="avatar" src="${v.avatarDataUrl || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="Avatar" style="width:86px;height:86px;border-radius:14px">
            <div>
              <h3>${escapeHTML(v.name)}</h3>
              <div class="muted">${escapeHTML(v.category || 'Geral')}</div>
              <div class="muted" style="margin-top:6px">${escapeHTML(v.address || '')}</div>
              <div class="muted" style="margin-top:6px">Horário: ${escapeHTML(v.workingHours||'')}</div>
            </div>
          </div>
          <p style="margin-top:10px">${escapeHTML(v.description||'')}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">
            ${v.products.map(prod => `
              <div style="border:1px solid ${'var(--border)'};padding:8px;border-radius:10px">
                <img src="${prod.image || 'data:image/svg+xml;utf8,' + encodeURIComponent(svgPlaceholder())}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:8px">
                <div style="margin-top:8px"><strong>${escapeHTML(prod.title)}</strong></div>
                <div class="muted" style="font-size:13px">${escapeHTML(prod.desc)} • ${escapeHTML(prod.price||'')}</div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
            <button class="ghost" onclick="closeModal()">Fechar</button>
          </div>
        `;
      });
    };
    d.querySelector('[data-deluser]').onclick = () => {
      if(!confirm(`Tem certeza que deseja EXCLUIR o acesso e o perfil da empresa ${v.name}?`)) return;
      // Remove o usuário
      const newUsers = users.filter(u => u.vendorId !== v.id);
      save('saqua.users', newUsers);
      // Remove o vendedor
      const newVendors = vendors.filter(vend => vend.id !== v.id);
      save('saqua.vendors', newVendors);
      // Remove os posts
      let posts = load('saqua.posts', []).filter(p => p.vendorId !== v.id);
      save('saqua.posts', posts);
      
      alert(`Empresa ${v.name} e seu acesso excluídos.`);
      closeModal();
      renderTop();
    };
  });
}

// Preenche com cliente mock para teste rápido
document.getElementById('login_username').value = 'cliente';
document.getElementById('login_password').value = 'cliente123';

// 1. Função de Login Cliente
document.getElementById('btn-login-cliente').onclick = () => {
const u = document.getElementById('login_username').value;
const p = document.getElementById('login_password').value;

if(login(u, p)){
if(['client', 'vendor', 'admin'].includes(STATE.currentUser.role)){
window.location.href = 'home.html';
} else {
alert('Erro: Tipo de usuário desconhecido.');
logout();
}
} else {
alert('Login falhou. Usuário ou senha incorretos.');
}
};

// 2. Botão de Cadastro (Chama função do script.js)
document.getElementById('btn-cadastro-cliente').onclick = () => openModal(renderRegisterClientModal);

// 3. Botões de Acesso Restrito (Chama função do script.js)
document.getElementById('btn-login-vendor-open').onclick = () => openModal(modal => renderRestrictedLoginModal(modal, 'vendor'));
document.getElementById('btn-login-admin-open').onclick = () => openModal(modal => renderRestrictedLoginModal(modal, 'admin'));

