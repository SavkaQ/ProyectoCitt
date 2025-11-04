const emailPattern = /^[\w.+-]+@duocuc\.cl$/i;
const activeMatriculas = new Set([
    '20241234',
    '20247654',
    '20249876',
    '20243321',
    '20245555',
    '20249999',
]);

const defaultUsers = [
    {
        name: 'Coordinador General',
        email: 'coordinador@duocuc.cl',
        password: 'CittSegura24',
        role: 'coordinador',
        matricula: 'admin',
        notifications: 'todas',
    },
];

const defaultInventory = [
    { id: 'INV-001', name: 'Impresora 3D', category: 'Prototipado', status: 'disponible' },
    { id: 'INV-002', name: 'Osciloscopio digital', category: 'Electrónica', status: 'prestado' },
    { id: 'INV-003', name: 'Kit Arduino', category: 'Programación', status: 'disponible' },
    { id: 'INV-004', name: 'Laptop Ultrabook', category: 'Computación', status: 'nuevo' },
    { id: 'INV-005', name: 'Cámara DSLR', category: 'Audiovisual', status: 'danado' },
    { id: 'MAT-101', name: 'Filamento PLA (1kg)', category: 'Materiales', status: 'disponible' },
];

const defaultReservations = [
    {
        id: 'RES-001',
        requester: 'estudiante1@duocuc.cl',
        space: 'laboratorio',
        date: '2024-09-22',
        time: '10:00',
        status: 'aprobada',
        exclusive: false,
    },
    {
        id: 'RES-002',
        requester: 'estudiante2@duocuc.cl',
        space: 'sala',
        date: '2024-09-23',
        time: '13:30',
        status: 'pendiente',
        exclusive: true,
    },
];

const defaultHistory = [
    {
        id: 'HIS-001',
        owner: 'estudiante1@duocuc.cl',
        title: 'Reserva Laboratorio de prototipado',
        description: '22/09/2024 - 10:00 hrs - Estado aprobada',
    },
];

const defaultNotifications = [
    {
        id: 'NOT-001',
        type: 'confirmacion',
        message: 'Reserva RES-001 confirmada para laboratorio el 22/09/2024.',
        target: 'estudiante1@duocuc.cl',
    },
    {
        id: 'NOT-002',
        type: 'alerta',
        message: 'Filamento PLA en nivel crítico. Registrar consumo.',
        target: 'coordinador@duocuc.cl',
    },
];

const StorageKeys = {
    USERS: 'citt-users',
    SESSION: 'citt-session',
    INVENTORY: 'citt-inventory',
    RESERVATIONS: 'citt-reservations',
    HISTORY: 'citt-history',
    NOTIFICATIONS: 'citt-notifications',
};

function initializeData() {
    if (!localStorage.getItem(StorageKeys.USERS)) {
        localStorage.setItem(StorageKeys.USERS, JSON.stringify(defaultUsers));
    }
    if (!localStorage.getItem(StorageKeys.INVENTORY)) {
        localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(defaultInventory));
    }
    if (!localStorage.getItem(StorageKeys.RESERVATIONS)) {
        localStorage.setItem(StorageKeys.RESERVATIONS, JSON.stringify(defaultReservations));
    }
    if (!localStorage.getItem(StorageKeys.HISTORY)) {
        localStorage.setItem(StorageKeys.HISTORY, JSON.stringify(defaultHistory));
    }
    if (!localStorage.getItem(StorageKeys.NOTIFICATIONS)) {
        localStorage.setItem(StorageKeys.NOTIFICATIONS, JSON.stringify(defaultNotifications));
    }
}

function getStoredArray(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error parsing storage key', key, error);
        return [];
    }
}

function setStoredArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeText(value) {
    return value.replace(/[<>]/g, '').trim();
}

