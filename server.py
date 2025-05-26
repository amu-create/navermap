
# CORS 지원하는 Python 웹 서버
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS 헤더 추가
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, X-NCP-APIGW-API-KEY, X-NCP-APIGW-API-KEY-ID')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

# 포트 번호 설정 (기본값: 8000)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# 서버 실행
server = HTTPServer(('localhost', port), CORSRequestHandler)
print(f"CORS 지원 웹 서버가 http://localhost:{port} 에서 실행 중입니다.")
print(f"네이버 클라우드 플랫폼에 다음 URL을 등록했는지 확인하세요:")
print(f"  - http://localhost:{port}")
print(f"  - http://127.0.0.1:{port}")
print("서버를 중지하려면 Ctrl+C를 누르세요.")

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\n서버가 중지되었습니다.")
    server.server_close()
