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
      finalUrl = `/uploads/${req.file.filename}`;
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
    
    // Map snake_case to camelCase
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

    // Delete file if it's an upload
    if (media.source_type === 'UPLOAD' && media.url) {
      const filePath = path.join(__dirname, '../../', media.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await connection.execute('DELETE FROM kiosk_media WHERE id = ?', [parseInt(id)]);
    await connection.end();

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const ytdl = require('@distube/ytdl-core');

const streamYoutube = async (req, res) => {
  try {
    const videoId = req.query.v;
    if (!videoId) return res.status(400).send('Video ID is required');

    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(url);
    
    // Select video + audio format, preferably mp4
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
