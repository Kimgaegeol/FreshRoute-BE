const idSearchSql = `SELECT id
FROM account.list
WHERE phone = $1 AND email = $2;`;

const pwSearchSql = `SELECT pw
FROM account.list
WHERE phone = $1 AND email = $2;`;
