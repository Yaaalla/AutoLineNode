document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('car-details-container');
    const urlParams = new URLSearchParams(window.location.search);
    const carId = urlParams.get('id');

    if (!carId) {
        container.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-red-500 text-xl font-bold">لم يتم العثور على السيارة.</p></div>';
        return;
    }

    try {
        const res = await fetch(`/api/cars/${carId}`);
        const car = await res.json();

        if (!car || car.error) {
            container.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-red-500 text-xl font-bold">عذراً، هذه السيارة غير موجودة في أسطولنا.</p></div>';
            return;
        }

        const hasDiscount = car.discount_price && car.discount_price < car.price;
        const currentPrice = hasDiscount ? car.discount_price : car.price;

        // Collect all images (main + additional)
        const allImages = [car.image, ...(car.images || [])].filter(img => img);

        container.innerHTML = `
            <!-- Image Section -->
            <div class="reveal active space-y-6">
                <div class="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group aspect-[4/3]">
                    <img id="main-car-image" src="${car.image || 'https://via.placeholder.com/800x600'}" alt="${car.brand} ${car.model}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"/>
                    <div class="absolute inset-0 bg-gradient-to-t from-background-dark/50 to-transparent"></div>
                    <div class="absolute bottom-10 right-10 flex gap-4">
                        <span class="glass px-6 py-2 rounded-full text-primary font-black text-sm uppercase tracking-widest">${car.status === 'Available' ? 'متاحة الآن' : 'محجوزة'}</span>
                    </div>
                </div>
                
                <!-- Thumbnails Gallery -->
                ${allImages.length > 1 ? `
                <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                    ${allImages.map((img, idx) => `
                        <div onclick="changeMainImage('${img}', this)" class="flex-shrink-0 w-24 h-16 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${idx === 0 ? 'border-primary' : 'border-white/10 opacity-60 hover:opacity-100'}">
                            <img src="${img}" class="w-full h-full object-cover" />
                        </div>
                    `).join('')}
                </div>
                ` : ''}
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

                <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group text-center">
                                                <i class="fa-solid fa-circle-check text-primary text-3xl opacity-50 group-hover:opacity-100"></i>
                        <div>
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">حالة السيارة</span>
                            <span class="text-white font-black text-sm">${car.car_condition || 100}%</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group text-center">
                                                <i class="fa-solid fa-circle-dot text-primary text-3xl opacity-50 group-hover:opacity-100"></i>
                        <div>
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">حالة الكاوتش</span>
                            <span class="text-white font-black text-sm">${car.tire_condition || 'ممتازة'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group text-center">
                                                <i class="fa-solid fa-gears text-primary text-3xl opacity-50 group-hover:opacity-100"></i>
                        <div>
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">ناقل الحركة</span>
                            <span class="text-white font-black text-sm">${car.transmission === 'Manual' ? 'مانيوال' : 'أوتوماتيك'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group text-center">
                                                <i class="fa-regular fa-calendar-check text-primary text-3xl opacity-50 group-hover:opacity-100"></i>
                        <div>
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">الموديل (السنة)</span>
                            <span class="text-white font-black text-sm">${car.year || '2024'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group text-center">
                                                <i class="fa-solid fa-gas-pump text-primary text-3xl opacity-50 group-hover:opacity-100"></i>
                        <div>
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">الوقود</span>
                            <span class="text-white font-black text-sm">${car.fuel || '95'}</span>
                        </div>
                    </div>
                    <div class="surface p-6 rounded-[2rem] border border-white/5 flex flex-col items-center gap-4 hover:border-primary/50 transition-all group text-center">
                                                <i class="fa-solid fa-palette text-primary text-3xl opacity-50 group-hover:opacity-100"></i>
                        <div>
                            <span class="block text-slate-500 text-[8px] uppercase font-bold tracking-widest mb-1">اللون</span>
                            <span class="text-white font-black text-sm">${car.color || 'فضي'}</span>
                        </div>
                    </div>
                </div>

                ${car.status === 'Available' ? `
                <a href="booking_flow.html?car_id=${car.id}${urlParams.get('pickup') ? `&start_date=${urlParams.get('pickup')}&end_date=${urlParams.get('dropoff')}&location=${urlParams.get('location')}` : ''}" class="w-full bg-primary text-background-dark py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-6 hover:bg-white transition-all shadow-[0_15px_40px_rgba(201,169,110,0.3)] group">
                                        <span>احجز هذه السيارة الآن</span>
                    <i class="fa-solid fa-arrow-left text-2xl group-hover:-translate-x-3 transition-transform"></i>
                </a>
                ` : `
                <div class="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-6 rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-2">
                    <span class="flex items-center gap-3">
                                                <i class="fa-solid fa-calendar-xmark"></i> 
                        عذراً، هذه السيارة محجوزة حالياً
                    </span>
                    <span class="text-xs font-bold opacity-60">محجوزة حتى تاريخ: ${new Date(car.reserved_until).toLocaleDateString('ar-EG')}</span>
                </div>
                `}
            </div>
        `;

        // Add Gallery Switcher Logic
        window.changeMainImage = (src, el) => {
            const mainImg = document.getElementById('main-car-image');
            mainImg.src = src;
            
            // Update active state of thumbnails
            document.querySelectorAll('[onclick^="changeMainImage"]').forEach(thumb => {
                thumb.classList.remove('border-primary');
                thumb.classList.add('border-white/10', 'opacity-60');
            });
            el.classList.add('border-primary');
            el.classList.remove('border-white/10', 'opacity-60');
        };

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="col-span-full text-center py-20"><p class="text-red-500 text-xl font-bold">حدث خطأ أثناء تحميل البيانات.</p></div>';
    }
});
