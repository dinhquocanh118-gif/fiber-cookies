const form = document.querySelector('#lead-form');
const button = form.querySelector('button[type=submit]');
const status = document.querySelector('#form-status');
const flavor = document.querySelector('#flavor');
const config = window.FIBER_CONFIG;
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config?.supabaseUrl ?? '') &&
  /^sb_publishable_[\w-]+$/.test(config?.publishableKey ?? '');

let requestId = crypto.randomUUID();
let busy = false;

function showStatus(message, tone) {
  status.textContent = message;
  status.dataset.tone = tone;
}

for (const link of document.querySelectorAll('[data-flavor]')) {
  link.addEventListener('click', () => {
    if (!busy) {
      flavor.value = link.dataset.flavor;
      requestId = crypto.randomUUID();
    }
  });
}

button.disabled = !configured;
if (!configured) {
  showStatus('Biểu mẫu sẽ mở khi đội Fiber Cookies thiết lập nơi nhận đăng ký.', 'info');
}

form.addEventListener('input', () => {
  if (!busy) requestId = crypto.randomUUID();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy || !configured) return;

  const fields = new FormData(form);
  const data = Object.fromEntries(fields);
  const name = data.name.trim();
  const email = data.email.trim();
  const phone = data.phone.trim();
  if (name.length < 2 || (!email && !phone) || (phone && !/^\+?\d{8,15}$/.test(phone.replace(/[\s().-]/g, '')))) {
    showStatus('Vui lòng kiểm tra họ tên và nhập email hoặc số điện thoại hợp lệ.', 'error');
    return;
  }

  busy = true;
  const controls = [...form.querySelectorAll('input, select, textarea, button')];
  for (const control of controls) control.disabled = true;
  form.setAttribute('aria-busy', 'true');
  showStatus('Đang gửi đăng ký…', 'info');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/submit-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: config.publishableKey },
      body: JSON.stringify({ ...data, name, email, phone, requestId, consent: fields.has('consent') }),
      signal: AbortSignal.timeout(12000)
    });
    const result = await response.json();
    if (response.ok && result.accepted === true) {
      form.reset();
      requestId = crypto.randomUUID();
      showStatus('Đã nhận đăng ký. Đội Fiber Cookies sẽ liên hệ lại khi có thông tin về sản phẩm.', 'success');
    } else if (response.status === 429) {
      showStatus('Bạn đã gửi nhiều đăng ký trong thời gian ngắn. Vui lòng thử lại sau.', 'error');
    } else if (response.status === 400) {
      showStatus('Vui lòng kiểm tra lại nội dung đã nhập và xác nhận đồng ý.', 'error');
    } else {
      throw new Error('Submission failed');
    }
  } catch {
    showStatus('Chưa xác nhận được đăng ký. Vui lòng thử gửi lại.', 'error');
  } finally {
    for (const control of controls) control.disabled = false;
    form.removeAttribute('aria-busy');
    busy = false;
  }
});
