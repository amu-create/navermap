# 네이버 API를 지원하는 Python 웹 서버
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import urllib.parse
import urllib.request
from urllib.error import HTTPError
import ssl
import random
import sys

# 네이버 API 키 설정
CLIENT_ID = 'me6liq8hnh'
CLIENT_SECRET = 'Yg9lyWHftlXfcavEbdz2rT5VBdr9ZcsmVmZHtAtQ'

class NaverAPIProxyHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS 헤더 추가
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        # API 프록시 경로인지 확인 (정확한 경로 비교)
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/search-proxy':
            self.handle_search_proxy()
        else:
            # 일반 정적 파일 제공
            return SimpleHTTPRequestHandler.do_GET(self)
    
    def handle_search_proxy(self):
        print("===== 검색 프록시 요청 처리 중 =====")
        # URL 파라미터 파싱
        parsed_url = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed_url.query)
        print(f"요청 경로: {self.path}")
        print(f"파싱된 쿼리: {params}")
        
        query = params.get('query', [''])[0]
        lat = params.get('lat', ['37.5666805'])[0]
        lng = params.get('lng', ['126.9784147'])[0]
        
        if not query:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': '검색어가 필요합니다.'}).encode('utf-8'))
            return
        
        try:
            # 네이버 지역 검색 API 호출 (검색어만 사용)
            search_url = f'https://openapi.naver.com/v1/search/local.json?query={urllib.parse.quote(query)}&display=20&start=1&sort=random'
            print(f"네이버 API 요청 URL: {search_url}")
            
            request = urllib.request.Request(search_url)
            request.add_header('X-Naver-Client-Id', CLIENT_ID)
            request.add_header('X-Naver-Client-Secret', CLIENT_SECRET)
            
            # SSL 컨텍스트 설정
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            # API 호출
            response = urllib.request.urlopen(request, context=context)
            data = json.loads(response.read().decode('utf-8'))
            
            print(f"네이버 API 응답: {data.get('total', 0)}개 결과")
            
            # 검색 결과 처리
            places = []
            for item in data.get('items', []):
                # HTML 태그 제거
                title = item['title'].replace('<b>', '').replace('</b>', '')
                address = item.get('address', '')
                
                # 주소가 있으면 지오코딩 API로 좌표 얻기
                place_lat, place_lng = None, None
                
                if address:
                    try:
                        # 네이버 지오코딩 API 호출
                        geocode_url = f'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query={urllib.parse.quote(address)}'
                        
                        geocode_request = urllib.request.Request(geocode_url)
                        geocode_request.add_header('X-NCP-APIGW-API-KEY-ID', CLIENT_ID)
                        geocode_request.add_header('X-NCP-APIGW-API-KEY', CLIENT_SECRET)
                        
                        geocode_response = urllib.request.urlopen(geocode_request, context=context)
                        geocode_data = json.loads(geocode_response.read().decode('utf-8'))
                        
                        # 좌표 추출
                        if geocode_data['status'] == 'OK' and geocode_data['addresses']:
                            place_lat = float(geocode_data['addresses'][0]['y'])
                            place_lng = float(geocode_data['addresses'][0]['x'])
                            print(f"지오코딩 성공: {title} -> 좌표: {place_lat}, {place_lng}")
                    except Exception as e:
                        print(f"지오코딩 오류: {e}")
                
                # 지오코딩 실패 시 기본 좌표 사용 (현재 지도 중심 주변)
                if place_lat is None or place_lng is None:
                    place_lat = float(lat) + (random.random() - 0.5) * 0.01
                    place_lng = float(lng) + (random.random() - 0.5) * 0.01
                    print(f"임의 좌표 사용: {title} -> 좌표: {place_lat}, {place_lng}")
                
                place = {
                    'name': title,
                    'lat': place_lat,
                    'lng': place_lng,
                    'address': address,
                    'category': item.get('category', ''),
                    'tel': item.get('telephone', ''),
                    'link': item.get('link', ''),
                    'description': item.get('description', '').replace('<b>', '').replace('</b>', ''),
                    'mapx': item.get('mapx', ''),
                    'mapy': item.get('mapy', '')
                }
                places.append(place)
            
            # 응답 전송
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'places': places}).encode('utf-8'))
            
        except HTTPError as e:
            print(f"네이버 API HTTP 오류: {e.code}")
            print(f"오류 상세: {e.read().decode('utf-8')}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'네이버 API 오류: {e.code}'}).encode('utf-8'))
        except Exception as e:
            print(f"서버 오류: {str(e)}")
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': f'서버 오류: {str(e)}'}).encode('utf-8'))

# 포트 번호 설정 (기본값: 8000)
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# 서버 실행
server = HTTPServer(('localhost', port), NaverAPIProxyHandler)
print(f"네이버 API 프록시 서버가 http://localhost:{port} 에서 실행 중입니다.")
print(f"네이버 클라우드 플랫폼에 다음 URL을 등록했는지 확인하세요:")
print(f"  - http://localhost:{port}")
print(f"  - http://127.0.0.1:{port}")
print("서버를 중지하려면 Ctrl+C를 누르세요.")

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\n서버가 중지되었습니다.")
    server.server_close()
