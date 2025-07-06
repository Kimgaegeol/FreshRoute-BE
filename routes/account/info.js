const consumerInfoSql = `SELECT idx, id, name, email, phone, is_farmer, created_at
FROM account.list
WHERE idx = $1;`;

const farmerInfoSql = `SELECT 
  a.idx AS account_idx,
  a.id,
  a.name AS user_name,
  a.email,
  a.phone,
  a.is_farmer,
  a.created_at,
  f.idx AS farmer_idx,
  f.name AS farm_name,
  f.address AS farm_address
FROM account.list a
JOIN account.farmer f ON a.idx = f.account_idx
WHERE a.idx = $1;`;
