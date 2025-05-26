// 네이버 지도 API 관련 변수
let map;
let markers = [];
let infowindows = [];

// 기본 위치 (서울시청)
const defaultCenter = { lat: 37.5666805, lng: 126.9784147 };

// 지도 초기화 함수
function initMap() {
    try {
        // 네이버 맵 객체가 로드되었는지 확인
        if (typeof naver === 'undefined' || typeof naver.maps === 'undefined') {
            console.error('네이버 맵 API가 로드되지 않았습니다.');
            showMapError('네이버 맵 API가 로드되지 않았습니다. 페이지를 새로고침하거나 설정을 확인해주세요.');
            return;
        }

        const mapOptions = {
            center: new naver.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
            zoom: 14,
            zoomControl: true,
            zoomControlOptions: {
                position: naver.maps.Position.TOP_RIGHT
            }
        };
        
        // 지도 생성
        map = new naver.maps.Map('map', mapOptions);
        
        // 지도 클릭 이벤트 처리
        naver.maps.Event.addListener(map, 'click', function(e) {
            // 모든 정보창 닫기
            closeAllInfowindows();
            
            // 클릭한 위치에 마커 추가
            const position = e.coord;
            addMarker(position, '선택한 위치', {
                address: '클릭한 위치',
                position: position.lat() + ', ' + position.lng()
            });
        });
        
        // 초기 마커 추가 (서울시청)
        const defaultPosition = new naver.maps.LatLng(defaultCenter.lat, defaultCenter.lng);
        addMarker(defaultPosition, '서울시청', {
            address: '서울특별시 중구 세종대로 110',
            position: defaultCenter.lat + ', ' + defaultCenter.lng,
            tel: '02-120'
        });

        // 이벤트 리스너 등록
        setupEventListeners();
    } catch (error) {
        console.error('지도 초기화 오류:', error);
        showMapError(error.message || '지도를 초기화하는 중 오류가 발생했습니다.');
    }
}

// 오류 메시지 표시 함수
function showMapError(message) {
    document.getElementById('map').innerHTML = `
        <div class="error-message">
            <h3>지도를 불러올 수 없습니다</h3>
            <p>${message}</p>
            <p>네이버 클라우드 플랫폼에서 현재 도메인(${window.location.origin})을 등록했는지 확인해주세요.</p>
            <a href="setup-guide.html" class="btn">설정 가이드 보기</a>
        </div>
    `;
}

// 마커 추가 함수
function addMarker(position, title, placeInfo) {
    try {
        // 마커 생성
        const marker = new naver.maps.Marker({
            position: position,
            map: map,
            title: title,
            animation: naver.maps.Animation.DROP
        });
        
        // 정보창 내용 생성
        let contentString = '<div class="marker-info">';
        contentString += '<h3>' + title + '</h3>';
        
        if (placeInfo) {
            if (placeInfo.address) contentString += '<p>주소: ' + placeInfo.address + '</p>';
            if (placeInfo.position) contentString += '<p>좌표: ' + placeInfo.position + '</p>';
            if (placeInfo.tel) contentString += '<p>전화: ' + placeInfo.tel + '</p>';
        }
        
        contentString += '</div>';
        
        // 정보창 생성
        const infowindow = new naver.maps.InfoWindow({
            content: contentString,
            maxWidth: 300,
            backgroundColor: '#fff',
            borderColor: '#03c75a',
            borderWidth: 2,
            anchorSize: new naver.maps.Size(10, 10),
            anchorSkew: true,
            anchorColor: '#fff',
            pixelOffset: new naver.maps.Point(10, -10)
        });
        
        // 마커 클릭 이벤트 처리
        naver.maps.Event.addListener(marker, 'click', function() {
            // 모든 정보창 닫기
            closeAllInfowindows();
            
            // 현재 마커의 정보창 열기
            infowindow.open(map, marker);
            
            // 장소 정보 패널 업데이트
            updatePlaceInfo(title, placeInfo);
        });
        
        // 마커와 정보창 저장
        markers.push(marker);
        infowindows.push(infowindow);
        
        // 장소 정보 패널 업데이트
        updatePlaceInfo(title, placeInfo);
        
        return marker;
    } catch (error) {
        console.error('마커 추가 오류:', error);
        return null;
    }
}

