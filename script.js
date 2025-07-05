const scriptURL = 'https://script.google.com/macros/s/AKfycbxL6OBodRQ0t_Ag3xXikue2RfTOi-UxYbayEwZ9fIXeVmHgTsCWc9JHXPx0Ns5Rijf4/exec';

// التحقق من تسجيل الدخول
if (location.pathname.endsWith('dashboard.html')) {
  if (localStorage.getItem('loggedIn') !== 'true') {
    location.href = 'index.html';
  }
}

// 🗺️ ربط الحقول بالترجمة العربية الموجودة في Google Sheet
const fieldMap = {
  fname: "الاسم",
  lname: "اللقب",
  dob: "تاريخ الميلاد",
  regNo: "رقم التسجيل",
  regPassStud: "الرقم السري",
  stream: "الشعبة",
  phase1: "مرحلة التسجيل الأولي",
  phase2: "مرحلة تأكيد التسجيل",
  pedDate: "تاريخ التسجيل البيداغوجي",
  socDate: "تاريخ تسجيل الخدمات الجامعية",
  wish: "الرغبة",
  major: "التخصص",
  state: "الولاية",
  payNotes: "حالة الدفع",
  grade: "المعدل"
};

const formEls = Object.keys(fieldMap);

function gatherFormData() {
  let data = {};
  formEls.forEach(id => {
    const arabicKey = fieldMap[id];
    const element = document.getElementById(id);
    data[arabicKey] = element ? element.value : '';
  });
  return data;
}

function fillForm(data) {
  for (const [engKey, arabicKey] of Object.entries(fieldMap)) {
    const element = document.getElementById(engKey);
    if (element) {
      element.value = data[arabicKey] || "";
    }
  }
}

async function postToSheet(action, data = {}) {
  try {
    const response = await fetch(`${scriptURL}?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return { error: 'حدث خطأ أثناء الاتصال بالخادم' };
  }
}

// تهيئة الأحداث في لوحة التحكم
if (location.pathname.endsWith('dashboard.html')) {
  const statusMsg = document.getElementById('statusMsg');

  document.getElementById('addStud')?.addEventListener('click', async () => {
    const data = gatherFormData();
    const result = await postToSheet('add', data);
    showStatusMessage(result);
  });

  document.getElementById('delStud')?.addEventListener('click', async () => {
    const regNo = prompt('أدخل رقم التسجيل للحذف');
    if (regNo) {
      const result = await postToSheet('delete', { "رقم التسجيل": regNo });
      showStatusMessage(result);
    }
  });

  document.getElementById('clearForm')?.addEventListener('click', () => {
    formEls.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
    showStatusMessage({ message: 'تم مسح النموذج بنجاح' });
  });

  document.getElementById('getStud')?.addEventListener('click', async () => {
    const regNo = prompt('أدخل رقم التسجيل');
    if (regNo) {
      const result = await postToSheet('get', { "رقم التسجيل": regNo });
      if (result.error) {
        showStatusMessage(result);
      } else {
        fillForm(result);
        showStatusMessage({ message: 'تم جلب البيانات بنجاح' });
      }
    }
  });

  document.getElementById('editStud')?.addEventListener('click', async () => {
    const data = gatherFormData();
    if (!data['رقم التسجيل']) {
      showStatusMessage({ error: 'يرجى إدخال رقم التسجيل أولاً' });
      return;
    }
    const result = await postToSheet('edit', data);
    showStatusMessage(result);
  });

  function showStatusMessage({ message, error }) {
    statusMsg.textContent = message || error;
    statusMsg.style.color = error ? 'red' : 'green';
    setTimeout(() => {
      statusMsg.textContent = '';
    }, 5000);
  }
}