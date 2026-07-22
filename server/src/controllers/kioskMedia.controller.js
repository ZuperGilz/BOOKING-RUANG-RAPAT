// =========================================================
// [ACTIVE] VERSI CLOUD (PRISMA + NEON POSTGRESQL + HYBRID UPLOAD)
// =========================================================
const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary jika env tersedia
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Helper untuk mengekstrak public_id dari URL Cloudinary
const getCloudinaryPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Mengambil path setelah 'upload/v12345/'
    const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
    // Menghapus ekstensi file (.jpg, .png, .mp4, dll)
    const publicIdWithFolder = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
    return publicIdWithFolder;
  } catch (err) {
    return null;
  }
};

// Create new media (Upload or Link)
const createMedia = async (req, res) => {
  try {
    const { title, caption, type, sourceType, url: linkUrl, duration, order, isActive } = req.body;
    let finalUrl = '';

    if (sourceType === 'UPLOAD') {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required for UPLOAD source type' });
      }
      // Mendukung Cloudinary (req.file.path) atau Lokal (req.file.filename)
      finalUrl = req.file.path || `/uploads/${req.file.filename}`;
    } else if (sourceType === 'LINK') {
      if (!linkUrl) {
        return res.status(400).json({ message: 'URL is required for LINK source type' });
      }
      finalUrl = linkUrl;
    } else {
      return res.status(400).json({ message: 'Invalid source type' });
    }

    const mediaType = type || 'IMAGE';
    const mediaSourceType = sourceType;
    const mediaDuration = duration ? parseInt(duration) : 5;
    const mediaOrder = order ? parseInt(order) : 0;
    const mediaIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : true;
    const mediaCaption = caption || null;

    const result = await prisma.kioskMedia.create({
      data: {
        title,
        caption: mediaCaption,
        type: mediaType,
        sourceType: mediaSourceType,
        url: finalUrl,
        duration: mediaDuration,
        order: mediaOrder,
        isActive: mediaIsActive
      }
    });

    res.status(201).json({ message: 'Media created successfully', id: result.id });
  } catch (error) {
    console.error('Create Media Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all media (for admin)
const getAllMedia = async (req, res) => {
  try {
    const mediaList = await prisma.kioskMedia.findMany({
      orderBy: { order: 'asc' }
    });
    
    const formatted = mediaList.map(r => ({
      id: r.id,
      title: r.title,
      caption: r.caption || null,
      type: r.type,
      sourceType: r.sourceType,
      url: r.url,
      duration: r.duration,
      order: r.order,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get active media (for kiosk screensaver)
const getActiveMedia = async (req, res) => {
  try {
    const mediaList = await prisma.kioskMedia.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    const formatted = mediaList.map(r => ({
      id: r.id,
      title: r.title,
      caption: r.caption || null,
      type: r.type,
      sourceType: r.sourceType,
      url: r.url,
      duration: r.duration,
      order: r.order,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update media (status, order, etc)
const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, caption, type, duration, order, isActive } = req.body;
    
    const dataUpdate = {};

    if (title !== undefined) dataUpdate.title = title;
    if (caption !== undefined) dataUpdate.caption = caption || null;
    if (type !== undefined) dataUpdate.type = type;
    if (duration !== undefined) dataUpdate.duration = parseInt(duration);
    if (order !== undefined) dataUpdate.order = parseInt(order);
    if (isActive !== undefined) dataUpdate.isActive = (isActive === 'true' || isActive === true);

    if (Object.keys(dataUpdate).length > 0) {
      await prisma.kioskMedia.update({
        where: { id: parseInt(id) },
        data: dataUpdate
      });
    }

    res.json({ message: 'Media updated successfully' });
  } catch (error) {
    console.error("updateMedia error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete media
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    
    const media = await prisma.kioskMedia.findUnique({ where: { id: parseInt(id) } });
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Penanganan hapus file UPLOAD (Cloudinary vs Lokal)
    if (media.sourceType === 'UPLOAD' && media.url) {
      if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
        // Hapus dari Cloudinary
        const publicId = getCloudinaryPublicId(media.url);
        if (publicId) {
          const resourceType = media.type === 'VIDEO' ? 'video' : 'image';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(err => {
            console.error('Cloudinary destroy error:', err);
          });
        }
      } else {
        // Hapus dari disk lokal
        const filePath = path.join(__dirname, '../../', media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await prisma.kioskMedia.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error("deleteMedia error:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const streamYoutube = async (req, res) => {
  try {
    const videoId = req.query.v;
    if (!videoId) return res.status(400).send('Video ID is required');

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);
    
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });

    res.header('Content-Type', 'video/mp4');
    
    ytdl(url, { format }).pipe(res);
  } catch (error) {
    console.error('YouTube Stream Error:', error);
    res.status(500).send('Error streaming video');
  }
};

module.exports = {
  createMedia,
  getAllMedia,
  getActiveMedia,
  updateMedia,
  deleteMedia,
  streamYoutube,
};


/* =========================================================
   [INACTIVE] VERSI LOKAL (RAW MYSQL)
   Untuk kembali ke mode lokal, hapus blok komentar ini (/* ... * /)
   lalu berikan komentar pada seluruh blok VERSI CLOUD di atas.
   =========================================================
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dbConfig = require('../config/db');

// Create new media (Upload or Link)
const createMedia = async (req, res) => {
  try {
    const { title, caption, type, sourceType, url: linkUrl, duration, order, isActive } = req.body;
    let finalUrl = '';

    if (sourceType === 'UPLOAD') {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required for UPLOAD source type' });
      }
      finalUrl = req.file.path || `/uploads/${req.file.filename}`;
    } else if (sourceType === 'LINK') {
      if (!linkUrl) {
        return res.status(400).json({ message: 'URL is required for LINK source type' });
      }
      finalUrl = linkUrl;
    } else {
      return res.status(400).json({ message: 'Invalid source type' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const mediaType = type || 'IMAGE';
    const mediaSourceType = sourceType;
    const mediaDuration = duration ? parseInt(duration) : 5;
    const mediaOrder = order ? parseInt(order) : 0;
    const mediaIsActive = isActive !== undefined ? (isActive === 'true' || isActive === true ? 1 : 0) : 1;

    const mediaCaption = caption || null;

    const [result] = await connection.execute(
      `INSERT INTO kiosk_media (title, caption, type, source_type, url, duration, \`order\`, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [title, mediaCaption, mediaType, mediaSourceType, finalUrl, mediaDuration, mediaOrder, mediaIsActive]
    );

    await connection.end();
    res.status(201).json({ message: 'Media created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create Media Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all media (for admin)
const getAllMedia = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM kiosk_media ORDER BY `order` ASC');
    await connection.end();
    
    const formatted = rows.map(r => ({
      id: r.id,
      title: r.title,
      caption: r.caption || null,
      type: r.type,
      sourceType: r.source_type,
      url: r.url,
      duration: r.duration,
      order: r.order,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get active media (for kiosk screensaver)
const getActiveMedia = async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM kiosk_media WHERE is_active = 1 ORDER BY `order` ASC');
    await connection.end();

    const formatted = rows.map(r => ({
      id: r.id,
      title: r.title,
      caption: r.caption || null,
      type: r.type,
      sourceType: r.source_type,
      url: r.url,
      duration: r.duration,
      order: r.order,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update media (status, order, etc)
const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, caption, type, duration, order, isActive } = req.body;
    
    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (caption !== undefined) { updates.push('caption = ?'); values.push(caption || null); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (duration !== undefined) { updates.push('duration = ?'); values.push(parseInt(duration)); }
    if (order !== undefined) { updates.push('`order` = ?'); values.push(parseInt(order)); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive === 'true' || isActive === true ? 1 : 0); }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(parseInt(id));
      const query = `UPDATE kiosk_media SET ${updates.join(', ')} WHERE id = ?`;
      
      const connection = await mysql.createConnection(dbConfig);
      await connection.execute(query, values);
      await connection.end();
    }

    res.json({ message: 'Media updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete media
const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM kiosk_media WHERE id = ?', [parseInt(id)]);
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'Media not found' });
    }
    
    const media = rows[0];

    if (media.source_type === 'UPLOAD' && media.url) {
      if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
        // Hapus Cloudinary
        const publicId = getCloudinaryPublicId(media.url);
        if (publicId) {
          const resourceType = media.type === 'VIDEO' ? 'video' : 'image';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(err => {
            console.error('Cloudinary destroy error:', err);
          });
        }
      } else {
        // Hapus file lokal
        const filePath = path.join(__dirname, '../../', media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await connection.execute('DELETE FROM kiosk_media WHERE id = ?', [parseInt(id)]);
    await connection.end();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createMedia,
  getAllMedia,
  getActiveMedia,
  updateMedia,
  deleteMedia,
  streamYoutube,
};
========================================================= */