function generateId(prefix) {
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${random}${timestamp}`;
}

function showFeedback(element, message, success = false) {
    element.textContent = message;
    element.classList.toggle('success', success);
}

function toggleAuthLinks(isAuthenticated) {
    document.querySelectorAll('.requires-auth').forEach((link) => {
        link.hidden = !isAuthenticated;
    });
}

function scrollToSelector(selector) {
    const target = document.querySelector(selector);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
    }
}

function openModal(dialog) {
    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
    }
}

function closeModal(dialog) {
    if (typeof dialog.close === 'function') {
        dialog.close();
    }
}

initializeData();

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFeedback = document.getElementById('loginFeedback');
const registerFeedback = document.getElementById('registerFeedback');
const reservationForm = document.getElementById('studentReservationForm');
const reservationFeedback = document.getElementById('reservationFeedback');
const loanForm = document.getElementById('loanRequestForm');
const loanFeedback = document.getElementById('loanFeedback');
const returnForm = document.getElementById('returnForm');
const returnFeedback = document.getElementById('returnFeedback');
const adminInventoryForm = document.getElementById('adminInventoryForm');
const adminInventoryFeedback = document.getElementById('adminInventoryFeedback');
const profileModal = document.getElementById('profileModal');
const profileSaveBtn = document.getElementById('profileSave');
const profileFeedback = document.getElementById('profileFeedback');
const recoverModal = document.getElementById('recoverModal');
const recoverFeedback = document.getElementById('recoverFeedback');
const recoverSubmit = document.getElementById('recoverSubmit');

const tabs = document.querySelectorAll('.tab');
const tabPanels = document.querySelectorAll('.tab__panel');
const dashboardSection = document.getElementById('dashboard');
const userGreeting = document.getElementById('userGreeting');
const userRole = document.getElementById('userRole');
const logoutBtn = document.getElementById('logoutBtn');
const openProfileBtn = document.getElementById('openProfile');
const inventoryList = document.getElementById('inventoryList');
const inventorySearch = document.getElementById('inventorySearch');
const inventoryCategory = document.getElementById('inventoryCategory');
const studentCalendar = document.getElementById('studentCalendar');
const studentHistory = document.getElementById('studentHistory');
const studentNotifications = document.getElementById('studentNotifications');
const assistantActiveReservations = document.getElementById('assistantActiveReservations');
const assistantInventory = document.getElementById('assistantInventory');
const adminReservationRequests = document.getElementById('adminReservationRequests');
const adminUserList = document.getElementById('adminUserList');
const adminReports = document.getElementById('adminReports');
const usageChart = document.getElementById('usageChart');
const adminNotifications = document.getElementById('adminNotifications');
const calendarView = document.getElementById('calendarView');
const simulateQrScanBtn = document.getElementById('simulateQrScan');
const reservationQrField = document.getElementById('reservationQr');
const scanInventoryCodeBtn = document.getElementById('scanInventoryCode');
const consumptionForm = document.getElementById('consumptionForm');
const consumptionFeedback = document.getElementById('consumptionFeedback');

const inventoryTemplate = document.getElementById('inventoryItemTemplate');
const historyTemplate = document.getElementById('historyItemTemplate');

const session = JSON.parse(sessionStorage.getItem(StorageKeys.SESSION) || 'null');

if (session) {
    applySession(session);
}

document.querySelectorAll('[data-action="scroll"]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
        const target = btn.getAttribute('data-target');
        if (target) {
            event.preventDefault();
            scrollToSelector(target);
        }
    });
});

loginForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = sanitizeText(loginForm.loginEmail.value);
    const password = loginForm.loginPassword.value.trim();
    const role = loginForm.loginRole.value;

    if (!emailPattern.test(email)) {
        showFeedback(loginFeedback, 'Utiliza tu correo institucional @duocuc.cl.');
        return;
    }

    if (password.length < 8) {
        showFeedback(loginFeedback, 'La contraseña debe tener al menos 8 caracteres.');
        return;
    }

    const users = getStoredArray(StorageKeys.USERS);
    const user = users.find((u) => u.email === email && u.role === role);

    if (!user || user.password !== password) {
        showFeedback(loginFeedback, 'Credenciales inválidas o rol incorrecto.');
        return;
    }

    const sessionData = {
        name: user.name,
        email: user.email,
        role: user.role,
        notifications: user.notifications ?? 'todas',
    };

    sessionStorage.setItem(StorageKeys.SESSION, JSON.stringify(sessionData));
    applySession(sessionData);
    showFeedback(loginFeedback, 'Ingreso exitoso. Redirigiendo…', true);
    setTimeout(() => scrollToSelector('#dashboard'), 200);
});

registerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = sanitizeText(registerForm.registerName.value);
    const email = sanitizeText(registerForm.registerEmail.value.toLowerCase());
    const matricula = sanitizeText(registerForm.registerMatricula.value);
    const role = registerForm.registerRole.value;
    const password = registerForm.registerPassword.value.trim();

    if (!emailPattern.test(email)) {
        showFeedback(registerFeedback, 'El correo debe ser @duocuc.cl');
        return;
    }

    if (!activeMatriculas.has(matricula)) {
        showFeedback(registerFeedback, 'Matrícula no encontrada o inactiva.');
        return;
    }

    if (password.length < 8) {
        showFeedback(registerFeedback, 'La contraseña debe tener al menos 8 caracteres.');
        return;
    }

    const users = getStoredArray(StorageKeys.USERS);
    if (users.some((u) => u.email === email)) {
        showFeedback(registerFeedback, 'Ya existe una cuenta para este correo.');
        return;
    }

    users.push({
        name,
        email,
        matricula,
        role,
        password,
        notifications: 'todas',
    });

    setStoredArray(StorageKeys.USERS, users);
    showFeedback(registerFeedback, 'Cuenta creada correctamente. Puedes iniciar sesión.', true);
    registerForm.reset();
});

reservationForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const sessionData = getSession();
    if (!sessionData) {
        showFeedback(reservationFeedback, 'Debes iniciar sesión para crear reservas.');
        return;
    }

    const reservation = {
        id: generateId('RES'),
        requester: sessionData.email,
        space: reservationForm.reservationSpace.value,
        date: reservationForm.reservationDate.value,
        time: reservationForm.reservationTime.value,
        exclusive: reservationForm.reservationExclusive.checked,
        status: 'pendiente',
        qr: reservationForm.dataset.qrCode ?? '',
    };

    if (!reservation.space || !reservation.date || !reservation.time) {
        showFeedback(reservationFeedback, 'Completa todos los campos.');
        return;
    }

    if (!reservation.qr) {
        showFeedback(reservationFeedback, 'Debes escanear la credencial del usuario.');
        return;
    }

    const reservations = getStoredArray(StorageKeys.RESERVATIONS);
    reservations.push(reservation);
    setStoredArray(StorageKeys.RESERVATIONS, reservations);
    addHistory(sessionData.email, `Reserva ${reservation.space}`, `${reservation.date} ${reservation.time} - Estado pendiente`);
    createNotification('confirmacion', `Solicitud ${reservation.id} enviada para revisión.`, sessionData.email);
    showFeedback(reservationFeedback, 'Solicitud enviada. Espera confirmación del coordinador.', true);
    reservationForm.reset();
    reservationForm.dataset.qrCode = '';
    if (reservationQrField) reservationQrField.value = '';
    refreshDashboard();
});

loanForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const sessionData = getSession();
    if (!sessionData) {
        showFeedback(loanFeedback, 'Debes iniciar sesión.');
        return;
    }

    const item = sanitizeText(loanForm.loanItem.value);
    const quantity = Number.parseInt(loanForm.loanQuantity.value, 10);

    if (!item || Number.isNaN(quantity) || quantity <= 0) {
        showFeedback(loanFeedback, 'Datos inválidos.');
        return;
    }

    addHistory(sessionData.email, 'Solicitud de artículo', `${item} x ${quantity} - Pendiente`);
    createNotification('aprobacion', `Solicitud de ${item} registrada.`, sessionData.email);
    showFeedback(loanFeedback, 'Solicitud registrada correctamente.', true);
    loanForm.reset();
    refreshDashboard();
});

returnForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const sessionData = getSession();
    if (!sessionData) {
        showFeedback(returnFeedback, 'Debes iniciar sesión.');
        return;
    }
    const code = sanitizeText(returnForm.returnCode.value);
    if (!code) {
        showFeedback(returnFeedback, 'Ingresa un código de préstamo.');
        return;
    }
    addHistory(sessionData.email, 'Devolución registrada', `Código ${code} marcado como devuelto`);
    createNotification('recordatorio', `Se registró la devolución ${code}.`, sessionData.email);
    showFeedback(returnFeedback, 'Devolución registrada.', true);
    returnForm.reset();
    refreshDashboard();
});

adminInventoryForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const sessionData = getSession();
    if (!sessionData || sessionData.role !== 'coordinador') {
        showFeedback(adminInventoryFeedback, 'Solo coordinadores pueden registrar artículos.');
        return;
    }

    const name = sanitizeText(adminInventoryForm.adminItemName.value);
    const category = sanitizeText(adminInventoryForm.adminItemCategory.value);
    const status = adminInventoryForm.adminItemStatus.value;

    if (!name || !category) {
        showFeedback(adminInventoryFeedback, 'Completa nombre y categoría.');
        return;
    }

    const inventory = getStoredArray(StorageKeys.INVENTORY);
    const newItem = {
        id: adminInventoryForm.dataset.scannedCode ?? generateId('INV'),
        name,
        category,
        status,
    };

    inventory.push(newItem);
    setStoredArray(StorageKeys.INVENTORY, inventory);
    showFeedback(adminInventoryFeedback, 'Artículo registrado correctamente.', true);
    adminInventoryForm.reset();
    adminInventoryForm.dataset.scannedCode = '';
    refreshDashboard();
});

profileSaveBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    const notifications = document.getElementById('profileNotifications').value;
    const password = document.getElementById('profilePassword').value.trim();
    const sessionData = getSession();

    if (!sessionData) return;

    const users = getStoredArray(StorageKeys.USERS);
    const userIndex = users.findIndex((u) => u.email === sessionData.email);

    if (userIndex === -1) {
        showFeedback(profileFeedback, 'No se pudo actualizar el perfil.');
        return;
    }

    users[userIndex].notifications = notifications;
    if (password) {
        if (password.length < 8) {
            showFeedback(profileFeedback, 'La nueva contraseña debe tener mínimo 8 caracteres.');
            return;
        }
        users[userIndex].password = password;
    }

    setStoredArray(StorageKeys.USERS, users);
    sessionData.notifications = notifications;
    sessionStorage.setItem(StorageKeys.SESSION, JSON.stringify(sessionData));
    showFeedback(profileFeedback, 'Configuración actualizada.', true);
    document.getElementById('profilePassword').value = '';
});

recoverSubmit?.addEventListener('click', (event) => {
    event.preventDefault();
    const email = sanitizeText(document.getElementById('recoverEmail').value.toLowerCase());
    if (!emailPattern.test(email)) {
        showFeedback(recoverFeedback, 'Debes ingresar un correo institucional válido.');
        return;
    }
    const users = getStoredArray(StorageKeys.USERS);
    const exists = users.some((u) => u.email === email);
    if (!exists) {
        showFeedback(recoverFeedback, 'No se encontró una cuenta asociada.', false);
        return;
    }
    showFeedback(recoverFeedback, 'Hemos enviado instrucciones de recuperación.', true);
});

logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem(StorageKeys.SESSION);
    dashboardSection.hidden = true;
    toggleAuthLinks(false);
    showFeedback(loginFeedback, 'Sesión cerrada con éxito.', true);
});

openProfileBtn?.addEventListener('click', () => {
    populateProfileModal();
    openModal(profileModal);
});

document.getElementById('recoverPassword')?.addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('recoverFeedback').textContent = '';
    document.getElementById('recoverEmail').value = '';
    openModal(recoverModal);
});

profileModal?.addEventListener('close', () => {
    profileFeedback.textContent = '';
});

recoverModal?.addEventListener('close', () => {
    recoverFeedback.textContent = '';
});

simulateQrScanBtn?.addEventListener('click', () => {
    const code = generateId('QR');
    reservationForm.dataset.qrCode = code;
    if (reservationQrField) {
        reservationQrField.value = code;
    }
    showFeedback(reservationFeedback, 'QR escaneado correctamente.', true);
});

scanInventoryCodeBtn?.addEventListener('click', () => {
    const code = generateId('INV');
    adminInventoryForm.dataset.scannedCode = code;
    showFeedback(adminInventoryFeedback, `Código detectado: ${code}`, true);
});

consumptionForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const sessionData = getSession();
    if (!sessionData || sessionData.role !== 'coordinador') {
        showFeedback(consumptionFeedback, 'Solo coordinadores pueden registrar consumos.');
        return;
    }

    const item = sanitizeText(document.getElementById('consumptionItem').value);
    const quantity = Number.parseInt(document.getElementById('consumptionQuantity').value, 10);
    const notes = sanitizeText(document.getElementById('consumptionNotes').value ?? '');

    if (!item || Number.isNaN(quantity) || quantity <= 0) {
        showFeedback(consumptionFeedback, 'Completa artículo y una cantidad válida.');
        return;
    }

    addHistory(sessionData.email, 'Consumo de materiales', `${item} · ${quantity} unidades · ${notes || 'Sin observaciones'}`);
    createNotification('alerta', `Consumo registrado de ${item} (${quantity}).`, sessionData.email);
    showFeedback(consumptionFeedback, 'Consumo registrado.', true);
    consumptionForm.reset();
    refreshDashboard();
});

function applySession(sessionData) {
    dashboardSection.hidden = false;
    toggleAuthLinks(true);
    userGreeting.textContent = `Hola, ${sessionData.name}`;
    userRole.textContent = `Rol asignado: ${formatRole(sessionData.role)}`;
    enforceRoleAccess(sessionData.role);
    setActiveTab(sessionData.role);
    refreshDashboard();
}

function getSession() {
    const raw = sessionStorage.getItem(StorageKeys.SESSION);
    return raw ? JSON.parse(raw) : null;
}

function formatRole(role) {
    switch (role) {
        case 'alumno':
            return 'Alumno';
        case 'ayudante':
            return 'Ayudante / Docente';
        case 'coordinador':
            return 'Coordinador / Director';
        default:
            return role;
    }
}

function setActiveTab(role) {
    tabs.forEach((tab) => {
        const isActive = tab.dataset.tab === role;
        tab.setAttribute('aria-selected', isActive.toString());
    });
    tabPanels.forEach((panel) => {
        panel.hidden = panel.id !== `tab-${role}`;
    });
}

function enforceRoleAccess(role) {
    const permissions = {
        alumno: ['alumno'],
        ayudante: ['ayudante'],
        coordinador: ['alumno', 'ayudante', 'coordinador'],
    };

    const allowedTabs = permissions[role] ?? [];

    tabs.forEach((tab) => {
        const tabRole = tab.dataset.tab;
        const isAllowed = allowedTabs.includes(tabRole);
        tab.disabled = !isAllowed;
        tab.hidden = !isAllowed;
        tab.tabIndex = isAllowed ? 0 : -1;
        tab.setAttribute('aria-hidden', (!isAllowed).toString());
        tab.classList.toggle('tab--disabled', !isAllowed);
    });

    tabPanels.forEach((panel) => {
        const panelRole = panel.id.replace('tab-', '');
        const accessible = allowedTabs.includes(panelRole);
        panel.dataset.accessible = accessible;
        if (!accessible) {
            panel.hidden = true;
        }
    });
}

function refreshDashboard() {
    const inventory = getStoredArray(StorageKeys.INVENTORY);
    const reservations = getStoredArray(StorageKeys.RESERVATIONS);
    const history = getStoredArray(StorageKeys.HISTORY);
    const notifications = getStoredArray(StorageKeys.NOTIFICATIONS);
    const sessionData = getSession();

    renderInventory(inventory);
    renderCalendar(reservations);
    renderHistory(history, sessionData?.email);
    renderAssistantView(reservations, inventory);
    renderAdminView(reservations, history);
    renderUsageChart(reservations, inventory);
    renderNotifications(notifications, sessionData?.email);
}

function renderInventory(items) {
    if (!inventoryList) return;

    const filterText = inventorySearch?.value?.toLowerCase() ?? '';
    const filterCategory = inventoryCategory?.value ?? '';
    const sessionData = getSession();
    const isCoordinator = sessionData?.role === 'coordinador';

    const categories = Array.from(new Set(items.map((item) => item.category))).sort();
    if (inventoryCategory && inventoryCategory.options.length <= 1) {
        categories.forEach((cat) => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            inventoryCategory.appendChild(option);
        });
    }

    const filtered = items.filter((item) => {
        const matchesText = item.name.toLowerCase().includes(filterText);
        const matchesCategory = !filterCategory || item.category === filterCategory;
        return matchesText && matchesCategory;
    });

    inventoryList.innerHTML = '';
    filtered.forEach((item) => {
        const node = inventoryTemplate.content.cloneNode(true);
        const label = node.querySelector('.inventory__label');
        label.textContent = `${item.name} · ${item.category} (${item.id})`;
        const listItem = node.querySelector('.inventory__item');
        const status = node.querySelector('.inventory__status');
        status.textContent = statusLabel(item.status);
        status.dataset.status = item.status;
        if (isCoordinator) {
            const controls = document.createElement('div');
            controls.className = 'inventory__controls';
            const select = document.createElement('select');
            select.innerHTML = `
                <option value="nuevo">Nuevo</option>
                <option value="disponible">Disponible</option>
                <option value="prestado">Prestado</option>
                <option value="danado">Dañado</option>
            `;
            select.value = item.status;
            select.setAttribute('aria-label', `Actualizar estado de ${item.name}`);
            select.addEventListener('change', () => {
                updateInventoryStatus(item.id, select.value);
            });
            controls.appendChild(select);
            listItem.appendChild(controls);
        }
        inventoryList.appendChild(node);
    });
}

inventorySearch?.addEventListener('input', () => {
    renderInventory(getStoredArray(StorageKeys.INVENTORY));
});

inventoryCategory?.addEventListener('change', () => {
    renderInventory(getStoredArray(StorageKeys.INVENTORY));
});

calendarView?.addEventListener('change', () => {
    renderCalendar(getStoredArray(StorageKeys.RESERVATIONS));
});

function statusLabel(status) {
    const map = {
        nuevo: '⚪ Nuevo',
        disponible: '🟩 Disponible',
        prestado: '🟨 Prestado',
        danado: '🟥 Dañado',
    };
    return map[status] ?? status;
}

function renderCalendar(reservations) {
    if (!studentCalendar) return;
    studentCalendar.innerHTML = '';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const view = calendarView?.value ?? 'semana';
    const upcoming = reservations
        .filter((res) => new Date(`${res.date}T${res.time}`) >= now)
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
        .slice(0, 6);

    if (upcoming.length === 0) {
        studentCalendar.innerHTML = '<p>No hay reservas próximas.</p>';
        return;
    }

    const filtered = upcoming.filter((res) => {
        if (view === 'dia') {
            return res.date === startOfToday.toISOString().slice(0, 10);
        }
        if (view === 'semana') {
            const reservationDate = new Date(`${res.date}T00:00`);
            const diff = (reservationDate - startOfToday) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
        }
        return true; // mes
    });

    filtered.forEach((res) => {
        const card = document.createElement('div');
        card.className = 'calendar__item';
        card.innerHTML = `
            <strong>${formatDate(res.date)} · ${res.time}</strong>
            <p>${res.space.toUpperCase()}</p>
            <p>Estado: ${res.status}</p>
            ${res.exclusive ? '<span class="badge">Exclusiva CITT</span>' : ''}
            ${res.qr ? `<p>QR: ${res.qr}</p>` : ''}
        `;
        studentCalendar.appendChild(card);
    });

    if (filtered.length === 0) {
        studentCalendar.innerHTML = '<p>No hay reservas para la vista seleccionada.</p>';
    }
}

function formatDate(value) {
    const date = new Date(`${value}T00:00`);
    return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function renderHistory(history, email) {
    if (!studentHistory) return;
    studentHistory.innerHTML = '';
    const filtered = history.filter((item) => item.owner === email);

    if (filtered.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'Aún no registras movimientos.';
        studentHistory.appendChild(message);
        return;
    }

    filtered.forEach((entry) => {
        const node = historyTemplate.content.cloneNode(true);
        node.querySelector('.history__title').textContent = entry.title;
        node.querySelector('.history__meta').textContent = entry.description;
        studentHistory.appendChild(node);
    });
}

function renderAssistantView(reservations, inventory) {
    if (!assistantActiveReservations) return;

    assistantActiveReservations.innerHTML = '';
    const active = reservations.filter((res) => res.status !== 'rechazada');
    if (active.length === 0) {
        assistantActiveReservations.innerHTML = '<li>No hay reservas activas.</li>';
    } else {
        active.forEach((res) => {
            const node = historyTemplate.content.cloneNode(true);
            node.querySelector('.history__title').textContent = `${res.id} · ${res.space}`;
            node.querySelector('.history__meta').textContent = `${res.date} ${res.time} · Estado ${res.status}`;
            assistantActiveReservations.appendChild(node);
        });
    }

    assistantInventory.innerHTML = '';
    inventory.forEach((item) => {
        const node = inventoryTemplate.content.cloneNode(true);
        node.querySelector('.inventory__label').textContent = `${item.name} (${item.category}) · ${item.id}`;
        const status = node.querySelector('.inventory__status');
        status.textContent = statusLabel(item.status);
        status.dataset.status = item.status;
        assistantInventory.appendChild(node);
    });
}

function renderAdminView(reservations, history) {
    if (!adminReservationRequests) return;

    adminReservationRequests.innerHTML = '';
    const pending = reservations.filter((res) => res.status === 'pendiente');

    if (pending.length === 0) {
        adminReservationRequests.innerHTML = '<li>Sin solicitudes pendientes.</li>';
    } else {
        pending.forEach((res) => {
            const node = historyTemplate.content.cloneNode(true);
            node.querySelector('.history__title').textContent = `${res.id} · ${res.space}`;
            node.querySelector('.history__meta').textContent = `${res.date} ${res.time} · ${res.requester}`;
            const container = document.createElement('div');
            container.className = 'admin__actions';
            const approve = document.createElement('button');
            approve.textContent = 'Aprobar';
            approve.className = 'btn btn--primary';
            approve.addEventListener('click', () => updateReservationStatus(res.id, 'aprobada'));
            const reject = document.createElement('button');
            reject.textContent = 'Rechazar';
            reject.className = 'btn btn--danger';
            reject.addEventListener('click', () => updateReservationStatus(res.id, 'rechazada'));
            container.append(approve, reject);
            node.querySelector('.history__item').appendChild(container);
            adminReservationRequests.appendChild(node);
        });
    }

    adminUserList.innerHTML = '';
    const users = getStoredArray(StorageKeys.USERS);
    users.forEach((user) => {
        const node = historyTemplate.content.cloneNode(true);
        node.querySelector('.history__title').textContent = user.name;
        node.querySelector('.history__meta').textContent = `${user.email} · ${formatRole(user.role)}`;
        const controls = document.createElement('div');
        controls.className = 'admin__user-controls';
        const select = document.createElement('select');
        select.innerHTML = `
            <option value="alumno">Alumno</option>
            <option value="ayudante">Ayudante / Docente</option>
            <option value="coordinador">Coordinador / Director</option>
        `;
        select.value = user.role;
        select.setAttribute('aria-label', `Modificar rol de ${user.name}`);
        select.addEventListener('change', () => updateUserRole(user.email, select.value));
        controls.appendChild(select);
        const matricula = document.createElement('span');
        matricula.textContent = `Matrícula: ${user.matricula ?? 'N/A'}`;
        controls.appendChild(matricula);
        node.querySelector('.history__item').appendChild(controls);
        adminUserList.appendChild(node);
    });

    adminReports.innerHTML = '';
    const totalReservations = reservations.length;
    const approved = reservations.filter((res) => res.status === 'aprobada').length;
    const rejected = reservations.filter((res) => res.status === 'rechazada').length;
    const pendingCount = pending.length;

    const reportData = [
        { label: 'Reservas totales', value: totalReservations },
        { label: 'Reservas aprobadas', value: approved },
        { label: 'Reservas rechazadas', value: rejected },
        { label: 'Reservas pendientes', value: pendingCount },
        { label: 'Movimientos en historial', value: history.length },
    ];

    reportData.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'reports__card';
        card.innerHTML = `<strong>${item.label}</strong><p>${item.value}</p>`;
        adminReports.appendChild(card);
    });
}

function renderUsageChart(reservations, inventory) {
    if (!usageChart) return;

    const ctx = usageChart.getContext('2d');
    ctx.clearRect(0, 0, usageChart.width, usageChart.height);

    const counts = {
        laboratorio: reservations.filter((r) => r.space === 'laboratorio').length,
        sala: reservations.filter((r) => r.space === 'sala').length,
        taller: reservations.filter((r) => r.space === 'taller').length,
        inventario: inventory.length,
    };

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    const width = usageChart.width || 300;
    const height = usageChart.height || 200;
    const barWidth = width / (values.length * 1.5);
    const maxVal = Math.max(...values, 1);

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, width, height);

    values.forEach((value, index) => {
        const barHeight = (value / maxVal) * (height - 40);
        const x = 40 + index * (barWidth + 20);
        const y = height - barHeight - 20;
        ctx.fillStyle = '#3e7ae0';
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fillStyle = '#1f2937';
        ctx.fillText(labels[index], x, height - 5);
        ctx.fillText(value.toString(), x, y - 5);
    });
}

function updateReservationStatus(id, status) {
    const reservations = getStoredArray(StorageKeys.RESERVATIONS);
    const index = reservations.findIndex((res) => res.id === id);
    if (index === -1) return;

    reservations[index].status = status;
    setStoredArray(StorageKeys.RESERVATIONS, reservations);
    createNotification(
        status === 'aprobada' ? 'aprobacion' : 'rechazo',
        `Reserva ${id} ${status === 'aprobada' ? 'aprobada' : 'rechazada'} por coordinación.`,
        reservations[index].requester
    );
    addHistory(
        reservations[index].requester,
        `Reserva ${reservations[index].space}`,
        `${reservations[index].date} ${reservations[index].time} - Estado ${status}`
    );
    refreshDashboard();
}

function updateInventoryStatus(id, status) {
    const inventory = getStoredArray(StorageKeys.INVENTORY);
    const index = inventory.findIndex((item) => item.id === id);
    if (index === -1) return;
    inventory[index].status = status;
    setStoredArray(StorageKeys.INVENTORY, inventory);
    const sessionData = getSession();
    if (sessionData) {
        createNotification('alerta', `Estado de ${inventory[index].name} actualizado a ${statusLabel(status)}.`, sessionData.email);
    }
    refreshDashboard();
}

function updateUserRole(email, role) {
    const users = getStoredArray(StorageKeys.USERS);
    const index = users.findIndex((user) => user.email === email);
    if (index === -1) return;
    users[index].role = role;
    setStoredArray(StorageKeys.USERS, users);
    createNotification('aprobacion', `Rol actualizado a ${formatRole(role)} para ${users[index].name}.`, email);
    const sessionData = getSession();
    if (sessionData?.email === email) {
        sessionData.role = role;
        sessionStorage.setItem(StorageKeys.SESSION, JSON.stringify(sessionData));
        applySession(sessionData);
        return;
    }
    refreshDashboard();
}

function addHistory(owner, title, description) {
    const history = getStoredArray(StorageKeys.HISTORY);
    history.push({ id: generateId('HIS'), owner, title, description });
    setStoredArray(StorageKeys.HISTORY, history);
}

function createNotification(type, message, target) {
    const notifications = getStoredArray(StorageKeys.NOTIFICATIONS);
    notifications.push({ id: generateId('NOT'), type, message, target });
    setStoredArray(StorageKeys.NOTIFICATIONS, notifications);
}

function populateProfileModal() {
    const sessionData = getSession();
    if (!sessionData) return;
    document.getElementById('profileName').value = sessionData.name;
    document.getElementById('profileEmail').value = sessionData.email;
    document.getElementById('profileRole').value = formatRole(sessionData.role);
    document.getElementById('profileNotifications').value = sessionData.notifications ?? 'todas';
    document.getElementById('profilePassword').value = '';
}

function renderNotifications(notifications, email) {
    if (studentNotifications) {
        studentNotifications.innerHTML = '';
        const personal = notifications.filter((notification) => notification.target === email);
        if (personal.length === 0) {
            studentNotifications.innerHTML = '<li>No tienes notificaciones.</li>';
        } else {
            personal.forEach((notification) => {
                const node = historyTemplate.content.cloneNode(true);
                node.querySelector('.history__title').textContent = notification.message;
                node.querySelector('.history__meta').textContent = `Tipo: ${notification.type}`;
                studentNotifications.appendChild(node);
            });
        }
    }

    if (adminNotifications) {
        adminNotifications.innerHTML = '';
        const sorted = [...notifications].reverse().slice(0, 10);
        if (sorted.length === 0) {
            adminNotifications.innerHTML = '<li>Sin notificaciones registradas.</li>';
        } else {
            sorted.forEach((notification) => {
                const node = historyTemplate.content.cloneNode(true);
                node.querySelector('.history__title').textContent = notification.message;
                node.querySelector('.history__meta').textContent = `${notification.type.toUpperCase()} · ${notification.target}`;
                adminNotifications.appendChild(node);
            });
        }
    }
}

tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        if (tab.disabled) {
            return;
        }
        const role = tab.dataset.tab;
        setActiveTab(role);
    });
});

refreshDashboard();
