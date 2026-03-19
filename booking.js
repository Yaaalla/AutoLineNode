document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let carId = urlParams.get('car_id') || urlParams.get('id');
    
    const carSelectContainer = document.getElementById('car-select-container');
    const carIdSelect = document.getElementById('car_id_select');

    let allCarsList = [];
    let selectedCar = null;
    let pricePerDay = 0;
    let unavailableDates = [];
    let appliedPromo = null;

    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    const bookingForm = document.getElementById('booking-form');
    const promoInput = document.getElementById('promo_code_input');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoMessage = document.getElementById('promo-message');
    // Setup sensible default dates from URL if available
    const urlStart = urlParams.get('start_date') || urlParams.get('pickup');
    const urlEnd = urlParams.get('end_date') || urlParams.get('dropoff');
    const urlLoc = urlParams.get('location');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    startDateInput.value = urlStart || today.toISOString().split('T')[0];
    endDateInput.value = urlEnd || tomorrow.toISOString().split('T')[0];
    startDateInput.min = today.toISOString().split('T')[0];

    // Restore from sessionStorage
    const savedName = sessionStorage.getItem('bk_name');
    const savedEmail = sessionStorage.getItem('bk_email');
    const savedPhone = sessionStorage.getItem('bk_phone');
    if (savedName) document.getElementById('customer_name').value = savedName;
    if (savedEmail) document.getElementById('customer_email').value = savedEmail;
    if (savedPhone) document.getElementById('customer_phone').value = savedPhone;

    // Listeners for persistence
    ['customer_name', 'customer_email', 'customer_phone'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            sessionStorage.setItem('bk_' + id.split('_')[1], e.target.value);
        });
    });

    // Fetch ALL Cars and availability
    try {
        const [carRes] = await Promise.all([
            fetch('/api/cars')
        ]);
        
        allCarsList = await carRes.json();
        
        // Populate car select dropdown
        allCarsList.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.id;
            opt.textContent = `${car.brand} ${car.model}`;
            if (car.id == carId) opt.selected = true;
            carIdSelect.appendChild(opt);
        });

        if (!carId) {
            carSelectContainer.classList.remove('hidden');
            carId = carIdSelect.value; // Pick first available
        } else {
            // Even if we have carId, maybe show it to allow changing?
            // User requested "select car", let's show it but pre-selected.
            carSelectContainer.classList.remove('hidden');
        }

        await updateSelectedCar(carId);

    } catch(err) {
        console.error(err);
        document.getElementById('summary-section').innerHTML = '<p class="text-red-500 text-center w-full my-auto font-bold">حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</p>';
        return;
    }

    async function updateSelectedCar(id) {
        carId = id;
        selectedCar = allCarsList.find(c => c.id == id);
        if (!selectedCar) return;

        const hasDiscount = selectedCar.discount_price && selectedCar.discount_price < selectedCar.price;
        pricePerDay = hasDiscount ? parseFloat(selectedCar.discount_price) : parseFloat(selectedCar.price);

        // Fetch availability for specific car
        const availRes = await fetch(`/api/cars/${id}/availability`);
        unavailableDates = await availRes.json();
        
        validateDates();
        renderSummary();
    }

    carIdSelect.addEventListener('change', (e) => {
        updateSelectedCar(e.target.value);
    });

    function isOverlapping(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        return unavailableDates.some(b => {
            const bStart = new Date(b.start_date);
            const bEnd = new Date(b.end_date);
            return (s <= bEnd && e >= bStart);
        });
    }

    // Re-render when dates change
    startDateInput.addEventListener('change', () => {
        if(endDateInput.value && startDateInput.value > endDateInput.value) {
            endDateInput.value = startDateInput.value;
        }
        endDateInput.min = startDateInput.value;
        validateDates();
        renderSummary();
    });
    
    endDateInput.addEventListener('change', () => {
        validateDates();
        renderSummary();
    });

    function validateDates() {
        const errorDivId = 'date-error';
        let errorDiv = document.getElementById(errorDivId);
        
        if (isOverlapping(startDateInput.value, endDateInput.value)) {
            if (!errorDiv) {
                errorDiv = document.createElement('p');
                errorDiv.id = errorDivId;
                errorDiv.className = 'text-red-500 text-xs font-bold mt-2 text-right';
                errorDiv.textContent = 'عذراً، هذه التواريخ محجوزة مسبقاً. يرجى اختيار مواعيد أخرى.';
                endDateInput.parentElement.appendChild(errorDiv);
            }
            document.getElementById('submit-booking-btn').disabled = true;
            document.getElementById('submit-booking-btn').classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            if (errorDiv) errorDiv.remove();
            document.getElementById('submit-booking-btn').disabled = false;
            document.getElementById('submit-booking-btn').classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', async () => {
            const code = promoInput.value.trim().toUpperCase();
            if (!code) return;
            
            applyPromoBtn.disabled = true;
            applyPromoBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin text-sm"></i>';
            
            try {
                const res = await fetch('/api/promo-codes/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                
                const data = await res.json();
                
                if (res.ok) {
                    appliedPromo = data;
                    if (promoMessage) {
                        promoMessage.textContent = `تم تطبيق خصم ${data.discount_value}${data.discount_type === 'Percentage' ? '%' : ' ج.م'}`;
                        promoMessage.className = 'text-[10px] font-bold mt-2 mr-2 text-emerald-500 block';
                    }
                    renderSummary();
                } else {
                    appliedPromo = null;
                    if (promoMessage) {
                        promoMessage.textContent = data.error;
                        promoMessage.className = 'text-[10px] font-bold mt-2 mr-2 text-red-500 block';
                    }
                    renderSummary();
                }
            } catch (e) {
                console.error(e);
            } finally {
                applyPromoBtn.disabled = false;
                applyPromoBtn.textContent = 'تطبيق';
            }
        });
    }

    function calculateTotal() {
        if(!startDateInput.value || !endDateInput.value) return { days: 0, subtotal: 0, discount: 0, total: 0 };
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);
        
        const diffTime = Math.abs(end - start);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        const subtotal = diffDays * pricePerDay;
        let discount = 0;
        
        if (appliedPromo) {
            if (appliedPromo.discount_type === 'Percentage') {
                discount = (subtotal * appliedPromo.discount_value) / 100;
            } else {
                discount = appliedPromo.discount_value;
            }
        }
        
        return {
            days: diffDays,
            subtotal,
            discount,
            total: Math.max(0, subtotal - discount)
        };
    }

    function renderSummary() {
        if (!selectedCar) return;
        const totals = calculateTotal();
        
        const summaryHtml = `
            <div class="mb-10 text-center">
                <h4 class="text-2xl font-black text-white mb-8">ملخص الحجز</h4>
                
                <div class="bg-background-dark/30 rounded-3xl p-6 border border-white/5 flex items-center gap-6 text-right">
                    <img src="${selectedCar.image || 'https://via.placeholder.com/600'}" class="w-32 h-20 object-cover rounded-2xl shadow-lg"/>
                    <div>
                        <p class="text-primary text-[10px] font-black uppercase tracking-widest mb-1">${selectedCar.brand}</p>
                        <h5 class="text-xl font-black text-white">${selectedCar.model}</h5>
                    </div>
                </div>
            </div>
            
            <div class="space-y-6 border-t border-white/5 pt-8">
                <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-white">${pricePerDay.toFixed(2)} ج.م</span>
                    <span class="text-slate-500">السعر اليومي</span>
                </div>
                ${appliedPromo ? `
                <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-emerald-500">-${totals.discount.toFixed(2)} ج.م</span>
                    <span class="text-slate-500">الخصم (${appliedPromo.code})</span>
                </div>
                ` : ''}
                <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-emerald-500">مشمول</span>
                    <span class="text-slate-500">التأمين</span>
                </div>
            </div>

            <div class="mt-12 pt-8 border-t border-white/10">
                <div class="flex justify-between items-end">
                    <div class="text-left">
                        <span class="block text-[10px] font-black text-primary uppercase tracking-widest mb-1">المجموع الكلي</span>
                        <span class="text-3xl font-black text-white text-left font-sans">${totals.total.toFixed(2)} <span class="text-xs font-bold text-slate-500">ج.م</span></span>
                    </div>
                    <div class="text-right">
                        <span class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">المدة</span>
                        <span class="text-lg font-black text-white">${totals.days} أيام</span>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('summary-section').innerHTML = summaryHtml;
    }

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const totals = calculateTotal();
        formData.append('car_id', carId);
        formData.append('start_date', startDateInput.value);
        formData.append('end_date', endDateInput.value);
        formData.append('total_amount', totals.total);
        formData.append('customer_name', document.getElementById('customer_name').value);
        formData.append('customer_email', document.getElementById('customer_email').value);
        formData.append('customer_phone', document.getElementById('customer_phone').value);
        formData.append('location', urlParams.get('location') || 'فرع القاهرة');
        formData.append('pickup_time', '10:00'); // Default time
        formData.append('license_number', 'N/A'); // Default for now since we removed the field
        
        if (appliedPromo) {
            formData.append('promo_code', appliedPromo.code);
        }
        
        const btn = document.getElementById('submit-booking-btn');
        btn.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin text-sm"></i> جاري الحجز...';
        btn.disabled = true;
        
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showModal(true, "تم تأكيد الحجز!", "سيارتك الفاخرة مؤمنة. سنقوم بالتواصل معك قريباً لتأكيد الموعد.");
                bookingForm.reset();
                sessionStorage.removeItem('bk_name');
                sessionStorage.removeItem('bk_email');
                sessionStorage.removeItem('bk_phone');
                appliedPromo = null;
                promoMessage.classList.add('hidden');
            } else {
                showModal(false, "فشل الحجز", "حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.");
            }
        } catch (error) {
            console.error(error);
            showModal(false, "خطأ في الاتصال", "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.");
        } finally {
            btn.innerHTML = `تأكيد طلب الحجز`;
            btn.disabled = false;
        }
    });

    function showModal(isSuccess, title, message) {
        const modal = document.getElementById('status-modal');
        const iconDiv = document.getElementById('status-icon');
        
        document.getElementById('status-title').innerText = title;
        document.getElementById('status-message').innerText = message;
        
        if (isSuccess) {
            iconDiv.className = "mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 bg-emerald-500/10 text-emerald-500";
            iconDiv.innerHTML = '<i class="fa-solid fa-circle-check text-5xl"></i>';
        } else {
            iconDiv.className = "mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 bg-red-500/10 text-red-500";
            iconDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-5xl"></i>';
        }
        
        modal.classList.remove('hidden');
    }
});
