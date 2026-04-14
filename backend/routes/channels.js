'use strict';

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mime = require('mime-types');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { checkCaptchaMiddleware } = require('../middleware/captcha');
const config = require('../config');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', config.uploads.localUploadDir || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function normalizeJsonValue(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
  return [];
}

function normalizeLogo(value) {
  const v = String(value || '').trim();
  if (!v) return '';

  if (
    v.startsWith('/uploads/') ||
    v.startsWith('data:') ||
    /^https?:\/\//i.test(v) ||
    v.startsWith('//')
  ) {
    return v;
  }

  return `/uploads/${v.replace(/^\/+/, '')}`;
}

function normalizeStatus(value) {
  return String(value || 'pending').toLowerCase().trim();
}

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function safeObj(v, fallback = {}) {
  const normalized = normalizeJsonValue(v, fallback);
  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) return fallback;
  return normalized;
}

function normalizeRow(row) {
  const links = safeObj(row.links, {});
  const contact = safeObj(row.contact, {});
  const meta = safeObj(row.meta, {});
  const history = normalizeJsonValue(row.history, []);
  const author = meta.author || {};

  return {
    id: row.id,
    slug: row.slug || slugify(row.name || row.id),
    name: row.name,
    logo: normalizeLogo(row.logo),
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    views: Number(row.views || 0),
    category: row.category || '',
    nomination: row.nomination || '',
    implementation: row.implementation || '',
    regions: normalizeArray(row.regions),
    contest: row.contest || '',
    links,
    contact,
    author: {
      name: author.name || '',
      socials: author.socials || {},
      visible: author.visible !== false
    },
    status: normalizeStatus(row.status),
    dateAdded: row.date_added,
    moderatorId: row.moderator_id || '',
    dateModerated: row.date_moderated,
    history: Array.isArray(history) ? history : [],
    meta
  };
}

function validateUrlValue(value) {
  if (!value) return true;
  const v = String(value).trim();
  if (!v) return true;
  if (/^(https:\/\/|mailto:|tel:)/i.test(v)) return true;
  return false;
}

function safeValue(value) {
  return String(value ?? '').trim();
}

function validatePayload(payload) {
  const errors = [];

  const name = safeValue(payload.name);
  const shortDescription = safeValue(payload.shortDescription);
  const fullDescription = safeValue(payload.fullDescription);
  const category = safeValue(payload.category);
  const regions = normalizeArray(payload.regions);
  const contest = safeValue(payload.contest);
  const implementation = safeValue(payload.implementation);

  if (!name || name.length < 3 || name.length > 85) errors.push('invalid name');
  if (!shortDescription || shortDescription.length < 5 || shortDescription.length > 150) errors.push('invalid short description');
  if (fullDescription && (fullDescription.length < 5 || fullDescription.length > 1000)) errors.push('invalid full description');
  if (!category) errors.push('category required');
  if (!regions.length) errors.push('regions required');
  if (!implementation) errors.push('implementation required');

  const links = safeObj(payload.links, {});
  const contact = safeObj(payload.contact, {});
  const author = safeObj(payload.author, {});

  const projectLinkValues = Object.values(links).filter(Boolean);
  if (!projectLinkValues.length) errors.push('project links required');
  for (const value of projectLinkValues) {
    if (!validateUrlValue(value)) errors.push('invalid url');
  }

  const contactValues = Object.values(contact).filter(Boolean);
  if (!contactValues.length) errors.push('contact required');

  if (author.socials) {
    for (const value of Object.values(author.socials).filter(Boolean)) {
      if (!validateUrlValue(value)) errors.push('invalid url');
    }
  }

  if (contest && contest.length > 100) errors.push('contest invalid');
  if (payload.nomination && String(payload.nomination).length > 120) errors.push('nomination invalid');

  return errors;
}

async function findByIdentifier(identifier) {
  return db.query('SELECT * FROM channels WHERE id=$1 OR slug=$1 LIMIT 1', [identifier]);
}

