# 📂 Case Register System  

A **web-based case management system** built with **HTML, CSS, JavaScript, and Supabase**.  
Designed for administrators and officers to **record, track, search, and manage cases** efficiently with role-based dashboards.  

---

## 🚀 Features
- **User Authentication** (Supabase Auth)
- **Role-based dashboards**  
  - Admin → view officer stats & system-wide cases  
  - Officer → manage personal assigned cases  
- **Case Management**  
  - Add, edit, delete, and view detailed case records  
  - Attach officer handling information  
  - Track status: `Open`, `In Progress`, `Concluded`
- **Search & Filtering**  
  - By date, complainant, respondent, case nature, or status  
- **Pagination for Cases** (efficient loading of large datasets)
- **Officer Statistics** (total, active, and concluded cases per officer)
- **Profile Management** (officers can update contact info and region)
- **Responsive UI** (mobile-friendly with sidebar toggle)
- **Optimistic Updates** for instant UI refresh after edits or deletions  

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript  
- **Backend / Database:** Supabase (PostgreSQL + Auth + Storage)  
- **Auth:** Supabase Authentication  
- **Data Fetching:** Supabase JS Client  

---

## 📊 Future Improvements
- Infinite scroll for cases
- Role-based permissions on database level (RLS in Supabase)
- Full-text search with Postgres **GIN indexes**
- Case attachments (file upload via Supabase Storage)  

---

## Built with ❤️ by Mondli
