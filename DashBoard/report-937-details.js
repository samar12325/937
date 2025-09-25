document.addEventListener("DOMContentLoaded", function () {
    const p = new URLSearchParams(location.search);
    const categoryParam   = p.get("category")   || localStorage.getItem("report937:selectedCategory")   || "";
    const departmentParam = p.get("department") || localStorage.getItem("report937:selectedDepartment") || "";
  
    const rows = JSON.parse(localStorage.getItem("report937:rows:v1") || "[]");
    const container = document.getElementById("details-container");
    const h2 = document.querySelector("h2");
    const AR_DIACRITICS = /[\u064B-\u0652]/g;
    const norm = s => String(s || "").replace(AR_DIACRITICS, "").toLowerCase().trim().replace(/\s+/g, " ");
  
    function findKey(keys, patterns) {
      for (const k of keys) {
        const nk = norm(k);
        if (patterns.some(pat => nk.includes(norm(pat)))) return k;
      }
      return null;
    }
  
    // المرادفات اللي خزّناها من الداشبورد
    const catAliases  = JSON.parse(localStorage.getItem("report937:selectedCategoryAliases")  || "[]");
    const deptAliases = JSON.parse(localStorage.getItem("report937:selectedDepartmentAliases")|| "[]");
  
    function matchWithAliases(value, target, aliases = []) {
      if (!target) return false;
      const v = norm(value);
      const t = norm(target);
      if (v.includes(t)) return true;
      for (const a of aliases) if (v.includes(norm(a))) return true;
      return false;
    }
  
    function showMsg(msg){
      container.innerHTML = `<div class="p-4 bg-yellow-50 border border-yellow-200 rounded">${msg}</div>`;
    }
  
    if (!rows.length){
      h2 && (h2.textContent = "تفاصيل البلاغات");
      showMsg("لا توجد بيانات بعد. استوردي ملفات Excel من لوحة المؤشرات ثم عودي هنا.");
      return;
    }
  
    const keys = Object.keys(rows[0] || {});
    const categoryKey = findKey(keys, ["تصنيف البلاغ","التصنيف","تصنيف","category","classification","type"]);
    const deptKey     = findKey(keys, ["الإدارة/القسم","القسم/الإدارة","الإدارة","الادارة","القسم","department","section","unit","dept"]);
  
    let title = "تفاصيل البلاغات";
    let filtered = rows.slice();
  
    // فلترة بالتصنيف أو بالقسم
    if (categoryParam){
      title = `تفاصيل البلاغات — التصنيف: ${categoryParam}`;
      if (categoryKey){
        filtered = rows.filter(r => matchWithAliases(r[categoryKey], categoryParam, catAliases));
      }else{
        filtered = [];
      }
    } else if (departmentParam){
      title = `تفاصيل البلاغات — القسم/الإدارة: ${departmentParam}`;
      if (deptKey){
        filtered = rows.filter(r => matchWithAliases(r[deptKey], departmentParam, deptAliases));
      }else{
        filtered = [];
      }
      // ✅ توسيع المطابقة: لو ما لقينا عمود للقسم أو النتيجة فاضية، نفتش كل الأعمدة
      if (!filtered.length){
        filtered = rows.filter(r => {
          return Object.values(r).some(v => matchWithAliases(v, departmentParam, deptAliases));
        });
      }
    }
  
    h2 && (h2.textContent = title);
    container.innerHTML = "";
  
    if (!filtered.length){
      if (departmentParam && !deptKey){
        showMsg("تعذّر العثور على عمود القسم/الإدارة. تم البحث في جميع الأعمدة ولم نجد سجلات مطابقة.");
      } else if (departmentParam){
        showMsg("لا توجد سجلات مطابقة للقسم المحدد.");
      } else if (categoryParam && !categoryKey){
        showMsg("تعذّر العثور على عمود التصنيف في الملف.");
      } else {
        showMsg("لا توجد سجلات مطابقة للفلتر الحالي.");
      }
      return;
    }
  
    // عرض السجلات
    filtered.forEach((row, i) => {
      const div = document.createElement("div");
      div.className = "record border rounded p-2 mb-2 bg-gray-50";
      div.innerHTML = `
        <div><strong>#${i + 1}</strong></div>
        <div><b>الوصف:</b> ${row["الوصف"] ?? row["Description"] ?? "—"}</div>
        <div><b>التصنيف:</b> ${categoryKey ? (row[categoryKey] ?? "—") : "—"}</div>
        <div><b>الإدارة/القسم:</b> ${deptKey ? (row[deptKey] ?? "—") : "—"}</div>
        <div><b>التاريخ:</b> ${row["التاريخ"] ?? row["Date"] ?? row["تاريخ البلاغ"] ?? "—"}</div>
      `;
      container.appendChild(div);
    });
  });
  