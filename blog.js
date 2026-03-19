document.addEventListener('DOMContentLoaded', async () => {
    const blogGrid = document.getElementById('blog-grid');
    if (!blogGrid) return;
    
    try {
        const res = await fetch('/api/blogs');
        const blogs = await res.json();
        
        blogGrid.innerHTML = '';
        
        if (blogs.length === 0) {
            blogGrid.innerHTML = `
                <div class="col-span-full text-center py-20 flex flex-col items-center gap-4">
                                        <i class="fa-solid fa-file-circle-xmark text-slate-600 text-6xl"></i>
                    <p class="text-slate-500 text-xl font-bold">لا توجد مقالات منشورة بعد.</p>
                </div>`;
            return;
        }

        blogs.forEach((blog, index) => {
            const date = new Date(blog.created_at);
            blogGrid.innerHTML += `
            <div class="group surface rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-700 flex flex-col text-right hover:-translate-y-3 reveal active" style="transition-delay: ${index * 0.1}s">
                <div class="h-72 relative overflow-hidden">
                    <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" src="${blog.image || 'https://via.placeholder.com/300'}" alt="${blog.title}"/>
                </div>
                <div class="p-10 flex flex-1 flex-col relative text-right">
                    <div class="absolute -top-10 left-10 bg-primary border-4 border-background-dark rounded-2xl p-4 text-center min-w-[80px] shadow-[0_15px_35px_rgba(201,169,110,0.4)]">
                        <span class="block text-background-dark font-black text-3xl leading-none">${date.getDate()}</span>
                        <span class="block text-background-dark/70 text-[10px] uppercase font-black tracking-[0.2em] mt-1">${date.toLocaleString('ar-EG', { month: 'short' })}</span>
                    </div>
                    
                    <div class="flex items-center gap-3 justify-end text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8 mt-4">
                        <span>بواسطة ${blog.author || 'الادمن'}</span>
                        <span class="w-2 h-2 rounded-full bg-primary/20"></span>
                        <span>أخبار السيارات الفاخرة</span>
                    </div>

                    <h3 class="text-white font-black text-3xl mb-6 leading-tight group-hover:text-primary transition-colors cursor-pointer line-clamp-2">${blog.title}</h3>
                    <p class="text-slate-400 text-base font-light leading-relaxed mb-10 line-clamp-3">${blog.content}</p>
                    
                    <a href="#" class="mt-auto inline-flex items-center gap-4 text-primary text-sm font-black hover:text-white transition-all w-fit mr-auto group/link">
                        <span>اقرأ المزيد</span>
                                                <i class="fa-solid fa-arrow-left text-sm group-hover/link:-translate-x-3 transition-transform"></i>
                    </a>
                </div>
            </div>`;
        });
    } catch(e) {
        console.error('Failed to load blogs', e);
        blogGrid.innerHTML = '<p class="text-red-500 w-full text-center py-20">فشل في تحميل المقالات.</p>';
    }
});
