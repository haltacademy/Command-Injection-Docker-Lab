const express = require('express');
const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Config
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Correct Flags for CTF Verification
const VALID_FLAGS = {
  1: "FLAG{c0mm4nd_inj3cti0n_m4st3r_8829}",
  2: "FLAG{f1lt3r_1d3nt1fy_m4pp3d_6637}",
  3: "FLAG{byp4ss_bl4cklist_filt3rs_9912}",
  4: "FLAG{bl1nd_c0mm4nd_3xecuti0n_7741}",
  5: "FLAG{ch4r_byp4ss_m4st3r_2291}",
  6: "FLAG{cmd_bl4cklist_3v4d3d_4418}"
};

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString(), container: 'os-command-injection-lab' });
});

// Main Dashboard Page
app.get('/', (req, res) => {
  res.render('index', { title: 'Halt Academy - OS Command Injection Lab' });
});

/**
 * LEVEL 1: Network Ping Utility (In-Band Command Injection)
 * Vulnerability: Direct unsanitized user input concatenated into shell command string.
 */
app.post('/api/v1/ping', (req, res) => {
  const { host } = req.body;

  if (!host || typeof host !== 'string') {
    return res.status(400).json({ success: false, output: 'Error: Host parameter is required.' });
  }

  // Vulnerable shell execution: Unsanitized concatenation
  const command = `ping -c 3 ${host}`;

  exec(command, { timeout: 8000 }, (error, stdout, stderr) => {
    let output = stdout || stderr || '';
    if (error && !output) {
      output = `Execution Error: ${error.message}`;
    }
    res.json({ success: !error, commandExecuted: command, output });
  });
});

/**
 * LEVEL 2: Identifying Filters (File Viewer with hidden WAF)
 * Vulnerability: A WAF silently blocks input. The student must probe individual characters
 * and keywords to map which operators are blocked vs allowed, then craft a payload.
 *
 * Blocked: ;  &&  ||  cat  more  spaces
 * Allowed: |  $()  ${IFS}  tac  head  less  >  <
 */
app.post('/api/v2/fileview', (req, res) => {
  const { filename } = req.body;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ success: false, output: 'Error: filename is required.' });
  }

  // WAF filter — blocks silently with a generic message
  const blocked_patterns = [';', '&&', '||', 'cat ', 'cat\t', 'more ', 'more\t', ' '];

  for (const pat of blocked_patterns) {
    if (filename.includes(pat)) {
      return res.json({
        success: false,
        blocked: true,
        output: `[WAF] Request blocked. Suspicious input detected.`
      });
    }
  }

  // Also block standalone "cat" at end of string (no trailing space)
  if (/\bcat$/.test(filename)) {
    return res.json({
      success: false,
      blocked: true,
      output: `[WAF] Request blocked. Suspicious input detected.`
    });
  }

  // Vulnerable shell execution after WAF
  const command = `cat /app/docs/${filename}`;

  exec(command, { timeout: 8000 }, (error, stdout, stderr) => {
    let output = stdout || stderr || '';
    if (error && !output) {
      output = `Error: File not found or cannot be read.`;
    }
    res.json({ success: !error, output });
  });
});

/**
 * LEVEL 3: DNS Lookup Utility (Filter Bypass)
 * Vulnerability: Naive blacklist filter blocking `;` and spaces, but shell chaining like `&&`, `||`, `${IFS}` still works!
 */
app.post('/api/v3/lookup', (req, res) => {
  const { domain } = req.body;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ success: false, output: 'Error: Domain parameter is required.' });
  }

  // Naive filter check
  const forbidden = [';', ' '];
  const detected = forbidden.filter(char => domain.includes(char));

  if (detected.length > 0) {
    return res.json({
      success: false,
      blocked: true,
      commandExecuted: 'Blocked by Security Filter',
      output: `[SECURITY ALERT] Input blocked! Forbidden characters detected: ${detected.map(c => `'${c}'`).join(', ')}. Parameter sanitization active.`
    });
  }

  // Vulnerable shell execution after weak filter
  const command = `nslookup ${domain}`;

  exec(command, { timeout: 8000 }, (error, stdout, stderr) => {
    let output = stdout || stderr || '';
    if (error && !output) {
      output = `Execution Error: ${error.message}`;
    }
    res.json({ success: !error, commandExecuted: command, output });
  });
});

/**
 * LEVEL 4: System Log Exporter (Blind Command Injection)
 * Vulnerability: Asynchronous execution without output returning in HTTP response.
 * Requires time-delay testing (sleep) or output redirection to web root.
 */
