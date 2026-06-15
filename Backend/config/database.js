const { Sequelize } = require("sequelize");
const pg = require("pg");

// Parse TIMESTAMP WITHOUT TIME ZONE (OID 1114) as UTC
pg.types.setTypeParser(1114, function(stringValue) {
  return new Date(stringValue + "+0000");
});

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.SQL_LOGS === "true" ? console.log : false,
    pool: {
      max: 20,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true, // Use snake_case column names
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = sequelize;
