// routes/sale.js
const express = require("express");
const path = require("path");
const multer = require("multer");
const client = require("../src/config/postgreSql");
const checkLoginMiddleware = require("../src/middleware/checkLogin");

const router = express.Router();

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/image"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

/* POST /sale — 상품 등록 */
router.post(
  "/",
  checkLoginMiddleware,
  upload.single("image"),
  async (req, res, next) => {
    try {
      const account_idx = req.session.user.idx;
      const { category_idx, name, explain, weight, price, expiration } =
        req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "image 파일을 업로드해주세요.",
        });
      }

      if (
        !category_idx ||
        !name ||
        !explain ||
        !weight ||
        !price ||
        !expiration
      ) {
        return res.status(400).json({
          success: false,
          message: "모든 필드를 입력해주세요.",
        });
      }

      const imagePath = `/image/${req.file.filename}`;

      const { rows } = await client.query(
        `INSERT INTO production.list 
           (account_idx, category_idx, name, explain, weight, price, image, expiration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING idx, created_at`,
        [
          account_idx,
          category_idx,
          name,
          explain,
          weight,
          price,
          imagePath,
          expiration,
        ]
      );

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
