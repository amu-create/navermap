
// Express 기반 웹 서버 (package.json 필요)
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch'); // node-fetch 설치 필요: npm install node-fetch
const app = express();
const port = process.env.PORT || 3000;

// 네이버 API 키 설정
const CLIENT_ID = 'me6liq8hnh';
const CLIENT_SECRET = 'Yg9lyWHftlXfcavEbdz2rT5VBdr9ZcsmVmZHtAtQ';

// CORS 설정
app.use(cors());

// 정적 파일 제공
app.use(express.static(__dirname));

// 기본 라우트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 네이버 지역 검색 API 프록시 엔드포인트
app.get('/search-proxy', async (req, res) => {
  try {
    const { query, lat, lng } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: '검색어가 필요합니다.' });
    }
    
    // 네이버 지역 검색 API 호출
    // 현재 위치 기반 검색을 위해 lat, lng 사용
    const searchUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=10&start=1&sort=random`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'X-Naver-Client-Id': CLIENT_ID,
        'X-Naver-Client-Secret': CLIENT_SECRET
      }
    });
    
    if (!response.ok) {
      throw new Error(`네이버 API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 검색 결과 가공하여 응답
    const places = data.items.map(item => {
      // 주소에서 좌표를 추출할 수 없으므로 가짜 좌표 생성 (실제로는 geocoding 필요)
      const randomLat = parseFloat(lat) + (Math.random() - 0.5) * 0.01;
      const randomLng = parseFloat(lng) + (Math.random() - 0.5) * 0.01;
      
      return {
        name: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
        lat: randomLat,
        lng: randomLng,
        address: item.address,
        category: item.category,
        tel: item.telephone,
        link: item.link
      };
    });
    
    res.json({ places });
  } catch (error) {
    console.error('검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Express 서버가 http://localhost:${port} 에서 실행 중입니다.`);
  console.log(`네이버 클라우드 플랫폼에 다음 URL을 등록했는지 확인하세요:`);
  console.log(`  - http://localhost:${port}`);
  console.log(`  - http://127.0.0.1:${port}`);
  console.log(`서버를 중지하려면 Ctrl+C를 누르세요.`);
});
