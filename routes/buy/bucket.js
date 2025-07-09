const insertBucketSql = `INSERT INTO account.bucket (account_idx, production_idx, created_at)
VALUES ($1, $2, now())
RETURNING idx, created_at;`;
const deleteBucketSql = `DELETE FROM account.bucket
WHERE idx = $1;`;
