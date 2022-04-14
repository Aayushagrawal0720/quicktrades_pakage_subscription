const { Pool } = require('pg');

var pool = new Pool({
    user: 'postgres',
    host: '172.26.0.158',
    database: 'quicktrades',
    password: 'postgres',
    port: 5432,
});

module.exports = pool;
