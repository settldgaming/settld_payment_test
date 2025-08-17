(function () {
  const config = window.SETTLD_CONFIG || {};

  function defaultCreateRequest(token, payload) {
    return fetch(`${config.apiBaseUrl}/deposit/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = data && data.error ? data.error : 'request_rejected';
        throw new Error(msg);
      }
      return data;
    });
  }
  function connectEvents(token, userId, onMessage) {
    const url = `${config.apiBaseUrl}/events?userId=${encodeURIComponent(userId)}`;
    const controller = new AbortController();
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` }, signal: controller.signal }).then(async resp => {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              onMessage(JSON.parse(line.slice(6)));
            } catch (e) {}
          }
        }
      }
    });
    return () => controller.abort();
  }

  window.initSettldPaymentTracking = function (createRequest) {
    createRequest = createRequest || defaultCreateRequest;
    const form = document.getElementById('depositForm');
    const tracking = document.getElementById('tracking');
    const qrImg = document.getElementById('qrCode');
    const paymentUrlSpan = document.getElementById('paymentUrl');
    const paymentLinkDiv = document.getElementById('paymentLink');
    const copyBtn = document.getElementById('copyBtn');
    const statusDiv = document.getElementById('status');
    const countdownDiv = document.getElementById('countdown');
    const successDetails = document.getElementById('successDetails');
    const callbackDetails = document.getElementById('callbackDetails');
    const restartBtn = document.getElementById('restart');
    
    let countdownInterval;

    restartBtn.addEventListener('click', () => {
      window.location.reload();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(form).entries());
      const token = formData.authToken;
      delete formData.authToken;
      form.style.display = 'none';

      try {
        const resp = await createRequest(token, formData);
        if (!resp || resp.error || !resp.qrCodeUrl || !resp.paymentUri) {
          throw new Error(resp && resp.error ? resp.error : 'request_rejected');
        }
        qrImg.src = resp.qrCodeUrl;
        paymentUrlSpan.textContent = resp.paymentUri;
        tracking.style.display = 'block';
        qrImg.style.display = '';
        paymentLinkDiv.style.display = '';
        statusDiv.textContent = 'Awaiting deposit...'; 
        copyBtn.onclick = () => navigator.clipboard.writeText(resp.paymentUri);
        const stop = connectEvents(token, formData.userId, (data) => {
          if (data.userId === formData.userId) {
            stop();
            clearInterval(countdownInterval);
            countdownDiv.textContent = '';
            statusDiv.textContent = `Payment of ${data.amount} ${data.currency} received.`;
            qrImg.style.display = 'none';
            paymentLinkDiv.style.display = 'none';

            let details = '';
            if (data.from) details += `<div>From: ${data.from}</div>`;
            if (data.to) details += `<div>To: ${data.to}</div>`;
            if (data.chain) details += `<div>Chain: ${data.chain}</div>`;
            if (data.chainId !== undefined) details += `<div>Chain ID: ${data.chainId}</div>`;
            if (data.confirmedAt) details += `<div>Confirmed At: ${data.confirmedAt}</div>`;
            if (data.txHash) {
              if (config.etherscanTxUrl) {
                const url = `${config.etherscanTxUrl}${data.txHash}`;
                details += `<div>Tx Hash: <a href="${url}" target="_blank">${data.txHash}</a></div>`;
              } else {
                details += `<div>Tx Hash: ${data.txHash}</div>`;
              }
            }

            callbackDetails.innerHTML = details;
            successDetails.style.display = 'block';
          }
        });
        
        let remaining = 300;
        countdownDiv.textContent = `Time remaining: ${remaining}s`;
        countdownInterval = setInterval(() => {
          remaining--;
          countdownDiv.textContent = `Time remaining: ${remaining}s`;
          if (remaining <= 0) {
            clearInterval(countdownInterval);
            stop();
            statusDiv.textContent = 'Deposit window expired.';
            qrImg.style.display = 'none';
            paymentLinkDiv.style.display = 'none';
            countdownDiv.textContent = '';
          }
        }, 1000);
      } catch (err) {
        tracking.style.display = 'block';
        qrImg.style.display = 'none';
        paymentLinkDiv.style.display = 'none';
        statusDiv.textContent = (err && err.message) ? err.message : 'Request rejected.';
      }
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light');
        themeToggle.textContent = document.body.classList.contains('light') ? 'Night Mode' : 'Day Mode';
      });
    }
    if (window.initSettldPaymentTracking) {
      window.initSettldPaymentTracking();
    }
  });
})();