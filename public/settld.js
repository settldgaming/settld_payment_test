(function () {
  const config = (window.SETTLD_CONFIG = window.SETTLD_CONFIG || {});

  function loadCryptoJS() {
    return new Promise((resolve, reject) => {
      if (window.CryptoJS) {
        resolve(window.CryptoJS);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js';
      script.onload = () => resolve(window.CryptoJS);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function defaultCreateRequest(token, payload) {
    const url = config.walletRequestUrl;
    if (!url) {
      return Promise.reject(new Error('walletRequestUrl not configured'));
    }
    return fetch(url, {
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
  function connectEvents(token, userId, onMessage, onSignature) {
    if (!config.eventsUrl) {
      throw new Error('eventsUrl not configured');
    }
    const controller = new AbortController();
    const url = `${config.eventsUrl}?userId=${encodeURIComponent(userId)}`;
    
    const poll = () => {
      fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
        .then(async resp => {
          if (!resp.ok) {
            // Retry on gateway timeout or other non-200 responses
            if (!controller.signal.aborted) {
              setTimeout(poll, 1000);
            }
            return;
          }
          const sig = resp.headers.get('X-Signature') || '';
          if (onSignature) onSignature(sig);
          const raw = await resp.text();
          if (onMessage) onMessage(raw);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setTimeout(poll, 1000);
          }
        });
    };

    poll();
    return () => controller.abort();
  }

  window.initSettldPaymentTracking = function (createRequest) {
    createRequest = createRequest || defaultCreateRequest;
    const form = document.getElementById('walletForm');
    const tracking = document.getElementById('tracking');
    const qrImg = document.getElementById('qrCode');
    const paymentUrlSpan = document.getElementById('paymentUrl');
    const paymentLinkDiv = document.getElementById('paymentLink');
    const copyBtn = document.getElementById('copyBtn');
    const statusDiv = document.getElementById('status');
    const successDetails = document.getElementById('successDetails');
    const callbackJson = document.getElementById('callbackJson');
    const txHashLink = document.getElementById('txHashLink');
    const restartBtn = document.getElementById('restart');
    const signatureInput = document.getElementById('latestSignature');
    const signingKeyInput = document.getElementById('signingKey');
    const computedSigInput = document.getElementById('computedSignature');
    const verifyBtn = document.getElementById('verifySignature');
    const signatureResult = document.getElementById('signatureResult');

    let latestSignature = '';
    let latestRaw = '';
    
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
        const stop = connectEvents(
          token,
          formData.userId,
          raw => {
            latestRaw = raw;
            stop();
            statusDiv.textContent = 'Payment received.';
            qrImg.style.display = 'none';
            paymentLinkDiv.style.display = 'none';

            if (callbackJson) {
              callbackJson.textContent = raw;
            }
            if (txHashLink) {
              txHashLink.textContent = '';
            }
            successDetails.style.display = 'block';
          },
          sig => {
            latestSignature = sig;
            if (signatureInput) signatureInput.value = sig;
          }
        );
      } catch (err) {
        tracking.style.display = 'block';
        qrImg.style.display = 'none';
        paymentLinkDiv.style.display = 'none';
        statusDiv.textContent = (err && err.message) ? err.message : 'Request rejected.';
      }
    });
    
    if (verifyBtn) {
      verifyBtn.addEventListener('click', async () => {
        if (!signingKeyInput || !signatureResult) return;
        const key = signingKeyInput.value || '';
        if (!key || !latestRaw || !latestSignature) {
          signatureResult.textContent = 'Missing data';
          signatureResult.style.color = 'orange';
          return;
        }
        try {
          const CryptoJS = await loadCryptoJS();
          const computed = CryptoJS.HmacSHA256(latestRaw, key).toString(CryptoJS.enc.Hex);
          if (computedSigInput) computedSigInput.value = computed;
          if (computed === latestSignature) {
            signatureResult.textContent = 'Signature verified';
            signatureResult.style.color = 'lime';
          } else {
            signatureResult.textContent = 'Signature mismatch';
            signatureResult.style.color = 'red';
          }
        } catch (err) {
          signatureResult.textContent = 'Verification failed';
          signatureResult.style.color = 'red';
        }
      });
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const resp = await fetch('/config');
      const data = await resp.json().catch(() => ({}));
      Object.assign(config, data);
      window.SETTLD_CONFIG = config;
    } catch (_err) {}

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