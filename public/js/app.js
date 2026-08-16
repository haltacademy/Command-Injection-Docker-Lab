document.addEventListener('DOMContentLoaded', () => {

  // Tab switching
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`view-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Level 1 — Ping
  document.getElementById('form-level1').addEventListener('submit', async (e) => {
    e.preventDefault();
    const host = document.getElementById('ping-host').value;
    const out = document.getElementById('terminal-l1');
    out.innerHTML = `<span class="prompt">$</span> ping -c 3 ${esc(host)}\n\nRunning...`;
    try {
      const res = await fetch('/api/v1/ping', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({host}) });
      const data = await res.json();
      out.innerHTML = `<span class="prompt">$</span> ping -c 3 ${esc(host)}\n\n${esc(data.output)}`;
    } catch (err) {
      out.innerHTML = `<span class="error">Error: ${esc(err.message)}</span>`;
    }
  });

  // Level 2 — Identifying Filters (File Viewer)
  document.getElementById('form-level2').addEventListener('submit', async (e) => {
    e.preventDefault();
    const filename = document.getElementById('fileview-name').value;
    const out = document.getElementById('terminal-l2');
    out.innerHTML = `<span class="prompt">$</span> cat /app/docs/${esc(filename)}\n\nRunning...`;
    try {
      const res = await fetch('/api/v2/fileview', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({filename}) });
      const data = await res.json();
      if (data.blocked) {
        out.innerHTML = `<span class="prompt">$</span> cat /app/docs/${esc(filename)}\n\n<span class="error">${esc(data.output)}</span>`;
      } else {
        out.innerHTML = `<span class="prompt">$</span> cat /app/docs/${esc(filename)}\n\n${esc(data.output)}`;
      }
    } catch (err) {
      out.innerHTML = `<span class="error">Error: ${esc(err.message)}</span>`;
    }
  });

  // Level 3 — DNS Lookup (Filter Bypass)
  document.getElementById('form-level3').addEventListener('submit', async (e) => {
    e.preventDefault();
    const domain = document.getElementById('lookup-domain').value;
    const out = document.getElementById('terminal-l3');
    out.innerHTML = `<span class="prompt">$</span> nslookup ${esc(domain)}\n\nRunning...`;
    try {
      const res = await fetch('/api/v3/lookup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({domain}) });
      const data = await res.json();
      if (data.blocked) {
        out.innerHTML = `<span class="prompt">$</span> nslookup ${esc(domain)}\n\n<span class="error">${esc(data.output)}</span>`;
      } else {
        out.innerHTML = `<span class="prompt">$</span> nslookup ${esc(domain)}\n\n${esc(data.output)}`;
      }
    } catch (err) {
      out.innerHTML = `<span class="error">Error: ${esc(err.message)}</span>`;
    }
  });

  // Level 4 — Blind Injection (Log Exporter)
  document.getElementById('form-level4').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logType = document.getElementById('export-type').value;
    const out = document.getElementById('terminal-l4');
    out.innerHTML = `<span class="prompt">$</span> export ${esc(logType)}\n\nRunning...`;
    try {
      const res = await fetch('/api/v4/system-export', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({logType}) });
      const data = await res.json();
      out.innerHTML = `<span class="prompt">$</span> export ${esc(logType)}\n\n<span class="success">${esc(data.message)}</span>\n${esc(data.note)}`;
    } catch (err) {
      out.innerHTML = `<span class="error">Error: ${esc(err.message)}</span>`;
    }
  });

  // Level 5 — Bypassing Other Blacklisted Characters (User Lookup)
  document.getElementById('form-level5').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('user-name').value;
    const out = document.getElementById('terminal-l5');
    out.innerHTML = `<span class="prompt">$</span> id ${esc(username)}\n\nRunning...`;
    try {
      const res = await fetch('/api/v5/usercheck', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username}) });
      const data = await res.json();
      if (data.blocked) {
        out.innerHTML = `<span class="prompt">$</span> id ${esc(username)}\n\n<span class="error">${esc(data.output)}</span>`;
      } else {
        out.innerHTML = `<span class="prompt">$</span> id ${esc(username)}\n\n${esc(data.output)}`;
      }
    } catch (err) {
      out.innerHTML = `<span class="error">Error: ${esc(err.message)}</span>`;
    }
  });

  // Level 6 — Bypassing Blacklisted Commands (Process Monitor)
  document.getElementById('form-level6').addEventListener('submit', async (e) => {
    e.preventDefault();
    const proc = document.getElementById('proc-name').value;
    const out = document.getElementById('terminal-l6');
    out.innerHTML = `<span class="prompt">$</span> ps aux | grep ${esc(proc)}\n\nRunning...`;
    try {
      const res = await fetch('/api/v6/procmon', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({process: proc}) });
      const data = await res.json();
      if (data.blocked) {
        out.innerHTML = `<span class="prompt">$</span> ps aux | grep ${esc(proc)}\n\n<span class="error">${esc(data.output)}</span>`;
      } else {
        out.innerHTML = `<span class="prompt">$</span> ps aux | grep ${esc(proc)}\n\n${esc(data.output)}`;
      }
    } catch (err) {
      out.innerHTML = `<span class="error">Error: ${esc(err.message)}</span>`;
    }
  });

  // Flag submission
  window.submitFlag = async (level) => {
    const input = document.getElementById(`flag-input-l${level}`);
    const msg = document.getElementById(`flag-msg-l${level}`);
    const flag = input.value.trim();
    if (!flag) { msg.textContent = 'Enter a flag.'; msg.style.color = '#ef4444'; return; }
    try {
      const res = await fetch('/api/submit-flag', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({level, flag}) });
      const data = await res.json();
      msg.textContent = data.message;
      msg.style.color = data.success ? '#22c55e' : '#ef4444';
    } catch (err) {
      msg.textContent = 'Server error.'; msg.style.color = '#ef4444';
    }
  };

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
});
