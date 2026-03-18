document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('car-details-container');
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');

    if (!carId) {
        container.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-red-500 text-xl font-bold">لم يتم العثور على السيارة.</p></div>';
        return;
    }

    try {
        const res = await fetch('/api/cars');
        const cars = await res.json();
        const car = cars.find(c => c.id == carId);

        if (!car) {
            container.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-red-500 text-xl font-bold">عذراً، هذه السيارة غير موجودة في أسطولنا.</p></div>';
            return;
        }

        const hasDiscount = car.discount_price && car.discount_price < car.price;
        const currentPrice = hasDiscount ? car.discount_price : car.price;

        container.innerHTML = `
            <!-- Image Section -->
            <div class="reveal active">
                <div class="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group">
                    <img src="${car.image || 'https://via.placeholder.com/800x600'}" alt="${car.brand} ${car.model}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-background-dark/50 to-transparent"></div>
                    <div class="absolute bottom-10 right-10 flex gap-4">
                        <span class="glass px-6 py-2 rounded-full text-primary font-black text-sm uppercase tracking-widest">${car.status === 'Available' ? 'متاحة الآن' : 'محجوزة'}</span>
                    </div>
                </div>
            </div>

            <!-- Content Section -->
            <div class="text-right reveal active" style="transition-delay: 0.2s">
                <div class="mb-10">
                    <h4 class="text-primary font-black uppercase tracking-[0.4em] text-sm mb-4">${car.brand}</h4>
                    <h1 class="text-6xl md:text-7xl font-black text-white leading-tight mb-8">${car.model}</h1>
                    <div class="flex items-end gap-6 justify-end">
                        <div class="text-left font-display">
                            <span class="block text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] mb-1">ج.م / يوم</span>
                            <div class="flex items-center gap-4">
                                ${hasDiscount ? `<span class="text-slate-500 line-through text-2xl font-bold">${car.price}</span>` : ''}
                                <span class="text-primary text-6xl font-black leading-none">${currentPrice}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group">
                        <span class="material-symbols-outlined text-primary text-3xl opacity-50 group-hover:opacity-100">settings</span>
                        <div class="text-center">
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">ناقل الحركة</span>
                            <span class="text-white font-black text-sm">${car.transmission === 'Manual' ? 'مانيوال' : 'أوتوماتيك'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group">
                        <span class="material-symbols-outlined text-primary text-3xl opacity-50 group-hover:opacity-100">local_gas_station</span>
                        <div class="text-center">
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">الوقود</span>
                            <span class="text-white font-black text-sm">${car.fuel || '95'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group">
                        <span class="material-symbols-outlined text-primary text-3xl opacity-50 group-hover:opacity-100">palette</span>
                        <div class="text-center">
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">اللون</span>
                            <span class="text-white font-black text-sm">${car.color || 'فضي'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group">
                        <span class="material-symbols-outlined text-primary text-3xl opacity-50 group-hover:opacity-100">speed</span>
                        <div class="text-center">
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">المسافة</span>
                            <span class="text-white font-black text-sm">${car.mileage || '1,000'} KM</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-8 bg-surface/50 border border-white/5 p-10 rounded-[2.5rem] mb-12">
                    <div>
                        <h5 class="text-white font-black mb-4 text-xl">وصف السيارة</h5>
                        <p class="text-slate-400 font-light leading-relaxed">تتميز هذه السيارة ${car.brand} ${car.model} بأداء استثنائي وتصميم فخم يمنحك الراحة الكاملة على الطريق. مثالية للمناسبات الخاصة والاجتماعية.</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex items-center gap-4 justify-end text-slate-300">
                            <span>تأمين شامل</span>
                            <span class="material-symbols-outlined text-primary text-xl">verified</span>
                        </div>
                        <div class="flex items-center gap-4 justify-end text-slate-300">
                            <span>صيانة دورية</span>
                            <span class="material-symbols-outlined text-primary text-xl">build</span>
                        </div>
                        <div class="flex items-center gap-4 justify-end text-slate-300">
                            <span>نظام تكييف متطور</span>
                            <span class="material-symbols-outlined text-primary text-xl">ac_unit</span>
                        </div>
                        <div class="flex items-center gap-4 justify-end text-slate-300">
                            <span>نظام صوتي فاخر</span>
                            <span class="material-symbols-outlined text-primary text-xl">headset</span>
                        </div>
                    </div>
                </div>

                <a href="booking_flow.html?car_id=${car.id}" class="w-full bg-primary text-background-dark py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-6 hover:bg-white transition-all shadow-[0_15px_40px_rgba(201,169,110,0.3)] group">
                    <span>احجز هذه السيارة الآن</span>
                    <span class="material-symbols-outlined text-2xl group-hover:-translate-x-3 transition-transform">arrow_back</span>
                </a>
            </div>
        `;

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-red-500 text-xl font-bold">حدث خطأ أثناء تحميل البيانات.</p></div>';
    }
});
