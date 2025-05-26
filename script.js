// 전역 변수 선언
let map;
let markers = [];
let categoryMarkers = []; // 카테고리별 마커를 저장하는 배열
let mapInitialized = false;

// 서버 정보 표시
document.getElementById('serverUrl').textContent = window.location.href;

// 네이버 지도 API 인증 실패 확인 함수
window.navermap_authFailure = function() {
    console.error('네이버 지도 API 인증 실패!');
    
    // 인증 실패 정보 표시
    document.getElementById('statusText').textContent = '인증 실패';
    document.getElementById('statusText').className = 'error';
    
    // 마커 지도 영역에 오류 정보 표시
    document.getElementById('map').innerHTML = `
        <div style="padding:20px;text-align:center;">
            <h3>네이버 지도 API 인증 실패</h3>
            <p>클라이언트 ID: ${CLIENT_ID}</p>
            <p>현재 URL: ${window.location.href}</p>
            <p>네이버 클라우드 플랫폼에 다음 URL을 등록해주세요:</p>
            <ul style="text-align:left;">
                <li>${window.location.protocol}//${window.location.host}</li>
                <li>http://localhost</li>
                <li>http://127.0.0.1</li>
                <li>현재 사용중인 포트번호를 포함한 URL도 추가해보세요</li>
            </ul>
        </div>
    `;
};

// 페이지 로드 시 실행되는 함수
window.onload = function() {
    try {
        initMap();
        
        // 버튼 이벤트 리스너 등록
        document.getElementById('addMarker').addEventListener('click', addRandomMarker);
        document.getElementById('clearMarkers').addEventListener('click', clearAllMarkers);
        document.getElementById('search').addEventListener('click', searchAddress);
        document.getElementById('getCurrentLocation').addEventListener('click', getCurrentLocation);
        
        // 카테고리 검색 버튼 이벤트 등록
        document.getElementById('findGym').addEventListener('click', function() {
            searchPlacesByCategory('헬스장');
        });
        document.getElementById('findPark').addEventListener('click', function() {
            searchPlacesByCategory('공원');
        });
        document.getElementById('findTrail').addEventListener('click', function() {
            searchPlacesByCategory('산책로');
        });
        document.getElementById('findSports').addEventListener('click', function() {
            searchPlacesByCategory('스포츠');
        });
        document.getElementById('findSwim').addEventListener('click', function() {
            searchPlacesByCategory('수영장');
        });
        document.getElementById('findAll').addEventListener('click', function() {
            // 한 번에 모든 카테고리 통합 검색 (수정된 방식)
            // 단순화된 방식으로 테스트 데이터 표시
            searchPlacesByCategory('운동 시설', true);
        });
        
        // Enter 키로 검색 가능하게
        document.getElementById('address').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAddress();
            }
        });
    } catch (error) {
        console.error('초기화 오류:', error);
        document.getElementById('statusText').textContent = `초기화 오류: ${error.message}`;
        document.getElementById('statusText').className = 'error';
    }
};

// 지도 초기화 함수
function initMap() {
    try {
        // 서울 시청을 중심으로 지도 생성
        const mapOptions = {
            center: new naver.maps.LatLng(37.5666805, 126.9784147),
            zoom: 13,
            mapTypeId: naver.maps.MapTypeId.NORMAL,
            mapDataControl: true,
            scaleControl: true,
            logoControl: true,
            mapTypeControl: true,
            zoomControl: true
        };
        
        // 지도 객체 생성
        map = new naver.maps.Map('map', mapOptions);
        mapInitialized = true;
        
        // 초기 마커 추가
        addMarker(37.5666805, 126.9784147, '서울 시청');
        
        // 지도 클릭 이벤트 처리
        naver.maps.Event.addListener(map, 'click', function(e) {
            const position = e.coord;
            addMarker(position.lat(), position.lng(), '선택한 위치');
        });
        
        // 지도 이동 완료 이벤트 (드래그 후 새로운 위치에서 자동 검색)
        let lastSearchTime = 0;
        naver.maps.Event.addListener(map, 'dragend', function() {
            // 너무 빈번한 검색 방지 (3초 간격)
            const now = Date.now();
            if (now - lastSearchTime < 3000) return;
            
            // 마지막 사용한 카테고리가 있으면 자동 검색
            const lastCategory = window.lastSearchedCategory;
            if (lastCategory) {
                lastSearchTime = now;
                searchPlacesByCategory(lastCategory);
            }
        });
        
        // 지도 초기화 성공 표시
        document.getElementById('statusText').textContent = '지도 로드 성공';
        document.getElementById('statusText').className = 'success';
        
        // 지도 정보 출력
        console.log('지도 초기화 성공:', map.getCenter());
    } catch (error) {
        console.error('지도 초기화 오류:', error);
        document.getElementById('statusText').textContent = `지도 초기화 오류: ${error.message}`;
        document.getElementById('statusText').className = 'error';
        mapInitialized = false;
    }
}