async function ensureUniqueSlug(baseSlug, id) {
  let slug = baseSlug || id.slice(0, 8);
  let counter = 0;
  while (true) {
    const candidate = counter === 0 ? `${slug}-${id.slice(0, 6)}` : `${slug}-${id.slice(0, 6)}-${counter}`;
    const r = await db.query('SELECT id FROM channels WHERE slug=$1 LIMIT 1', [candidate]);
    if (r.rowCount === 0) return candidate;
    counter += 1;
  }
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = ['.jpg', '.jpeg', '.png'].includes(ext);
    const okMime = ['image/jpeg', 'image/png'].includes(file.mimetype);
    if (!okExt || !okMime) return cb(new Error('Допускаются только JPG или PNG'));
    cb(null, true);
  }
});

async function uploadToS3(buffer, filename, contentType) {
  const s3cfg = config.uploads.s3;
  const client = new S3Client({
    region: s3cfg.region,
    credentials: {
      accessKeyId: s3cfg.accessKeyId,
      secretAccessKey: s3cfg.secretAccessKey
    }
  });

  await client.send(new PutObjectCommand({
    Bucket: s3cfg.bucket,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read'
  }));

  return `https://${s3cfg.bucket}.s3.${s3cfg.region}.amazonaws.com/${filename}`;
}

