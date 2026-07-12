require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { transcribeAudio } = require('./transcription');
const { extractFields } = require('./extraction');
const { analyzeMatch } = require('./analysis');
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Store uploads temporarily on disk
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST /transcribe — receives audio file, returns transcript + extracted fields
app.post('/transcribe', (req, res, next) => {
  console.log('>>> /transcribe hit, files:', req.headers['content-type']);
  next();
}, upload.single('audio'), async (req, res) => {
  console.log('>>> multer done, file:', req.file ? req.file.path : 'MISSING');
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file received' });
  }

  const filePath = req.file.path;

  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    console.log(line.trim());
    try { fs.appendFileSync(path.join(__dirname, 'debug.log'), line); } catch {}
  };

  log(`File received: ${filePath} size=${req.file.size}`);

  const webmPath = filePath + '.webm';
  try {
    fs.renameSync(filePath, webmPath);
    log(`Renamed to: ${webmPath}`);

    log('Calling Whisper...');
    const transcript = await transcribeAudio(webmPath);
    log(`Transcript: ${transcript}`);

    log('Calling Claude...');
    const today = req.body.today || new Date().toISOString().split('T')[0];
    const fields = await extractFields(transcript, today);
    log(`Fields: ${JSON.stringify(fields)}`);

    // Upload audio to Supabase Storage and keep last 10 per user
    let audio_url = null;
    const user_id = req.body.user_id;
    if (user_id) {
      try {
        const fileBuffer = fs.readFileSync(webmPath);
        const storagePath = `${user_id}/${Date.now()}.webm`;
        const { error: uploadErr } = await supabase.storage
          .from('audio')
          .upload(storagePath, fileBuffer, { contentType: 'audio/webm' });
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(storagePath);
          audio_url = publicUrl;
          await supabase.from('audio_files').insert({ user_id, file_url: audio_url });
          // Trim to last 10
          const { data: files } = await supabase
            .from('audio_files').select('id, file_url, created_at')
            .eq('user_id', user_id).order('created_at', { ascending: false });
          if (files && files.length > 10) {
            for (const f of files.slice(10)) {
              const urlPath = f.file_url.split('/storage/v1/object/public/audio/')[1];
              if (urlPath) await supabase.storage.from('audio').remove([urlPath]);
              await supabase.from('audio_files').delete().eq('id', f.id);
            }
          }
          log(`Audio saved: ${audio_url}`);
        } else {
          log(`Audio upload error: ${uploadErr.message}`);
        }
      } catch (uploadErr) {
        log(`Audio upload failed: ${uploadErr.message}`);
      }
    }

    try { fs.unlinkSync(webmPath); } catch {}
    return res.json({ transcript, fields, audio_url });
  } catch (err) {
    log(`ERROR: ${err.message}\n${err.stack}`);
    try { fs.unlinkSync(webmPath); } catch {}
    try { fs.unlinkSync(filePath); } catch {}
    return res.status(500).json({ error: err.message });
  }
});

// POST /analyze — generate AI coaching analysis from match data
app.post('/analyze', async (req, res) => {
  try {
    const result = await analyzeMatch(req.body);
    res.json(result);
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /manage-audio — keeps only last 10 audio files per user in Supabase Storage
app.post('/manage-audio', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  const { data: files, error } = await supabase
    .from('audio_files')
    .select('id, file_url, created_at')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Delete files beyond the 10 most recent
  if (files.length > 10) {
    const toDelete = files.slice(10);
    for (const f of toDelete) {
      const urlPath = f.file_url.split('/storage/v1/object/public/audio/')[1];
      if (urlPath) {
        await supabase.storage.from('audio').remove([urlPath]);
      }
      await supabase.from('audio_files').delete().eq('id', f.id);
    }
  }

  res.json({ kept: Math.min(files.length, 10), deleted: Math.max(0, files.length - 10) });
});

// POST /send-parent-request — parent requests access to child's data
app.post('/send-parent-request', async (req, res) => {
  const { parentId, parentName, playerId, playerName, playerEmail } = req.body;
  if (!parentId || !playerId || !playerEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if already linked
  const { data: existing } = await supabase
    .from('parent_access_requests')
    .select('status')
    .eq('parent_id', parentId)
    .eq('player_id', playerId)
    .single();

  if (existing?.status === 'approved') return res.json({ alreadyApproved: true });
  if (existing?.status === 'pending') return res.json({ pending: true });

  // Create request
  const { data: request, error: insertErr } = await supabase
    .from('parent_access_requests')
    .insert({ parent_id: parentId, player_id: playerId })
    .select()
    .single();

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  // Send approval email via Resend
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const approveUrl = `https://tennis-love-app-production.up.railway.app/approve-access?token=${request.token}`;
    await resend.emails.send({
      from: 'Tennis LOVE <onboarding@resend.dev>',
      to: playerEmail,
      subject: `${parentName} wants to view your Tennis LOVE match data`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#07080a;color:white;border-radius:16px;">
          <h2 style="color:#38bdf8;margin-top:0;">🎾 Tennis LOVE</h2>
          <p style="color:#e2e8f0;line-height:1.6;"><strong>${parentName}</strong> has requested access to view your match data on Tennis LOVE.</p>
          <p style="color:#94a3b8;font-size:14px;line-height:1.6;">If you know this person and want to share your data, click Approve below. If not, simply ignore this email.</p>
          <a href="${approveUrl}" style="display:inline-block;margin-top:16px;background:#2563eb;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">✅ Approve Access</a>
          <p style="color:#475569;font-size:12px;margin-top:24px;">Tennis LOVE — Built for Indian tennis champions 🇮🇳</p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error('Email send failed:', emailErr.message);
  }

  res.json({ success: true });
});

// GET /approve-access?token=xxx — player approves parent's request from email link
app.get('/approve-access', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('<h2>Invalid link.</h2>');

  const { error } = await supabase
    .from('parent_access_requests')
    .update({ status: 'approved' })
    .eq('token', token)
    .eq('status', 'pending');

  if (error) {
    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#07080a;color:white;">
        <h2>⚠️ Invalid or already used link.</h2>
        <p style="color:#94a3b8;">This approval link may have already been used.</p>
      </body></html>
    `);
  }

  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#07080a;color:white;">
      <h2 style="color:#34d399;">✅ Access Approved!</h2>
      <p style="color:#e2e8f0;">Your parent can now view your Tennis LOVE match data.</p>
      <p style="color:#38bdf8;margin-top:24px;">You can close this page.</p>
    </body></html>
  `);
});

// Catch any unhandled Express errors
app.use((err, req, res, next) => {
  console.error('Express error handler:', err.message, err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Tennis Journal backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
