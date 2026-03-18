document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('car_id');
    
    if (!carId) {
        alert("يرجى اختيار سيارة أولاً.");
        window.location.href = 'vehicles_gallery.html';
        return;
    }

    let selectedCar = null;
    let pricePerDay = 0;

    const startDateInput = document.getElementById('start_date');
    const endDateInput = document.getElementById('end_date');
    const bookingForm = document.getElementById('booking-form');
    
    // Setup sensible default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    startDateInput.value = today.toISOString().split('T')[0];
    endDateInput.value = tomorrow.toISOString().split('T')[0];
    startDateInput.min = today.toISOString().split('T')[0];

    // Fetch Car details
    try {
        const res = await fetch('/api/cars');
        const cars = await res.json();
        selectedCar = cars.find(c => c.id == carId);
        
        if (!selectedCar) throw new Error('Car not found');
        
        const hasDiscount = selectedCar.discount_price && selectedCar.discount_price < selectedCar.price;
        pricePerDay = hasDiscount ? parseFloat(selectedCar.discount_price) : parseFloat(selectedCar.price);
        
        renderSummary();
    } catch(err) {
        console.error(err);
        document.getElementById('summary-section').innerHTML = '<p class="text-red-500 text-center w-full my-auto font-bold">حدث خطأ أثناء تحميل تفاصيل السيارة. يرجى المحاولة مرة أخرى.</p>';
        return;
    }

    // Re-render when dates change
    startDateInput.addEventListener('change', () => {
        if(endDateInput.value && startDateInput.value > endDateInput.value) {
            endDateInput.value = startDateInput.value;
        }
        endDateInput.min = startDateInput.value;
        renderSummary();
    });
    
    endDateInput.addEventListener('change', renderSummary);

    function calculateTotal() {
        if(!startDateInput.value || !endDateInput.value) return { days: 0, total: 0 };
        const start = new Date(startDateInput.value);
        const end = new Date(endDateInput.value);
        
        const diffTime = Math.abs(end - start);
        const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        return {
            days: diffDays,
            total: diffDays * pricePerDay
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
                <div class="flex justify-between items-center text-sm font-bold">
                    <span class="text-emerald-500">مشمول</span>
                    <span class="text-slate-500">التأمين</span>
                </div>
            </div>

            <div class="mt-12 pt-8 border-t border-white/10">
                <div class="flex justify-between items-end">
                    <div class="text-left">
                        <span class="block text-[10px] font-black text-primary uppercase tracking-widest mb-1">المجموع الكلي</span>
                        <span class="text-3xl font-black text-white">${totals.total.toFixed(2)} <span class="text-xs font-bold text-slate-500">ج.م</span></span>
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
        formData.append('car_id', carId);
        formData.append('start_date', startDateInput.value);
        formData.append('end_date', endDateInput.value);
        formData.append('total_amount', calculateTotal().total);
        formData.append('customer_name', document.getElementById('customer_name').value);
        formData.append('customer_email', document.getElementById('customer_email').value);
        formData.append('customer_phone', document.getElementById('customer_phone').value);
        
        
        const btn = document.getElementById('submit-booking-btn');
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">refresh</span> جاري الحجز...';
        btn.disabled = true;
        
        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                showModal(true, "تم تأكيد الحجز!", "سيارتك الفاخرة مؤمنة. سنقوم بالتواصل معك قريباً لتأكيد الموعد.");
                bookingForm.reset();
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
            iconDiv.innerHTML = '<span class="material-symbols-outlined text-5xl">check_circle</span>';
        } else {
            iconDiv.className = "mx-auto w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 bg-red-500/10 text-red-500";
            iconDiv.innerHTML = '<span class="material-symbols-outlined text-5xl">error</span>';
        }
        
        modal.classList.remove('hidden');
    }
});
