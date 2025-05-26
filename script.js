// 네이버 지도 API 관련 변수
let map;
let markers = [];
let infowindows = [];

// 기본 위치 (서울시청)
const defaultCenter = new naver.maps.LatLng(37.5666805, 126.9784147);

// 지도 초기화 함수
function initMap() {
    try {
        const mapOptions = {
            center: defaultCenter,
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
        addMarker(defaultCenter, '서울시청', {
            address: '서울특별시 중구 세종대로 110',
            position: '37.5666805, 126.9784147',
            tel: '02-120'
        });
    } catch (error) {
        console.error('지도 초기화 오류:', error);
        document.getElementById('map').innerHTML = `
            <div class="error-message">
                <h3>지도를 불러올 수 없습니다</h3>
                <p>${error.message}</p>
                <p>네이버 클라우드 플랫폼에서 도메인 설정을 확인해주세요.</p>
            </div>
        `;
    }
}

// 마커 추가 함수
function addMarker(position, title, placeInfo) {
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
    if (!naver.maps.Service) {
        alert('검색 기능을 사용하려면 네이버 서치 API가 필요합니다.');
        return;
    }
    
    try {
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
            
            // 마커 추가
            addMarker(point, query, {
                address: item.roadAddress || item.jibunAddress,
                position: item.y + ', ' + item.x
            });
        });
    } catch (e) {
        // 검색 API가 없는 경우 임시 구현
        alert('검색 기능은 네이버 검색 API가 필요합니다. 현재는 예시만 제공합니다.');
        
        // 예시로 특정 위치로 이동
        const searchLocation = new naver.maps.LatLng(37.5796, 126.9770); // 광화문
        map.setCenter(searchLocation);
        
        addMarker(searchLocation, query, {
            address: '검색 결과 위치',
            position: '37.5796, 126.9770'
        });
    }
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', function() {
    try {
        // 지도 초기화
        initMap();
        
        // 현재 위치 버튼 이벤트
        document.getElementById('current-location').addEventListener('click', function() {
            getCurrentLocation();
        });
        
        // 검색 버튼 이벤트
        document.getElementById('search-btn').addEventListener('click', function() {
            const query = document.getElementById('search-input').value.trim();
            if (query) {
                searchLocation(query);
            } else {
                alert('검색어를 입력해주세요.');
            }
        });
        
        // 검색 입력 엔터 키 이벤트
        document.getElementById('search-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    searchLocation(query);
                } else {
                    alert('검색어를 입력해주세요.');
                }
            }
        });
    } catch (error) {
        console.error('초기화 오류:', error);
        alert('지도 로딩 중 오류가 발생했습니다: ' + error.message);
    }
});