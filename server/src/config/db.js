/**
 * Konfigurasi koneksi MySQL terpusat.
 * Semua nilai diambil dari environment variables (.env),
 * sehingga credential TIDAK pernah masuk ke source code / GitHub.
 */
const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'booking_rapat',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  authPlugins: {
    auth_gssapi_client: () => {
      return () => Buffer.from('\0');
    }
  }
};

module.exports = dbConfig;