app.post('/api/v4/system-export', (req, res) => {
  const { logType } = req.body;

  if (!logType || typeof logType !== 'string') {
    return res.status(400).json({ success: false, message: 'Error: logType is required.' });
  }

  const command = `echo Processing log type ${logType} >> /tmp/system_export.log`;
  const startTime = Date.now();

  exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
    // Background execution completed (not directly surfaced in HTTP response)
  });

  const durationMs = Date.now() - startTime;
  res.json({
    success: true,
    message: `Export job for '${logType}' accepted and scheduled.`,
    note: 'This process runs asynchronously. Output is logged internally.',
    responseTimeMs: durationMs
  });
});

/**
 * LEVEL 5: User Lookup (Bypassing Other Blacklisted Characters)
 * Vulnerability: Aggressive WAF blocks ; | & spaces / backticks and common read commands.
 * Students must use shell variable tricks to reconstruct blocked characters:
 *   - ${HOME:0:1} to produce /
 *   - ${IFS} to produce space
 *   - Alternative commands: sort, nl, strings, xxd, rev, grep
 */
app.post('/api/v5/usercheck', (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ success: false, output: 'Error: username is required.' });
  }

  // Aggressive WAF
  const blocked_chars = [';', '|', '&', ' ', '/', '`'];
  const blocked_words = ['cat', 'tac', 'more', 'less', 'head', 'tail', 'flag'];

  for (const ch of blocked_chars) {
    if (username.includes(ch)) {
      return res.json({
        success: false,
        blocked: true,
        output: `[WAF] Blocked — forbidden character detected.`
      });
    }
  }

  for (const word of blocked_words) {
    if (username.toLowerCase().includes(word)) {
      return res.json({
        success: false,
        blocked: true,
        output: `[WAF] Blocked — forbidden keyword detected.`
      });
    }
  }

  // Vulnerable: uses bash explicitly so ${HOME:0:1} works
  const command = `id ${username}`;

  exec(command, { timeout: 8000, shell: '/bin/bash' }, (error, stdout, stderr) => {
    let output = stdout || stderr || '';
    if (error && !output) {
      output = `Error: user not found.`;
    }
    res.json({ success: !error, output });
  });
});

/**
 * LEVEL 6: Process Monitor (Bypassing Blacklisted Commands)
 * Vulnerability: WAF blocks command NAMES (cat, id, whoami, ls, etc.)
 * but allows all shell operators, quotes, backslashes, and dollar signs.
 * Students must reconstruct command names using:
 *   - Quote insertion: c'a't  or  c"a"t
 *   - Backslash escape: c\at
 *   - Glob patterns: /bin/c?t  or  /bin/ca*
 *   - Variable tricks: c${x}at  or  c$@at
 */
app.post('/api/v6/procmon', (req, res) => {
  const { process } = req.body;

  if (!process || typeof process !== 'string') {
    return res.status(400).json({ success: false, output: 'Error: process name is required.' });
  }

  // WAF: block command NAMES only (operators/quotes/slashes are allowed)
  const blocked_cmds = [
    'cat', 'tac', 'head', 'tail', 'more', 'less', 'sort', 'nl',
    'whoami', 'id', 'ls', 'find', 'grep', 'strings', 'xxd', 'rev',
    'base64', 'curl', 'wget', 'python', 'perl', 'ruby', 'nc',
    'bash', 'sh', 'flag', 'passwd', 'shadow', 'secret', 'loot'
  ];

  const inputLower = process.toLowerCase();
  for (const cmd of blocked_cmds) {
    if (inputLower.includes(cmd)) {
      return res.json({
        success: false,
        blocked: true,
        output: `[WAF] Blocked \u2014 blacklisted command detected: "${cmd}"`
      });
    }
  }

  // Vulnerable: input outside quotes, runs in bash so quote/backslash tricks work
  const command = `ps aux | grep ${process}`;

  exec(command, { timeout: 8000, shell: '/bin/bash' }, (error, stdout, stderr) => {
    let output = stdout || stderr || '';
    if (error && !output) {
      output = `Error: process check failed.`;
    }
    res.json({ success: !error, output });
  });
});

/**
 * Flag Verification API
 */
app.post('/api/submit-flag', (req, res) => {
  const { level, flag } = req.body;
  const levelNum = parseInt(level, 10);

  if (!VALID_FLAGS[levelNum]) {
    return res.status(400).json({ success: false, message: 'Invalid level specified.' });
  }

  const cleanFlag = (flag || '').trim();

  if (cleanFlag === VALID_FLAGS[levelNum]) {
    return res.json({
      success: true,
      message: `Congratulations! Flag for Level ${levelNum} is correct!`,
      level: levelNum
    });
  } else {
    return res.json({
      success: false,
      message: `Incorrect flag for Level ${levelNum}. Keep analyzing!`,
      level: levelNum
    });
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  Halt Academy - OS Command Injection Lab Active`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
