document.addEventListener('DOMContentLoaded', async () => {
    const carsGrid = document.getElementById('cars-grid');
    const filterForm = document.getElementById('filter-form');
    const brandFilter = document.getElementById('brand-filter');
    const colorFilter = document.getElementById('color-filter');
    const priceFilter = document.getElementById('price-filter');
    
    if (!carsGrid) return;
    
    let allCars = [];

    async function loadCars() {
        try {
            carsGrid.innerHTML = '<p class="text-center w-full text-slate-400 py-10">جاري تحميل الأسطول...</p>';
            const res = await fetch('/api/cars');
            allCars = await res.json();
            
            populateFilters(allCars);
            renderCars(allCars);
        } catch(err) {
            console.error(err);
            carsGrid.innerHTML = '<p class="text-red-500 w-full text-center">فشل في تحميل السيارات.</p>';
        }
    }

    function populateFilters(cars) {
        const brands = [...new Set(cars.map(c => c.brand))].sort();
        const colors = [...new Set(cars.map(c => c.color))].filter(c => c).sort();

        brands.forEach(brand => {
            const opt = document.createElement('option');
            opt.value = brand;
            opt.textContent = brand;
            brandFilter.appendChild(opt);
        });

        colors.forEach(color => {
            const opt = document.createElement('option');
            opt.value = color;
            opt.textContent = color;
            colorFilter.appendChild(opt);
        });
    }

    function renderCars(cars) {
        carsGrid.innerHTML = '';
        
        if (cars.length === 0) {
            carsGrid.innerHTML = '<p class="text-center w-full text-slate-400 py-10 col-span-full">لا توجد سيارات تطابق بحثك.</p>';
            return;
        }

        cars.forEach((car, index) => {
            const hasDiscount = car.discount_price && car.discount_price < car.price;
            const currentPrice = hasDiscount ? car.discount_price : car.price;
            
            const badgeHtml = car.status === 'Available' ? 
                `<span class="bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 text-[10px] font-black px-4 py-1.5 rounded-full backdrop-blur-md">متاحة الآن</span>` :
                `<span class="bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[10px] font-black px-4 py-1.5 rounded-full backdrop-blur-md">محجوزة</span>`;

            carsGrid.innerHTML += `
            <div class="group surface rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-700 flex flex-col text-right hover:-translate-y-3 reveal active" style="transition-delay: ${index * 0.1}s">
                <div class="h-72 relative overflow-hidden">
                    <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src="${car.image || 'https://via.placeholder.com/300'}" alt="${car.brand} ${car.model}"/>
                    <div class="absolute top-6 right-6 z-20">${badgeHtml}</div>
                    <div class="absolute inset-0 bg-gradient-to-t from-background-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div class="p-10 flex flex-1 flex-col">
                    <div class="flex justify-between items-start mb-8">
                        <div class="text-left">
                            ${hasDiscount ? `<p class="text-slate-500 line-through text-xs mb-1 font-bold">${car.price} ج.م</p>` : ''}
                            <p class="text-primary font-black text-3xl tracking-tight">${currentPrice}</p>
                            <p class="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mt-1">ج.م / يوم</p>
                        </div>
                        <div class="text-right">
                            <p class="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2">${car.brand}</p>
                            <h3 class="text-white font-black text-3xl leading-tight">${car.model}</h3>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-y-6 gap-x-8 mb-10 border-y border-white/5 py-8">
                        <div class="flex items-center gap-3 justify-end text-slate-400 group/icon">
                            <span class="text-xs font-bold group-hover:text-white transition-colors">${car.transmission === 'Manual' ? 'مانيوال' : 'أوتوماتيك'}</span>
                            <span class="material-symbols-outlined text-xl text-primary/50 group-hover:text-primary transition-colors">settings</span>
                        </div>
                        <div class="flex items-center gap-3 justify-end text-slate-400 group/icon">
                            <span class="text-xs font-bold group-hover:text-white transition-colors">${car.fuel || '95'}</span>
                            <span class="material-symbols-outlined text-xl text-primary/50 group-hover:text-primary transition-colors">local_gas_station</span>
                        </div>
                        <div class="flex items-center gap-3 justify-end text-slate-400 group/icon">
                            <span class="text-xs font-bold group-hover:text-white transition-colors">${car.color || 'فضي'}</span>
                            <span class="material-symbols-outlined text-xl text-primary/50 group-hover:text-primary transition-colors">palette</span>
                        </div>
                        <div class="flex items-center gap-3 justify-end text-slate-400 group/icon">
                            <span class="text-xs font-bold group-hover:text-white transition-colors">${car.mileage || '1,000'} KM</span>
                            <span class="material-symbols-outlined text-xl text-primary/50 group-hover:text-primary transition-colors">speed</span>
                        </div>
                    </div>

                    <a href="car_details.html?id=${car.id}" class="mt-auto block w-full bg-white/5 border border-white/10 text-white group-hover:bg-primary group-hover:text-background-dark group-hover:border-primary py-5 rounded-2xl text-sm font-black transition-all text-center shadow-lg">
                        عرض التفاصيل
                    </a>
                </div>
            </div>`;
        });
    }

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const brand = brandFilter.value;
        const color = colorFilter.value;
        const maxPrice = priceFilter.value ? parseFloat(priceFilter.value) : Infinity;

        const filtered = allCars.filter(car => {
            const matchesBrand = brand === 'all' || car.brand === brand;
            const matchesColor = color === 'all' || car.color === color;
            const matchesPrice = (car.discount_price || car.price) <= maxPrice;
            return matchesBrand && matchesColor && matchesPrice;
        });

        renderCars(filtered);
    });

    loadCars();
});
