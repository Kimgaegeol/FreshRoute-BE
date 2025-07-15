const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const iconv = require("iconv-lite"); // npm install iconv-lite

/* GET /api/fertilizer-producers — 비료 생산업체 목록 조회 */
router.get("/fertilizer-producers", async (req, res) => {
  try {
    // CSV 파일 경로 (프로젝트 루트의 data 폴더에 저장한다고 가정)
    const csvFilePath = path.join(__dirname, "../public/csv/file.csv");

    // 파일 존재 여부 확인
    if (!fs.existsSync(csvFilePath)) {
      return res.status(404).json({
        success: false,
        message: "비료 생산업체 데이터를 찾을 수 없습니다.",
      });
    }

    // 파일 읽기 (바이너리로 읽기)
    const buffer = fs.readFileSync(csvFilePath);

    // CP949 또는 EUC-KR로 인코딩된 파일을 UTF-8로 변환
    let csvContent;
    try {
      // 먼저 CP949로 시도
      csvContent = iconv.decode(buffer, "cp949");
    } catch (e) {
      try {
        // CP949 실패시 EUC-KR로 시도
        csvContent = iconv.decode(buffer, "euc-kr");
      } catch (e2) {
        // 둘 다 실패하면 UTF-8로 가정
        csvContent = buffer.toString("utf8");
      }
    }

    // CSV 파싱
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

    // 첫 줄은 헤더라고 가정
    const headers = lines[0].split(",").map((h) => h.trim());

    // 데이터 파싱
    const producers = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());

      // CSV 구조에 맞게 객체 생성
      const producer = {
        region: values[0] || "",
        company: values[1] || "",
        phone: values[2] || "",
        address: values[3] || "",
      };

      producers.push(producer);
    }

    // 성공 응답
    res.json({
      success: true,
      total: producers.length,
      data: producers,
    });
  } catch (error) {
    console.error("비료 생산업체 데이터 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "비료 생산업체 데이터 조회 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

module.exports = router;
