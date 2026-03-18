document.addEventListener('DOMContentLoaded', () => {
    // Current Active Tab
    let activeTab = 'overview';

    // Elements
    const views = {
        overview: document.getElementById('overview-view'),
        fleet: document.getElementById('fleet-view'),
        blogs: document.getElementById('blogs-view'),
        bookings: document.getElementById('bookings-view'),
        history: document.getElementById('history-view'),
        admins: document.getElementById('admins-view')
    };

    const tabs = {
        overview: document.getElementById('tab-overview'),
        fleet: document.getElementById('tab-fleet'),
        blogs: document.getElementById('tab-blogs'),
        bookings: document.getElementById('tab-bookings'),
        history: document.getElementById('tab-history'),
        admins: document.getElementById('tab-admins')
    };

    // Switch Tab Function
    window.switchTab = function(tabId, title, subtitle) {
        // Hide ALL views — also strip md:grid so 'hidden' isn't overridden
        Object.values(views).forEach(v => {
            if(v) {
                v.classList.add('hidden');
                v.classList.remove('md:grid');
            }
        });
        Object.values(tabs).forEach(t => { 
            if(t) {
                t.classList.remove('bg-primary', 'text-background-dark');
                t.classList.add('text-slate-400');
            }
        });

        const targetView = views[tabId];
        if (targetView) {
            targetView.classList.remove('hidden');
            if(tabId === 'admins') targetView.classList.add('md:grid');
        }

        if (tabs[tabId]) {
            tabs[tabId].classList.remove('text-slate-400');
            tabs[tabId].classList.add('bg-primary', 'text-background-dark');
        }

        if(title) document.getElementById('page-title').innerText = title;
        if(subtitle) document.getElementById('page-subtitle').innerText = subtitle;

        activeTab = tabId;
        loadData(tabId);
    };

    function loadData(tab) {
        if (tab === 'fleet') loadCars();
        else if (tab === 'blogs') loadBlogs();
        else if (tab === 'overview') { loadStats(); loadRecentBookings(); }
        else if (tab === 'bookings' || tab === 'history') loadBookings();
        else if (tab === 'admins') loadAdmins();
    }

    // =====================================
    // OVERVIEW & STATS
    // =====================================
    async function loadStats() {
        try {
            const [carsRes, bookingsRes] = await Promise.all([
                fetch('/api/cars'),
                fetch('/api/bookings')
            ]);
            const cars = await carsRes.json();
            const bookings = await bookingsRes.json();

            document.getElementById('stat-total-cars').innerText = bookings.length;
            document.getElementById('stat-pending-bookings').innerText = bookings.filter(b => b.status === 'Pending').length;
            document.getElementById('stat-completed-bookings').innerText = bookings.filter(b => b.status === 'Completed').length;
            document.getElementById('stat-ongoing-bookings').innerText = bookings.filter(b => b.status === 'Ongoing').length;
        } catch(e) { console.error('Error loading stats:', e); }
    }

    async function loadRecentBookings() {
        // This usually populates the table in the overview
        // We can reuse loadBookings logic or have a separate one
    }

    // =====================================
    // CARS MANAGEMENT
    // =====================================
    const carsTbody = document.getElementById('cars-tbody');
    const carForm = document.getElementById('car-form');
    let currentEditCarId = null;

    async function loadCars() {
        if(!carsTbody) return;
        carsTbody.innerHTML = '<tr><td colspan="5" class="py-16 text-center text-slate-500">جاري التحميل...</td></tr>';
        try {
            const res = await fetch('/api/cars');
            const data = await res.json();
            carsTbody.innerHTML = '';
            
            if(data.length === 0) {
                carsTbody.innerHTML = '<tr><td colspan="5" class="py-16 text-center text-slate-500">لا توجد سيارات</td></tr>';
                return;
            }

            data.forEach(car => {
                const carJson = encodeURIComponent(JSON.stringify(car).replace(/'/g, "\\'"));
                carsTbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors group text-center">
                    <td class="py-4 px-4 flex items-center justify-center flex-row-reverse gap-3">
                        <img src="${car.image || 'https://via.placeholder.com/60'}" class="w-12 h-8 rounded-lg object-cover" />
                        <div class="text-left" dir="ltr">
                            <p class="font-bold text-white text-xs">${car.brand} ${car.model}</p>
                            <p class="text-[9px] text-primary">${car.seats || 4} مقاعد</p>
                        </div>
                    </td>
                    <td class="py-4 px-4 font-bold text-slate-300 text-xs">${car.category || 'Luxury'}</td>
                    <td class="py-4 px-4 font-bold font-sans text-primary text-xs relative text-left w-[80px]">${car.price} <span class="text-[9px] ml-1 absolute text-slate-400">جم</span></td>
                    <td class="py-4 px-4">
                        <span class="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold">${car.status || 'Available'}</span>
                    </td>
                    <td class="py-4 px-4">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="editCar('${carJson}')" class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                <span class="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button onclick="deleteCar(${car.id})" class="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </td>
                </tr>`;
            });
        } catch(e) { console.error('Error loading cars:', e); }
    }

    if (carForm) {
        carForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(carForm);
            try {
                let url = '/api/cars';
                let method = 'POST';
                if (currentEditCarId) {
                    url = '/api/cars/' + currentEditCarId;
                    method = 'PUT';
                }
                const res = await fetch(url, { method: method, body: formData });
                if (res.ok) {
                    carForm.reset();
                    currentEditCarId = null;
                    loadCars();
                    alert('تم الحفظ بنجاح');
                } else alert('خطأ في الحفظ');
            } catch(e) { console.error(e); }
        });
    }

    window.editCar = function(json) {
        const car = JSON.parse(decodeURIComponent(json));
        currentEditCarId = car.id;
        carForm.brand.value = car.brand;
        carForm.model.value = car.model;
        carForm.category.value = car.category;
        carForm.price.value = car.price;
        carForm.scrollIntoView({ behavior: 'smooth' });
    };

    window.deleteCar = async function(id) {
        if(!confirm('حذف هذه السيارة؟')) return;
        await fetch(`/api/cars/${id}`, { method: 'DELETE' });
        loadCars();
    };

    // =====================================
    // BOOKINGS
    // =====================================
    const bookingsTbody = document.getElementById('bookings-tbody');
    async function loadBookings() {
        if(!bookingsTbody) return;
        try {
            const res = await fetch('/api/bookings');
            const data = await res.json();
            bookingsTbody.innerHTML = '';
            if(data.length === 0) {
                bookingsTbody.innerHTML = '<tr><td colspan="6" class="py-16 text-center text-slate-500">لا توجد حجوزات</td></tr>';
                return;
            }
            data.forEach(b => {
                const bookingJson = encodeURIComponent(JSON.stringify(b).replace(/'/g, "\\'"));
                bookingsTbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors">
                    <td class="py-4 px-4 font-sans font-bold text-slate-300">${b.booking_ref}</td>
                    <td class="py-4 px-4">
                        <p class="font-bold text-white text-xs text-right">${b.customer_name}</p>
                        <p class="text-[9px] text-slate-500 text-right">${b.customer_phone}</p>
                    </td>
                    <td class="py-4 px-4 font-bold text-primary text-xs text-center">${b.brand} ${b.model}</td>
                    <td class="py-4 px-4 font-bold font-sans text-xs">${b.total_amount} جم</td>
                    <td class="py-4 px-4 text-center">
                        <span class="px-3 py-1 rounded-full text-[10px] font-bold ${
                            b.status === 'Pending' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            b.status === 'Ongoing' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            b.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            'bg-red-500/10 text-red-500 border border-red-500/20'
                        }">${b.status}</span>
                    </td>
                    <td class="py-4 px-4">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="viewBookingDetails('${bookingJson}')" class="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-[10px] font-bold transition-all">عرض التفاصيل</button>
                            ${b.status === 'Pending' ? `<button onclick="updateBookingStatus(${b.id}, 'Ongoing')" class="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[10px] font-bold transition-all">تأكيد الحجز</button>` : ''}
                            ${b.status !== 'Cancelled' && b.status !== 'Completed' ? `<button onclick="updateBookingStatus(${b.id}, 'Cancelled')" class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-bold transition-all">إلغاء</button>` : ''}
                        </div>
                    </td>
                </tr>`;
            });
        } catch(e) { console.error(e); }
    }

    window.updateBookingStatus = async (id, status) => {
        const msg = status === 'Cancelled' ? 'هل أنت متأكد من إلغاء هذا الحجز؟' : 'تأكيد الحجز؟';
        if(!confirm(msg)) return;
        await fetch(`/api/bookings/${id}/status`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({status})
        });
        loadBookings();
        loadStats(); // Update dashboard counts
    };

    window.viewBookingDetails = (json) => {
        const b = JSON.parse(decodeURIComponent(json));
        const content = `
            <div class="grid grid-cols-2 gap-8">
                <div class="space-y-4">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-widest">بيانات العميل</h4>
                    <div class="space-y-2">
                        <p class="text-sm"><span class="text-slate-500 ml-2">الاسم:</span> <span class="text-white">${b.customer_name}</span></p>
                        <p class="text-sm"><span class="text-slate-500 ml-2">الهاتف:</span> <span class="text-white font-sans">${b.customer_phone}</span></p>
                        <p class="text-sm"><span class="text-slate-500 ml-2">الإيميل:</span> <span class="text-white font-sans">${b.customer_email}</span></p>
                    </div>
                </div>
                <div class="space-y-4">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-widest">بيانات السيارة</h4>
                    <div class="space-y-2">
                        <p class="text-sm"><span class="text-slate-500 ml-2">السيارة:</span> <span class="text-white">${b.brand} ${b.model}</span></p>
                        <p class="text-sm"><span class="text-slate-500 ml-2">المبلغ:</span> <span class="text-white font-sans">${b.total_amount} ج.م</span></p>
                        <p class="text-sm"><span class="text-slate-500 ml-2">الحالة:</span> <span class="text-white">${b.status}</span></p>
                    </div>
                </div>
                <div class="col-span-2 space-y-4 mt-4 border-t border-white/5 pt-6">
                    <h4 class="text-xs font-bold text-primary uppercase tracking-widest">مواعيد الحجز</h4>
                    <div class="grid grid-cols-2 gap-4">
                        <p class="text-sm"><span class="text-slate-500 ml-2">من:</span> <span class="text-white font-sans">${new Date(b.start_date).toLocaleDateString()}</span></p>
                        <p class="text-sm"><span class="text-slate-500 ml-2">إلى:</span> <span class="text-white font-sans">${new Date(b.end_date).toLocaleDateString()}</span></p>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('booking-modal-content').innerHTML = content;
        document.getElementById('booking-modal').classList.remove('hidden');
    };

    window.closeBookingModal = () => {
        document.getElementById('booking-modal').classList.add('hidden');
    };

    // =====================================
    // ADMINS
    // =====================================
    const adminsTbody = document.getElementById('admins-tbody');
    const addAdminForm = document.getElementById('add-admin-form');

    async function loadAdmins() {
        if(!adminsTbody) return;
        try {
            const res = await fetch('/api/admins');
            const data = await res.json();
            adminsTbody.innerHTML = '';
            data.forEach(admin => {
                adminsTbody.innerHTML += `
                <tr class="hover:bg-white/5 transition-colors group">
                    <td class="py-5 px-4 text-right flex items-center justify-end flex-row-reverse gap-3 pr-6">
                        <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">${admin.username[0]}</div>
                        <p class="font-bold text-white text-xs font-sans">${admin.username}</p>
                    </td>
                    <td class="py-5 px-4 text-[10px] font-sans text-slate-400 font-medium">${new Date(admin.created_at).toLocaleDateString()}</td>
                    <td class="py-5 px-4 text-[10px]">
                        <span class="bg-white/5 text-slate-300 px-3 py-1.5 rounded-md font-bold text-[9px]">${admin.role}</span>
                    </td>
                    <td class="py-5 px-4 text-left pl-6">
                        <button onclick="deleteAdmin(${admin.id})" class="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </td>
                </tr>`;
            });
        } catch(e) { console.error(e); }
    }

    if(addAdminForm) {
        addAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addAdminForm);
            const data = Object.fromEntries(formData.entries());
            const res = await fetch('/api/admins', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            });
            if(res.ok) {
                addAdminForm.reset();
                loadAdmins();
                alert('تم إضافة المسؤول بنجاح');
            } else {
                const err = await res.json();
                alert(err.error);
            }
        });
    }

    window.deleteAdmin = async (id) => {
        if(!confirm('حذف هذا المسؤول؟')) return;
        await fetch(`/api/admins/${id}`, { method: 'DELETE' });
        loadAdmins();
    };

    // Initial Load
    loadData('overview');
});