// 마커 추가 함수
function addMarker(lat, lng, title) {
    if (!mapInitialized) {
        console.error('지도가 초기화되지 않았습니다.');
        return null;
    }
    
    const position = new naver.maps.LatLng(lat, lng);
    
    // 마커 생성
    const marker = new naver.maps.Marker({
        position: position,
        map: map,
        title: title,
        animation: naver.maps.Animation.DROP,
        icon: {
            content: `<div style="cursor:pointer;width:40px;height:40px;line-height:42px;font-size:10px;color:white;text-align:center;font-weight:bold;background:url('https://navermaps.github.io/maps.js.ncp/docs/img/cluster-marker-1.png') no-repeat;background-size:contain;">${markers.length + 1}</div>`,
            anchor: new naver.maps.Point(20, 20)
        }
    });
    
    // 마커 배열에 추가
    markers.push(marker);
    
    // 마커 클릭 시 정보창 표시
    naver.maps.Event.addListener(marker, 'click', function() {
        showInfoWindow(marker, title);
    });
    
    return marker;
}

// 카테고리 마커 추가 함수 - 다른 아이콘 사용
function addCategoryMarker(lat, lng, title, category) {
    if (!mapInitialized) {
        console.error('지도가 초기화되지 않았습니다.');
        return null;
    }
    
    const position = new naver.maps.LatLng(lat, lng);
    
    // 카테고리별 아이콘 색상 설정
    let iconColor = '#03c75a'; // 기본 색상 (네이버 색상)
    
    // 카테고리별 색상 지정
    const categoryColors = {
        '헬스': '#ff5722',       // 주황색 - 헬스장
        '피트니스': '#ff5722',   // 주황색 - 피트니스
        '공원': '#4caf50',       // 녹색 - 공원
        '산책': '#2196f3',       // 파란색 - 산책로
        '체육': '#9c27b0',       // 보라색 - 체육시설
        '스포츠': '#9c27b0',     // 보라색 - 스포츠 시설
        '수영': '#00bcd4',       // 청록색 - 수영장
        '요가': '#e91e63',       // 분홍색 - 요가/필라테스
        '필라테스': '#e91e63',   // 분홍색 - 요가/필라테스
        '태권도': '#795548',     // 갈색 - 무술
        '유도': '#795548',       // 갈색 - 무술
        '복싱': '#795548',       // 갈색 - 무술
        '배드민턴': '#ffc107',   // 노랑색 - 라켓 스포츠
        '테니스': '#ffc107',     // 노랑색 - 라켓 스포츠
        '축구': '#8bc34a',       // 연두색 - 구기 스포츠
        '농구': '#8bc34a',       // 연두색 - 구기 스포츠
        '야구': '#8bc34a',       // 연두색 - 구기 스포츠
        '골프': '#3f51b5',       // 남색 - 골프
        '클라이밍': '#ff9800',   // 주황색 - 클라이밍
        '볼링': '#607d8b',       // 회색 - 실내 스포츠
        '당구': '#607d8b'        // 회색 - 실내 스포츠
    };
    
    // 카테고리에 해당하는 색상 찾기
    for (const key in categoryColors) {
        if (category.includes(key)) {
            iconColor = categoryColors[key];
            break;
        }
    }
    
    // 마커 생성
    const marker = new naver.maps.Marker({
        position: position,
        map: map,
        title: title,
        animation: naver.maps.Animation.DROP,
        icon: {
            content: `<div style="cursor:pointer;width:30px;height:30px;line-height:30px;font-size:12px;color:white;text-align:center;font-weight:bold;background:${iconColor};border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.2);">${categoryMarkers.length + 1}</div>`,
            anchor: new naver.maps.Point(15, 15)
        }
    });
    
    // 카테고리 마커 배열에 추가
    categoryMarkers.push(marker);
    
    // 마커 클릭 시 정보창 표시
    naver.maps.Event.addListener(marker, 'click', function() {
        showInfoWindow(marker, `<strong>${title}</strong><br>카테고리: ${category}`);
    });
    
    return marker;
}

