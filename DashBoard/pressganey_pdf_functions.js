/* ================== PDF Helpers (safe RTL + big, clear charts) ================== */
function _pgFont(){ return currentLang === 'ar' ? 'Tajawal' : 'Inter'; }

/** يحوّل HTML صغير إلى صورة (للعناوين والجداول RTL) */
async function pg_htmlBlock({ width, html, scale=2 }) {
  const wrap = document.createElement('div');
  wrap.style.position='fixed'; wrap.style.left='-10000px'; wrap.style.top='0';
  wrap.style.width = width+'px'; wrap.style.fontFamily = _pgFont();
  wrap.dir = (currentLang==='ar'?'rtl':'ltr'); wrap.lang = currentLang;
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  const canvas = await html2canvas(wrap, { scale, backgroundColor: null });
  const dataURL = canvas.toDataURL('image/png', 1.0);
  document.body.removeChild(wrap);
  return { dataURL, w: canvas.width/scale, h: canvas.height/scale };
}

/** يضيف صورة مع ملاءمة لعرض الصفحة بدون قصّ وبالتمركز */
async function pg_addImageFit(doc, dataURL, y, maxWidth){
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      const W = doc.internal.pageSize.getWidth();
      const usable = Math.min(maxWidth, W - 56); // 28pt هامش من كل جانب
      const scale  = usable / img.width;
      const w = usable, h = img.height * scale;
      doc.addImage(dataURL, 'PNG', (W - w)/2, y, w, h);
      resolve(h);
    };
    img.src = dataURL;
  });
}

/** لقطة أوف-سكرين لدائري (Donut) بدقة عالية */
async function pg_snapshotDonut(chart, { size=800, scale=2.5 } = {}){
  if (!chart) return null;
  const cvs = document.createElement('canvas');
  cvs.style.position='fixed'; cvs.style.left='-10000px'; cvs.style.top='0';
  cvs.width = Math.floor(size*scale); cvs.height = Math.floor(size*scale);
  const ctx = cvs.getContext('2d'); ctx.scale(scale, scale);
  document.body.appendChild(cvs);

  const cfg = chart.config;
  const data = JSON.parse(JSON.stringify(cfg.data));
  const opts = JSON.parse(JSON.stringify(cfg.options || {}));
  opts.responsive = false; opts.maintainAspectRatio = false; opts.animation = false;
  // تكبير خط الداتا ليبلز داخل الدونت
  if (!opts.plugins) opts.plugins = {};
  if (!opts.plugins.datalabels) opts.plugins.datalabels = {};
  opts.plugins.datalabels.font = { family: _pgFont(), weight: 'bold', size: 18 };
  const copy = new Chart(cvs.getContext('2d'), { type: 'doughnut', data, options: opts });

  await new Promise(r => requestAnimationFrame(r));
  const dataURL = cvs.toDataURL('image/png', 1.0);
  copy.destroy(); cvs.remove();
  return { dataURL, w: size, h: size };
}