// 모든 정보창 닫기 함수
function closeAllInfowindows() {
    for (let i = 0; i < infowindows.length; i++) {
        infowindows[i].close();
    }
}

// 장소 정보 패널 업데이트 함수
function updatePlaceInfo(title, placeInfo) {
    let infoHtml = '<h3>' + title + '</h3>';
    
    if (placeInfo) {
        if (placeInfo.address) infoHtml += '<p><strong>주소:</strong> ' + placeInfo.address + '</p>';
        if (placeInfo.position) infoHtml += '<p><strong>좌표:</strong> ' + placeInfo.position + '</p>';
        if (placeInfo.tel) infoHtml += '<p><strong>전화:</strong> ' + placeInfo.tel + '</p>';
    }
    
    document.getElementById('place-info').innerHTML = infoHtml;
}

// 현재 위치 가져오기 함수
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const currentLocation = new naver.maps.LatLng(
                    position.coords.latitude, 
                    position.coords.longitude
                );
                
                // 지도 이동
                map.setCenter(currentLocation);
                map.setZoom(16);
                
                // 마커 추가
                addMarker(currentLocation, '현재 위치', {
                    address: '현재 위치',
                    position: position.coords.latitude + ', ' + position.coords.longitude
                });
            },
            function(error) {
                alert('위치 정보를 가져오는데 실패했습니다: ' + error.message);
            }
        );
    } else {
        alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
    }
}

// 검색 함수
function searchLocation(query) {
    try {
        // 네이버 서치 API 사용 가능 여부 확인
        if (naver.maps.Service && naver.maps.Service.geocode) {
            naver.maps.Service.geocode({
                query: query
            }, function(status, response) {
                if (status === naver.maps.Service.Status.ERROR) {
                    alert('검색 중 오류가 발생했습니다: ' + response.message);
                    return;
                }
                
                if (response.v2.meta.totalCount === 0) {
                    alert('검색 결과가 없습니다.');
                    return;
                }
                
                const item = response.v2.addresses[0];
                const point = new naver.maps.LatLng(item.y, item.x);
                
                // 지도 이동
                map.setCenter(point);
                map.setZoom(15);
                
                // 마커 추가
                addMarker(point, query, {
                    address: item.roadAddress || item.jibunAddress,
                    position: item.y + ', ' + item.x
                });
            });
        } else {
            // 검색 API가 없는 경우 임시 구현
            alert('검색 기능은 네이버 검색 API가 필요합니다. 현재는 예시만 제공합니다.');
            
            // 예시로 특정 위치로 이동
            const searchLocation = new naver.maps.LatLng(37.5796, 126.9770); // 광화문
            map.setCenter(searchLocation);
            map.setZoom(15);
            
            addMarker(searchLocation, query, {
                address: '검색 결과 위치',
                position: '37.5796, 126.9770'
            });
        }
    } catch (error) {
        console.error('검색 오류:', error);
        alert('검색 중 오류가 발생했습니다: ' + error.message);
    }
}

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 현재 위치 버튼 이벤트
    const currentLocationBtn = document.getElementById('current-location');
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', function() {
            getCurrentLocation();
        });
    }
    
    // 검색 버튼 이벤트
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = document.getElementById('search-input').value.trim();
            if (query) {
                searchLocation(query);
            } else {
                alert('검색어를 입력해주세요.');
            }
        });
    }
    
    // 검색 입력 엔터 키 이벤트
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    searchLocation(query);
                } else {
                    alert('검색어를 입력해주세요.');
                }
            }
        });
    }
}