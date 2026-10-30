
const $ = id => document.getElementById(id);

const starterProducts = [
    {id:1, name:'เมล็ดผักกาดหอม', category:'ผัก', price:35, stock:50, description:'ผักสลัดกรอบ ปลูกง่าย', emoji:'🥬'},
    {id:2, name:'เมล็ดมะเขือเทศ', category:'ผัก', price:45, stock:35, description:'ให้ผลผลิตดี เหมาะกับสวนครัว', emoji:'🍅'},
    {id:3, name:'เมล็ดทานตะวัน', category:'ดอกไม้', price:30, stock:60, description:'ดอกสีเหลืองสดใส', emoji:'🌻'},
    {id:4, name:'เมล็ดดาวเรือง', category:'ดอกไม้', price:25, stock:80, description:'ดอกสวย ดูแลง่าย', emoji:'🌼'},
    {id:5, name:'เมล็ดแตงโม', category:'ผลไม้', price:50, stock:25, description:'ผลหวานฉ่ำ', emoji:'🍉'},
    {id:6, name:'เมล็ดโหระพา', category:'สมุนไพร', price:20, stock:100, description:'กลิ่นหอม ใช้ประกอบอาหาร', emoji:'🌿'}
];

let products = JSON.parse(localStorage.getItem('ss_products') || 'null') || starterProducts;
let users = JSON.parse(localStorage.getItem('ss_users') || '[]');
let cart = JSON.parse(localStorage.getItem('ss_cart') || '[]');
let orders = JSON.parse(localStorage.getItem('ss_orders') || '[]');
let currentUser = JSON.parse(localStorage.getItem('ss_current') || 'null');

const money = n => Number(n).toLocaleString('th-TH') + ' บาท';

function saveData() {
    localStorage.setItem('ss_products', JSON.stringify(products));
    localStorage.setItem('ss_users', JSON.stringify(users));
    localStorage.setItem('ss_cart', JSON.stringify(cart));
    localStorage.setItem('ss_orders', JSON.stringify(orders));
    localStorage.setItem('ss_current', JSON.stringify(currentUser));
}

function escapeHTML(value = '') {
    return String(value).replace(/[&<>"']/g, c => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;',
        '"':'&quot;', "'":'&#39;'
    }[c]));
}

function toast(message) {
    const box = $('toast');
    box.textContent = message;
    box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 2200);
}

function showPage(name) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const target = $(name + 'Page');
    if (target) target.classList.add('active');

    if (name === 'products') renderProducts();
    if (name === 'profile') renderProfile();
    if (name === 'cart') renderCart();
    if (name === 'orders') renderOrders();

    window.scrollTo({top:0, behavior:'smooth'});
}

function updateNavbar() {
    $('navActions').innerHTML = currentUser
        ? `<button class="btn" onclick="showPage('profile')">บัญชีของฉัน</button>`
        : `<button class="btn" onclick="showPage('login')">เข้าสู่ระบบ</button>
           <button class="btn" onclick="showPage('register')">สมัครสมาชิก</button>`;

    $('cartCount').textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

function productCard(p) {
    return `
    <div class="product-card">
        <div class="product-art">${p.emoji || '🌱'}</div>
        <div class="product-info">
            <h3>${escapeHTML(p.name)}</h3>
            <small>${escapeHTML(p.category)}</small>
            <p>${escapeHTML(p.description || '')}</p>
            <div class="price">${money(p.price)}</div>
            <p>คงเหลือ ${p.stock} ชิ้น</p>
            <button class="btn full" ${p.stock <= 0 ? 'disabled' : ''}
                onclick="addToCart(${p.id})">เพิ่มลงตะกร้า</button>
        </div>
    </div>`;
}

function renderHome() {
    $('homeProducts').innerHTML = products.slice(0,4).map(productCard).join('');
}

function renderProducts() {
    const keyword = ($('searchInput')?.value || '').toLowerCase();
    const category = $('categoryFilter')?.value || '';

    const list = products.filter(p =>
        p.name.toLowerCase().includes(keyword) &&
        (!category || p.category === category)
    );

    $('productList').innerHTML = list.length
        ? list.map(productCard).join('')
        : '<div class="empty">ไม่พบสินค้าที่ค้นหา</div>';
}

function filterCategory(category) {
    showPage('products');
    $('categoryFilter').value = category;
    renderProducts();
}

function addToCart(id) {
    const product = products.find(p => p.id === id);

    if (!product || product.stock <= 0) {
        return toast('สินค้าหมด');
    }

    const item = cart.find(i => i.id === id);

    if (item) {
        if (item.qty >= product.stock) return toast('สินค้าไม่เพียงพอ');
        item.qty++;
    } else {
        cart.push({id, qty:1});
    }

    saveData();
    updateNavbar();
    toast('เพิ่มสินค้าลงตะกร้าแล้ว');
}

function changeQty(id, amount) {
    const item = cart.find(i => i.id === id);
    const product = products.find(p => p.id === id);

    if (!item) return;

    item.qty += amount;

    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    } else if (product && item.qty > product.stock) {
        item.qty = product.stock;
    }

    saveData();
    updateNavbar();
    renderCart();
}

