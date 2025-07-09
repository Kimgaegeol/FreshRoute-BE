// routes/production.js
const express = require("express");
const path = require("path");
const multer = require("multer");
const client = require("../src/config/postgreSql");

const checkLoginMiddleware = require("../../src/middleware/checkLogin");

const router = express.Router();

// 카테고리 조회 SQL
const listCategoriesSql = `
  SELECT
    idx   AS category_idx,
    name  AS category_name
  FROM
    production.category
  ORDER BY
    name;
`;

/* GET /category — 전체 카테고리 목록 반환 */
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await client.query(listCategoriesSql);
    return res.json({ success: true, categories: rows });
  } catch (err) {
    console.error("Category list error:", err);
    return res.status(500).json({
      success: false,
      message: "카테고리 조회 중 서버 오류가 발생했습니다.",
    });
  }
});

// 1) multer storage 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 프로젝트 루트 기준: public/image 폴더
    cb(null, path.join(__dirname, "../public/image"));
  },
  filename: (req, file, cb) => {
    // 예: 1627890123456-originalname.jpg
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// 2) INSERT SQL (RETURNING으로 idx 및 created_at 가져오기)
const insertProduction = `
  INSERT INTO production.list
    (account_idx, category_idx, name, explain, weight, price, image, expiration)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING idx, created_at;
`;

/* POST /production
   - form-data:
     • account_idx  (number)
     • category_idx (number)
     • name         (string)
     • explain      (string)
     • weight       (number)
     • price        (number)
     • expiration   (YYYY-MM-DD or ISO string)
     • image        (file)
*/
router.post(
  "/",
  checkLoginMiddleware,
  upload.single("image"),
  async (req, res, next) => {
    try {
      // 3) form-data로 온 필드 추출
      const account_idx = req.session.user.idx;

      // 2) 폼 데이터 추출
      const { category_idx, name, explain, weight, price, expiration } =
        req.body;

      // 4) 이미지 파일 정보 검사
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "image 파일을 업로드해주세요." });
      }

      // 5) DB에 저장할 이미지 경로 (클라이언트에서 접근 가능한 URL 경로)
      const imagePath = `/image/${req.file.filename}`;

      // 6) 필수 파라미터 검증
      if (
        !category_idx ||
        !name ||
        !explain ||
        !weight ||
        !price ||
        !expiration
      ) {
        return res
          .status(400)
          .json({ success: false, message: "모든 필드를 입력해주세요." });
      }

      // 7) DB INSERT
      const { rows } = await client.query(insertProduction, [
        account_idx,
        category_idx,
        name,
        explain,
        weight,
        price,
        imagePath,
        expiration,
      ]);

      const product = rows[0];
      return res.status(201).json({
        success: true,
        product: {
          idx: product.idx,
          created_at: product.created_at,
          image: imagePath,
        },
      });
    } catch (err) {
      console.error("Insert production error:", err);
      next(err);
    }
  }
);

module.exports = router;
