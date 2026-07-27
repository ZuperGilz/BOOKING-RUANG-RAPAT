const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const { uploadToFtp, deleteFromFtp, getFtpFileName } = require('../config/ftp');

// Create new media (Upload or Link)
const createMedia = async (req, res) => {
  try {
    const { title, caption, type, sourceType, url: linkUrl, duration, order, isActive } = req.body;
    let finalUrl = '';

    if (sourceType === 'UPLOAD') {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required for UPLOAD source type' });
      }

      const remoteFileName = req.file.filename;
      try {
        finalUrl = await uploadToFtp(req.file.path, remoteFileName);
      } finally {
        // Hapus file temp lokal, berhasil ataupun gagal upload ke FTP
        fs.unlink(req.file.path, () => {});
      }
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

    // Hapus file di FTP Hostinger kalau sourceType-nya UPLOAD
    if (media.sourceType === 'UPLOAD' && media.url) {
      const remoteFileName = getFtpFileName(media.url);
      if (remoteFileName) {
        await deleteFromFtp(remoteFileName);
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