document.addEventListener('DOMContentLoaded', async () => {
    const carsGrid = document.getElementById('home-cars-grid');
    const blogsGrid = document.getElementById('home-blogs-grid');
    
    // Fetch and populate top cars
    if (carsGrid) {
        try {
            const res = await fetch('/api/cars');
            const cars = await res.json();
            
            // Limit to 4 for homepage
            const showcaseCars = cars.slice(0, 4);
            carsGrid.innerHTML = '';
            
            showcaseCars.forEach(car => {
                carsGrid.innerHTML += `
                <div class="group surface rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 flex flex-col text-right hover:-translate-y-2">
                    <div class="h-60 relative overflow-hidden">
                        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="${car.image || 'https://via.placeholder.com/300'}" alt="${car.brand} ${car.model}"/>
                        <div class="absolute top-4 right-4 bg-primary text-background-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">جديد</div>
                    </div>
                    <div class="p-8 flex flex-1 flex-col">
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <h3 class="text-white font-black text-2xl mb-1">${car.brand}</h3>
                                <p class="text-slate-500 text-sm font-light tracking-wide">${car.model}</p>
                            </div>
                            <div class="text-left">
                                <span class="text-primary font-black text-2xl block">${car.price}</span>
                                <span class="text-slate-500 text-[10px] uppercase font-bold tracking-widest">ج.م / يوم</span>
                            </div>
                        </div>
                        <div class="flex gap-6 mb-8 justify-end border-t border-white/5 pt-6">
                            <div class="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                <span>${car.car_condition || 100}% حالة</span>
                                                                <i class="fa-solid fa-circle-check text-sm text-primary"></i>
                            </div>
                            <div class="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                <span>${car.transmission === 'Manual' ? 'مانيوال' : 'اتوماتيك'}</span>
                                                                <i class="fa-solid fa-gears text-sm text-primary"></i>
                            </div>
                            <div class="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                <span>${car.seats || 4} مقاعد</span>
                                                                <i class="fa-solid fa-chair text-sm text-primary"></i>
                            </div>
                        </div>
                        <a href="car_details.html?id=${car.id}" class="mt-auto block w-full bg-white/5 border border-white/10 text-white group-hover:bg-primary group-hover:text-background-dark group-hover:border-primary py-4 rounded-xl text-sm font-black transition-all text-center shadow-lg">
                            عرض التفاصيل
                        </a>
                    </div>
                </div>`;
            });
        } catch(e) { console.error('Failed to load cars', e); }
    }

    // Fetch and populate latest blogs
    if (blogsGrid) {
        try {
            const res = await fetch('/api/blogs');
            const blogs = await res.json();
            
            // Limit to 3 for homepage
            const showcaseBlogs = blogs.slice(0, 3);
            blogsGrid.innerHTML = '';
            
            if(showcaseBlogs.length === 0) {
                blogsGrid.innerHTML = '<p class="text-slate-500 w-full text-center col-span-3">لا توجد مقالات منشورة بعد.</p>';
            }

            showcaseBlogs.forEach(blog => {
                const date = new Date(blog.created_at);
                blogsGrid.innerHTML += `
                <div class="group surface rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-500 flex flex-col text-right hover:-translate-y-2">
                    <div class="h-64 relative overflow-hidden">
                        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" src="${blog.image || 'https://via.placeholder.com/300'}" alt="Article format image"/>
                    </div>
                    <div class="p-10 flex flex-1 flex-col relative">
                        <div class="absolute -top-8 left-10 bg-primary border-4 border-background-dark rounded-2xl p-4 text-center min-w-[70px] shadow-[0_10px_30px_rgba(201,169,110,0.3)]">
                            <span class="block text-background-dark font-black text-2xl leading-none">${date.getDate()}</span>
                            <span class="block text-background-dark/70 text-[10px] uppercase font-bold tracking-widest mt-1">${date.toLocaleString('ar-EG', { month: 'short' })}</span>
                        </div>
                        <div class="flex items-center gap-3 justify-end text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6 mt-4">
                            <span>بواسطة ${blog.author || 'الادمن'}</span>
                            <span class="w-1.5 h-1.5 rounded-full bg-primary/30"></span>
                            <span>اخبار اوتو لاين</span>
                        </div>
                        <h3 class="text-white font-black text-2xl mb-6 leading-tight group-hover:text-primary transition-colors cursor-pointer">${blog.title}</h3>
                        <p class="text-slate-400 text-sm font-light leading-relaxed mb-8 line-clamp-3">${blog.content}</p>
                        <a href="#" class="mt-auto inline-flex items-center gap-3 text-primary text-sm font-black hover:text-white transition-all w-fit mr-auto group/link">
                                                        <span>اقرأ المزيد</span>
                            <i class="fa-solid fa-arrow-left text-sm group-hover/link:-translate-x-2 transition-transform"></i>
                        </a>
                    </div>
                </div>`;
            });
        } catch(e) { console.error('Failed to load blogs', e); }
    }
});

function performSearch() {
    const location = document.getElementById('search-location').value;
    const pickup = document.getElementById('search-pickup').value;
    const dropoff = document.getElementById('search-dropoff').value;
    
    if (!pickup || !dropoff) {
        alert("يرجى اختيار تاريخ الاستلام والإرجاع");
        return;
    }

    if (new Date(pickup) > new Date(dropoff)) {
        alert("تاريخ الاستلام لا يمكن أن يكون بعد تاريخ الإرجاع");
        return;
    }

    const params = new URLSearchParams({
        location,
        pickup,
        dropoff
    });
    
    window.location.href = `vehicles_gallery.html?${params.toString()}`;
}