router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'upload error' });
    }
    try {
      if (!req.file) return res.status(400).json({ message: 'no file' });

      if (config.uploads.useS3 && config.uploads.s3?.bucket) {
        const buffer = fs.readFileSync(req.file.path);
        const contentType = mime.lookup(req.file.originalname) || req.file.mimetype || 'application/octet-stream';
        const url = await uploadToS3(buffer, req.file.filename, contentType);
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.json({ url });
      }

      return res.json({ url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` });
    } catch (error) {
      console.error('upload error', error);
      return res.status(500).json({ message: 'upload error' });
    }
  });
});

router.get('/', async (req, res) => {
  try {
    const status = normalizeStatus(req.query.status || 'approved');
    let sql = 'SELECT * FROM channels';
    const params = [];

    if (status !== 'all') {
      sql += ' WHERE LOWER(TRIM(COALESCE(status, \'\'))) = $1';
      params.push(status || 'approved');
    }

    sql += ' ORDER BY date_added DESC NULLS LAST';
    const result = await db.query(sql, params);
    return res.json(result.rows.map(normalizeRow));
  } catch (error) {
    console.error('channels list error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM channels WHERE slug=$1 LIMIT 1', [req.params.slug]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'not found' });
    return res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('channel slug error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const result = await findByIdentifier(req.params.id);
    if (result.rowCount === 0) return res.status(404).json({ message: 'not found' });
    return res.json(normalizeJsonValue(result.rows[0].history, []));
  } catch (error) {
    console.error('history error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.post('/', checkCaptchaMiddleware(), async (req, res) => {
  try {
    const payload = req.body || {};
    const errors = validatePayload(payload);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const id = crypto.randomUUID();
    const slug = await ensureUniqueSlug(slugify(payload.name), id);
    const now = new Date().toISOString();
    const history = [{
      event: 'created',
      date: now
    }];

    const meta = {
      author: safeObj(payload.author, {}),
      submittedFrom: 'user_form',
      contestDraft: payload.contestDraft || null
    };

    await db.query(`
      INSERT INTO channels (
        id, slug, name, logo, short_description, full_description, views, category,
        nomination, implementation, regions, contest, links, contact, status,
        date_added, history, meta
      ) VALUES (
        $1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
      )
    `, [
      id,
      slug,
      safeValue(payload.name),
      payload.logo || '',
      safeValue(payload.shortDescription),
      safeValue(payload.fullDescription) || null,
      safeValue(payload.category),
      safeValue(payload.nomination) || null,
      safeValue(payload.implementation),
      normalizeArray(payload.regions),
      safeValue(payload.contest) || null,
      JSON.stringify(safeObj(payload.links, {})),
      JSON.stringify(safeObj(payload.contact, {})),
      'pending',
      now,
      JSON.stringify(history),
      JSON.stringify(meta)
    ]);

    return res.status(201).json({ ok: true, id, slug });
  } catch (error) {
    console.error('create channel error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.post('/:id/view', async (req, res) => {
  try {
    const result = await findByIdentifier(req.params.id);
    if (result.rowCount === 0) return res.status(404).json({ message: 'not found' });
    await db.query('UPDATE channels SET views = COALESCE(views,0) + 1 WHERE id=$1 OR slug=$1', [req.params.id]);
    const history = normalizeJsonValue(result.rows[0].history, []);
    history.push({ event: 'viewed', date: new Date().toISOString() });
    await db.query('UPDATE channels SET history=$1 WHERE id=$2 OR slug=$2', [JSON.stringify(history), req.params.id]);
    return res.json({ ok: true });
  } catch (error) {
    console.error('view error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const current = await findByIdentifier(req.params.id);
    if (current.rowCount === 0) return res.status(404).json({ message: 'not found' });

    const payload = req.body || {};
    const errors = validatePayload(payload);
    if (errors.length) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const row = current.rows[0];
    const history = normalizeJsonValue(row.history, []);
    history.push({
      event: 'updated',
      date: new Date().toISOString(),
      moderator: req.user?.sub || null
    });

    const meta = safeObj(payload.meta, safeObj(row.meta, {}));
    meta.author = safeObj(payload.author, {});
    meta.submittedFrom = meta.submittedFrom || 'moderation_edit';

    await db.query(`
      UPDATE channels SET
        name=$1, logo=$2, short_description=$3, full_description=$4,
        category=$5, nomination=$6, implementation=$7, regions=$8,
        contest=$9, links=$10, contact=$11, meta=$12, history=$13
      WHERE id=$14
    `, [
      safeValue(payload.name),
      payload.logo || '',
      safeValue(payload.shortDescription),
      safeValue(payload.fullDescription) || null,
      safeValue(payload.category),
      safeValue(payload.nomination) || null,
      safeValue(payload.implementation),
      normalizeArray(payload.regions),
      safeValue(payload.contest) || null,
      JSON.stringify(safeObj(payload.links, {})),
      JSON.stringify(safeObj(payload.contact, {})),
      JSON.stringify(meta),
      JSON.stringify(history),
      row.id
    ]);

    return res.json({ ok: true, id: row.id, slug: row.slug });
  } catch (error) {
    console.error('update channel error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const result = await findByIdentifier(req.params.id);
    if (result.rowCount === 0) return res.status(404).json({ message: 'not found' });

    const row = result.rows[0];
    const history = normalizeJsonValue(row.history, []);
    history.push({ event: 'approved', moderator: req.user.sub, date: new Date().toISOString() });

    await db.query(`
      UPDATE channels
      SET status='approved', moderator_id=$1, date_moderated=$2, history=$3
      WHERE id=$4 OR slug=$4
    `, [String(req.user.sub), new Date().toISOString(), JSON.stringify(history), req.params.id]);

    return res.json({ ok: true });
  } catch (error) {
    console.error('approve error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.post('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const result = await findByIdentifier(req.params.id);
    if (result.rowCount === 0) return res.status(404).json({ message: 'not found' });

    const row = result.rows[0];
    const history = normalizeJsonValue(row.history, []);
    history.push({ event: 'rejected', moderator: req.user.sub, date: new Date().toISOString() });

    await db.query(`
      UPDATE channels
      SET status='rejected', moderator_id=$1, date_moderated=$2, history=$3
      WHERE id=$4 OR slug=$4
    `, [String(req.user.sub), new Date().toISOString(), JSON.stringify(history), req.params.id]);

    return res.json({ ok: true });
  } catch (error) {
    console.error('reject error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.post('/bulk-approve', authMiddleware, async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const now = new Date().toISOString();

    for (const id of ids) {
      const result = await findByIdentifier(id);
      if (result.rowCount === 0) continue;
      const row = result.rows[0];
      const history = normalizeJsonValue(row.history, []);
      history.push({ event: 'approved', moderator: req.user.sub, date: now });
      await db.query(`
        UPDATE channels SET status='approved', moderator_id=$1, date_moderated=$2, history=$3
        WHERE id=$4 OR slug=$4
      `, [String(req.user.sub), now, JSON.stringify(history), id]);
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('bulk approve error', error);
    return res.status(500).json({ message: 'error' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM channels WHERE id=$1 OR slug=$1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'not found' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('delete error', error);
    return res.status(500).json({ message: 'error' });
  }
});

module.exports = router;