// 랜덤 위치에 마커 추가 (버튼 클릭용)
function addRandomMarker() {
    if (!mapInitialized) {
        alert('지도가 초기화되지 않았습니다.');
        return;
    }
    
    // 현재 지도 중심 기준으로 랜덤 위치 생성
    const center = map.getCenter();
    const lat = center.lat() + (Math.random() - 0.5) * 0.05;
    const lng = center.lng() + (Math.random() - 0.5) * 0.05;
    
    const marker = addMarker(lat, lng, '랜덤 위치');
    if (marker) {
        showInfoWindow(marker, `랜덤 위치<br>위도: ${lat.toFixed(6)}<br>경도: ${lng.toFixed(6)}`);
    }
}

// 모든 마커 제거 함수
function clearAllMarkers() {
    // 기본 마커 제거
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
    
    // 카테고리 마커 제거
    for (let i = 0; i < categoryMarkers.length; i++) {
        categoryMarkers[i].setMap(null);
    }
    categoryMarkers = [];
    
    // 정보창 닫기
    if (window.infoWindow) {
        window.infoWindow.close();
    }
    
    document.getElementById('statusText').textContent = '모든 마커 제거됨';
}

// 정보창 표시 함수
function showInfoWindow(marker, content) {
    // 기존 정보창이 있으면 닫기
    if (window.infoWindow) {
        window.infoWindow.close();
    }
    
    // 새 정보창 생성
    window.infoWindow = new naver.maps.InfoWindow({
        content: `<div style="padding:10px;min-width:200px;text-align:center;"><p>${content}</p></div>`,
        maxWidth: 300,
        backgroundColor: "#fff",
        borderColor: "#ddd",
        borderWidth: 2,
        anchorSkew: true,
        anchorSize: new naver.maps.Size(10, 10),
        pixelOffset: new naver.maps.Point(10, -10)
    });
    
    // 정보창 열기
    window.infoWindow.open(map, marker);
}

// 주소 검색 함수
function searchAddress() {
    if (!mapInitialized) {
        alert('지도가 초기화되지 않았습니다.');
        return;
    }
    
    const address = document.getElementById('address').value;
    
    if (!address) {
        alert('주소나 장소를 입력해주세요');
        return;
    }
    
    naver.maps.Service.geocode({
        query: address
    }, function(status, response) {
        if (status !== naver.maps.Service.Status.OK) {
            alert('검색 결과가 없습니다. 다른 주소를 입력해보세요.');
            return;
        }
        
        const result = response.v2.addresses[0];
        if (result) {
            // 검색 결과 위치로 이동
            const position = new naver.maps.LatLng(result.y, result.x);
            map.setCenter(position);
            
            // 마커 추가
            const marker = addMarker(result.y, result.x, result.roadAddress || result.jibunAddress);
            
            // 정보창 표시
            let content = `<strong>${address}</strong><br/>`;
            content += result.roadAddress ? `도로명주소: ${result.roadAddress}<br/>` : '';
            content += result.jibunAddress ? `지번주소: ${result.jibunAddress}` : '';
            
            showInfoWindow(marker, content);
        } else {
            alert('검색 결과가 없습니다. 다른 주소를 입력해보세요.');
        }
    });
}

// 현재 위치 가져오기 함수
function getCurrentLocation() {
    if (!mapInitialized) {
        alert('지도가 초기화되지 않았습니다.');
        return;
    }
    
    if (navigator.geolocation) {
        document.getElementById('statusText').textContent = '위치 정보 가져오는 중...';
        
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const currentPosition = new naver.maps.LatLng(lat, lng);
            
            // 지도 이동
            map.setCenter(currentPosition);
            map.setZoom(15); // 좀 더 가까이 보기
            
            // 마커 추가
            const marker = addMarker(lat, lng, '현재 위치');
            
            // 정보창 표시
            showInfoWindow(marker, '현재 위치');
            
            // 주소 정보 가져오기
            naver.maps.Service.reverseGeocode({
                location: currentPosition
            }, function(status, response) {
                if (status === naver.maps.Service.Status.OK) {
                    const result = response.v2.results[0];
                    if (result) {
                        const address = result.region.area1.name + ' ' + 
                                     result.region.area2.name + ' ' + 
                                     result.region.area3.name + ' ' + 
                                     (result.land.name || '');
                        
                        showInfoWindow(marker, `현재 위치<br/>${address}`);
                        document.getElementById('statusText').textContent = '현재 위치 가져오기 성공';
                        document.getElementById('statusText').className = 'success';
                    }
                } else {
                    document.getElementById('statusText').textContent = '주소 변환 실패';
                }
            });
        }, function(error) {
            console.error('위치 정보 오류:', error);
            document.getElementById('statusText').textContent = `위치 정보 오류: ${error.message}`;
            document.getElementById('statusText').className = 'error';
            alert('위치 정보를 가져올 수 없습니다. ' + error.message);
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        });
    } else {
        alert('이 브라우저는 위치 정보 기능을 지원하지 않습니다.');
    }
}