function renderCart() {
    if (!cart.length) {
        $('cartContent').innerHTML = `
            <div class="empty">
                <h3>🛒 ยังไม่มีสินค้าในตะกร้า</h3>
                <button class="btn" onclick="showPage('products')">เลือกซื้อสินค้า</button>
            </div>`;
        return;
    }

    let total = 0;

    const rows = cart.map(item => {
        const p = products.find(x => x.id === item.id);
        if (!p) return '';

        total += p.price * item.qty;

        return `
        <div class="cart-row">
            <div>🌱 <b>${escapeHTML(p.name)}</b></div>
            <div>${money(p.price)}</div>
            <div>
                <button onclick="changeQty(${p.id},-1)">−</button>
                ${item.qty}
                <button onclick="changeQty(${p.id},1)">+</button>
            </div>
            <b>${money(p.price * item.qty)}</b>
        </div>`;
    }).join('');

    $('cartContent').innerHTML = rows + `
        <div class="cart-summary">
            <h3>สรุปคำสั่งซื้อ</h3>
            <p>ยอดรวม: <b class="price">${money(total)}</b></p>
            <button class="btn full" onclick="checkout()">ยืนยันคำสั่งซื้อ</button>
        </div>`;
}

function checkout() {
    if (!currentUser) {
        toast('กรุณาเข้าสู่ระบบก่อน');
        return showPage('login');
    }

    if (!currentUser.address?.trim()) {
        toast('กรุณาเพิ่มที่อยู่ในโปรไฟล์');
        return showPage('profile');
    }

    if (!cart.length) return;

    for (const item of cart) {
        const p = products.find(x => x.id === item.id);
        if (!p || p.stock < item.qty) {
            return toast('สินค้าในสต็อกไม่เพียงพอ');
        }
    }

    let total = 0;

    const items = cart.map(item => {
        const p = products.find(x => x.id === item.id);
        p.stock -= item.qty;
        total += p.price * item.qty;

        return {
            name:p.name,
            price:p.price,
            qty:item.qty
        };
    });

    orders.unshift({
        id:'SS' + Date.now().toString().slice(-8),
        userId:currentUser.id,
        date:new Date().toLocaleString('th-TH'),
        address:currentUser.address,
        total,
        items,
        status:'รอการจัดส่ง'
    });

    cart = [];
    saveData();
    updateNavbar();
    toast('สั่งซื้อสำเร็จ');
    showPage('orders');
}

