const insertConsumerSql = `
  INSERT INTO account.list (id, pw, name, email, is_farmer, phone)
  VALUES ($1, $2, $3, $4, FALSE, $6)
  RETURNING idx, created_at;
`;

const insertFarmerSql = `
  INSERT INTO account.farmer (account_idx, name, address)
  VALUES ($1, $2, $3);
`;

const updateIsFarmerSql = `
  UPDATE account.list
  SET is_farmer = true
  WHERE idx = $1;
`;