/** جدول HTML إلى صورة (يتجزّأ تلقائياً عند الحاجة) */
async function pg_addTablePaged(doc, { title, headers, rows, startY, pageMargin=28 }) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const usableW = W - pageMargin*2;
  const rowH = 34, headH = 46;
  const perPage = Math.max(8, Math.floor((H - startY - pageMargin - headH)/rowH));
  let idx = 0, y = startY;

  while (idx < rows.length) {
    const chunk = rows.slice(idx, idx + perPage);
    const html = `
      <div style="direction:${currentLang==='ar'?'rtl':'ltr'};text-align:${currentLang==='ar'?'right':'left'};font-family:${_pgFont()}">
        ${idx===0 && title ? `<div style="font-weight:700;font-size:16px;margin:0 0 10px">${title}</div>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr>
            ${headers.map(h=>`<th style="padding:8px;border:1px solid #e5e7eb;background:#2563eb;color:#fff">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${chunk.map(r=>`<tr>${r.map(c=>`<td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb">${c}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
    const block = await pg_htmlBlock({ width: Math.min(820, usableW), html, scale: 2 });
    const scale = Math.min(1, usableW/block.w), w = block.w*scale, h = block.h*scale;
    if (y + h > H - pageMargin) { doc.addPage(); y = pageMargin; }
    doc.addImage(block.dataURL, 'PNG', (W - w)/2, y, w, h);
    y += h + 12; idx += perPage;
    if (idx < rows.length) { doc.addPage(); y = pageMargin; }
  }
  return y;
}

/* ================== Export PressGaney -> PDF ================== */
async function exportPressGaneyPDF(){
  // قبل تنفيذ html2pdf(...).save() مباشرة
  const headerEl = document.querySelector('.header-title');
  let originalTitle = '';
  if (headerEl) {
    originalTitle = headerEl.textContent;
    // أزل التطويل فقط مؤقتًا (يبقى نفس العنوان بدون الزخرفة)
    const clean = originalTitle.replace(/ـ+/g, '');
    headerEl.textContent = clean || headerEl.getAttribute('data-ar') || 'عونك';
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 28, now = new Date();
  const dateStr = now.toLocaleString(currentLang==='ar'?'ar-SA':'en-GB');

  // Header/Footer خفيفة
  function headerFooter(){
    doc.setDrawColor(230); doc.setFillColor(245);
    doc.rect(0,0,W,40,'F');
    doc.setFontSize(10); doc.setTextColor(60);
    const title = currentLang==='ar' ? 'تقرير مؤشر برسجيني ' : 'Press Ganey – Professional Report';
    doc.text(title, M, 25, { lang: currentLang });
    doc.setDrawColor(230); doc.line(M,H-30,W-M,H-30);
    doc.setTextColor(120);
    doc.text(`${doc.getCurrentPageInfo().pageNumber} / ${doc.getNumberOfPages()}`, W-M, H-12, { align:'right' });
    doc.setTextColor(0);
  }

  // صفحة الغلاف (بدون شعار)
  const coverHTML = `
    <div style="text-align:center;padding:56px 10px;font-family:${_pgFont()}">
      <div style="font-weight:800;font-size:26px;margin-bottom:10px">${currentLang==='ar'?'مؤشر برسجيني  – تقرير':'Press Ganey – Report'}</div>
      <div style="font-size:12px;color:#555">${currentLang==='ar'?'تاريخ الإنشاء':'Generated on'}: ${dateStr}</div>
      <div style="margin-top:14px;font-size:13px">
        <span>${currentLang==='ar'?'إجمالي الأقسام:':'Departments:'} <b>${cardData.totalDepartmentsSurvey||0}</b></span>
        &nbsp;•&nbsp;
        <span>${currentLang==='ar'?'متوسط الرضا العام:':'Avg. Satisfaction:'} <b>${cardData.averageSatisfactionScore||'0.0'}%</b></span>
      </div>
    </div>`;
  const cover = await pg_htmlBlock({ width: 680, html: coverHTML, scale: 2 });
  await pg_addImageFit(doc, cover.dataURL, 120, W - M*2);

  // صفحة الإجمالي (الدائرة الكبيرة + عنوان واضح)
  doc.addPage(); headerFooter();
  const pageTitle = currentLang==='ar' ? 'نسبة الرضا العام للمستشفى' : 'Overall Hospital Satisfaction';
  const titleBlock = await pg_htmlBlock({
    width: W - M*2,
    html: `<div style="font-weight:900;font-size:28px;line-height:1.5;text-align:center;color:#000;padding-bottom:20px;font-family:${_pgFont()}">${pageTitle}</div>`
  });
  doc.addImage(titleBlock.dataURL, 'PNG', M, 60, W - M*2, titleBlock.h);
  const titleH = titleBlock.h + 20;

  // لقطة أوف-سكرين للدائرة العامة بدقّة عالية
  const donutShot = await pg_snapshotDonut(overallSatisfactionChart, { size: 820, scale: 2.5 });
  if (donutShot) {
    const h = await pg_addImageFit(doc, donutShot.dataURL, 80 + titleH, W - M*1.2);
    // أسفلها جدول صغير بنِسَب "راضي/غير راضي"
    const os = Number(overallSatisfactionData.satisfied)||0;
    const on = Number(overallSatisfactionData.notSatisfied)||0;
    const tot = os+on || 1;
    const rows = [
      [ currentLang==='ar'?'راضي':'Satisfied',  `${((os/tot)*100).toFixed(1)}%` ],
      [ currentLang==='ar'?'غير راضي':'Not Satisfied', `${((on/tot)*100).toFixed(1)}%` ]
    ];
    await pg_addTablePaged(doc, {
      title: currentLang==='ar'?'تفاصيل الإجمالي':'Overall Details',
      headers: [ currentLang==='ar'?'البند':'Item', currentLang==='ar'?'النسبة':'Percent' ],
      rows, startY: 100 + titleH + h
    });
  }

  // صفحة الأقسام: جدول متجزّئ (أسماء + نسب)
  doc.addPage(); headerFooter();
  const deptTitle = await pg_htmlBlock({
    width: W - M*2,
    html: `<div style="font-weight:900;font-size:22px;line-height:1.5;text-align:center;color:#000;padding-bottom:10px;font-family:${_pgFont()}">
            ${currentLang==='ar'?'نِسَب الرضا حسب القسم':'Satisfaction by Department'}
           </div>`
  });
  doc.addImage(deptTitle.dataURL, 'PNG', M, 60, W - M*2, deptTitle.h);

  const deptRows = Object.entries(departmentChartData).map(([k,d])=>{
    const s = Number(d.satisfied)||0, n = Number(d.notSatisfied)||0, t = s+n||1;
    const name = currentLang==='ar' ? (d.ar||k) : (d.en||k);
    return [ name, `${((s/t)*100).toFixed(1)}%`, `${((n/t)*100).toFixed(1)}%` ];
  });

  await pg_addTablePaged(doc, {
    title: currentLang==='ar'?'تفاصيل الأقسام':'Departments Details',
    headers: [ currentLang==='ar'?'القسم':'Department', currentLang==='ar'?'راضٍ':'Satisfied', currentLang==='ar'?'غير راضٍ':'Not Satisfied' ],
    rows: deptRows,
    startY: 60 + deptTitle.h + 20
  });

  // ✅ افتح في تبويب جديد بدل التنزيل
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');

  // بعد انتهاء الحفظ/الوعد:
  if (headerEl) headerEl.textContent = originalTitle;
}

/* ================== Bind PDF button ================== */
document.addEventListener('DOMContentLoaded', () => {
  const pdfBtn = document.getElementById('exportPressganeyPdfBtn');
  if (!pdfBtn) return;
  pdfBtn.addEventListener('click', async () => {
    try {
      const old = pdfBtn.innerHTML; pdfBtn.disabled = true;
      pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin ml-2"></i><span>جاري التصدير...</span>';
      await exportPressGaneyPDF();
      pdfBtn.innerHTML = old; pdfBtn.disabled = false;
    } catch (e) {
      console.error('PDF export failed:', e);
      pdfBtn.disabled = false;
      alert(currentLang==='ar'?'فشل تصدير PDF':'PDF export failed');
    }
  });
});