function renderOrders() {
    if (!currentUser) {
        $('ordersContent').innerHTML = '<div class="empty">กรุณาเข้าสู่ระบบ</div>';
        return;
    }

    const mine = orders.filter(o => o.userId === currentUser.id);

    if (!mine.length) {
        $('ordersContent').innerHTML = '<div class="empty">ยังไม่มีคำสั่งซื้อ</div>';
        return;
    }

    $('ordersContent').innerHTML = mine.map(o => `
        <div class="order-card">
            <div><b>คำสั่งซื้อ #${o.id}</b>
                <span class="status">${o.status}</span>
            </div>
            <small>${o.date}</small>
            <p>${o.items.map(i =>
                `${escapeHTML(i.name)} × ${i.qty}`
            ).join(' , ')}</p>
            <b>ยอดรวม ${money(o.total)}</b>
            <p>ที่อยู่จัดส่ง: ${escapeHTML(o.address)}</p>
        </div>
    `).join('');
}

// สมัครสมาชิก
$('registerForm').addEventListener('submit', e => {
    e.preventDefault();

    const name = $('regName').value.trim();
    const email = $('regEmail').value.trim().toLowerCase();
    const password = $('regPassword').value;

    if (password !== $('regConfirm').value) {
        return toast('รหัสผ่านไม่ตรงกัน');
    }

    if (users.some(u => u.email === email)) {
        return toast('อีเมลนี้มีผู้ใช้งานแล้ว');
    }

    const user = {
        id:'MB' + Date.now().toString().slice(-7),
        name,
        email,
        phone:$('regPhone').value.trim(),
        role:$('regRole').value,
        address:$('regAddress').value.trim(),
        password
    };

    users.push(user);
    currentUser = {...user};

    saveData();
    updateNavbar();
    toast('สมัครสมาชิกสำเร็จ');
    showPage('profile');
});

// เข้าสู่ระบบ
$('loginForm').addEventListener('submit', e => {
    e.preventDefault();

    const email = $('loginEmail').value.trim().toLowerCase();
    const password = $('loginPassword').value;

    const user = users.find(u =>
        u.email === email && u.password === password
    );

    if (!user) return toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    currentUser = {...user};

    saveData();
    updateNavbar();
    toast('เข้าสู่ระบบสำเร็จ');
    showPage('profile');
});

// แสดงโปรไฟล์
function renderProfile() {
    if (!currentUser) return showPage('login');

    $('profileName').textContent = currentUser.name;
    $('profileRole').textContent =
        currentUser.role === 'seller' ? 'ผู้ขาย' : 'ลูกค้า';

    $('profileId').value = currentUser.id;
    $('profileNameInput').value = currentUser.name;
    $('profileEmail').value = currentUser.email;
    $('profilePhone').value = currentUser.phone;
    $('profileAddress').value = currentUser.address;

    $('sellerPanel').classList.toggle(
        'hidden',
        currentUser.role !== 'seller'
    );
}

// แก้ไขข้อมูลโปรไฟล์
$('profileForm').addEventListener('submit', e => {
    e.preventDefault();

    const user = users.find(u => u.id === currentUser.id);

    user.name = $('profileNameInput').value.trim();
    user.phone = $('profilePhone').value.trim();
    user.address = $('profileAddress').value.trim();

    currentUser = {...user};

    saveData();
    renderProfile();
    toast('บันทึกข้อมูลเรียบร้อย');
});

// ออกจากระบบ
function logout() {
    currentUser = null;
    saveData();
    updateNavbar();
    toast('ออกจากระบบแล้ว');
    showPage('home');
}

// ผู้ขายเพิ่มสินค้า
$('addProductForm').addEventListener('submit', e => {
    e.preventDefault();

    if (!currentUser || currentUser.role !== 'seller') return;

    products.unshift({
        id:Date.now(),
        name:$('newProductName').value.trim(),
        category:$('newProductCategory').value,
        price:Number($('newProductPrice').value),
        stock:Number($('newProductStock').value),
        description:$('newProductDescription').value.trim(),
        emoji:'🌱'
    });

    saveData();
    e.target.reset();
    renderHome();
    toast('เพิ่มสินค้าเรียบร้อย');
});

// เริ่มต้นเว็บไซต์
renderHome();
updateNavbar();
