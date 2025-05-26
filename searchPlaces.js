/**
 * 네이버 지역 검색 API를 활용한 장소 검색 기능 구현
 * 주변 운동 시설, 헬스장, 공원, 산책로 등을 검색하고 지도에 표시
 */

// 전역 변수로 마지막 검색 카테고리 저장
window.lastSearchedCategory = '';

// 카테고리별 검색 함수
function searchPlacesByCategory(category, isMultiple = false, isLastCategory = false) {
    // 마지막 검색 카테고리 저장 (여러 카테고리 검색이 아닌 경우에만)
    if (!isMultiple) {
        window.lastSearchedCategory = category;
    }
    if (!mapInitialized) {
        alert('지도가 초기화되지 않았습니다.');
        return;
    }
    
    // 현재 지도 중심점
    const center = map.getCenter();
    const lat = center.lat();
    const lng = center.lng();
    
    document.getElementById('statusText').textContent = `${category} 검색 중...`;
    document.getElementById('statusText').className = '';
    
    // 기존 카테고리 마커 제거 (새로운 검색 시)
    if (!isMultiple) {
        clearCategoryMarkers();
    }
    
    // 카테고리별 검색어 설정 (최적화된 검색어)
    let query = '';
    
    if (category.includes('헬스')) {
        query = '헬스장 피트니스센터 짐';
    } else if (category.includes('공원')) {
        query = '공원 근린공원';
    } else if (category.includes('산책로')) {
        query = '산책로 둘레길 트레킹';
    } else if (category.includes('스포츠') || category.includes('운동')) {
        query = '체육시설 스포츠센터 실내체육관';
    } else if (category.includes('달리기')) {
        query = '러닝 트랙 조깅';
    } else if (category.includes('수영')) {
        query = '수영장 아쿠아';
    } else {
        query = category; // 기본값
    }
    
    // 종합 검색인 경우 여러 키워드로 한번에 처리
    if (isMultiple) {
        console.log("주변 운동 시설 모두 검색 중...");
        
        // 여러 카테고리의 데이터를 한번에 생성
        const allPlaces = [];
        
        // 각 카테고리별 가짜 데이터 생성 및 통합
        const categories = ['헬스장', '피트니스', '공원', '산책로', '수영장', '요가', '테니스', '축구장', '농구장'];
        
        categories.forEach(cat => {
            // 각 카테고리별로 약간씩 다른 위치에 데이터 생성
            const catPlaces = generateFakePlaces(center, cat);
            allPlaces.push(...catPlaces);
        });
        
        // 모든 장소 데이터를 지도에 표시
        displayPlacesOnMap(allPlaces, '운동 시설');
        
        document.getElementById('statusText').textContent = `주변 운동 시설 ${allPlaces.length}개 검색 완료 (로컬 테스트 데이터)`;
        document.getElementById('statusText').className = 'success';
        
        return;
    }
    
    // 테스트 환경에서는 API 호출 없이 바로 가짜 데이터 사용
    console.log(`'${category}' 카테고리 검색 중... (로컬 데이터 사용)`);
    const fakeData = generateFakePlaces(center, category);
    displayPlacesOnMap(fakeData, category);
    
    document.getElementById('statusText').textContent = `${category} ${fakeData.length}개 검색 완료 (로컬 테스트 데이터)`;
    document.getElementById('statusText').className = 'success';
}

// 테스트 데이터 생성 함수 (API 직접 호출 불가능할 때 테스트용)
function generateFakePlaces(center, category) {
    // 카테고리별 실제 같은 테스트 데이터
    const categoryData = {
        '헬스장': [
            { name: '24시 스마일 피트니스', dist: 0.008, dir: 'ne', hours: '00:00 ~ 24:00', rating: 4.8, tel: '02-123-4567' },
            { name: '파워 헬스클럽', dist: 0.012, dir: 'sw', hours: '06:00 ~ 22:00', rating: 4.5, tel: '02-987-6543' },
            { name: '바디챌린지 PT', dist: 0.005, dir: 'e', hours: '09:00 ~ 23:00', rating: 4.9, tel: '010-1234-5678' },
            { name: '액티브 스포츠센터', dist: 0.015, dir: 'n', hours: '06:00 ~ 24:00', rating: 4.4, tel: '02-456-7890' },
            { name: '헬스타임 피트니스', dist: 0.01, dir: 'se', hours: '05:30 ~ 23:30', rating: 4.7, tel: '02-345-6789' }
        ],
        '피트니스': [
            { name: '블루라인 피트니스', dist: 0.009, dir: 'nw', hours: '06:00 ~ 22:30', rating: 4.6, tel: '02-567-8901' },
            { name: '애플짐 피트니스', dist: 0.011, dir: 's', hours: '06:00 ~ 22:00', rating: 4.3, tel: '02-678-9012' },
            { name: '퍼스트클래스 PT', dist: 0.007, dir: 'ne', hours: '08:00 ~ 22:00', rating: 4.8, tel: '010-9876-5432' }
        ],
        '공원': [
            { name: '시민의숲 공원', dist: 0.02, dir: 'w', hours: '24시간 개방', rating: 4.7, tel: '02-120' },
            { name: '한강시민공원', dist: 0.025, dir: 's', hours: '24시간 개방', rating: 4.9, tel: '02-120' },
            { name: '중앙공원', dist: 0.015, dir: 'ne', hours: '05:00 ~ 22:00', rating: 4.5, tel: '02-120' },
            { name: '어린이대공원', dist: 0.03, dir: 'e', hours: '05:00 ~ 21:00', rating: 4.8, tel: '02-450-9311' }
        ],
        '산책로': [
            { name: '청계천 산책로', dist: 0.018, dir: 'n', hours: '24시간 개방', rating: 4.9, tel: '02-120' },
            { name: '북한산 둘레길', dist: 0.035, dir: 'n', hours: '일출 ~ 일몰', rating: 4.7, tel: '02-120' },
            { name: '안양천 자전거길', dist: 0.022, dir: 'sw', hours: '24시간 개방', rating: 4.5, tel: '02-120' },
            { name: '서울숲 산책로', dist: 0.019, dir: 'e', hours: '05:00 ~ 21:00', rating: 4.8, tel: '02-460-9372' }
        ],
        '수영장': [
            { name: '블루웨이브 수영장', dist: 0.014, dir: 'se', hours: '06:00 ~ 21:00', rating: 4.6, tel: '02-789-0123' },
            { name: '시립종합수영장', dist: 0.022, dir: 'ne', hours: '06:00 ~ 21:30', rating: 4.4, tel: '02-890-1234' },
            { name: '아쿠아스포츠센터', dist: 0.017, dir: 'sw', hours: '05:30 ~ 22:00', rating: 4.7, tel: '02-901-2345' }
        ],
        '체육시설': [
            { name: '종합체육관', dist: 0.025, dir: 'n', hours: '06:00 ~ 22:00', rating: 4.5, tel: '02-123-5678' },
            { name: '국민체육센터', dist: 0.02, dir: 'w', hours: '06:00 ~ 21:00', rating: 4.3, tel: '02-234-5678' },
            { name: '시립스포츠센터', dist: 0.018, dir: 'e', hours: '06:00 ~ 22:00', rating: 4.6, tel: '02-345-6789' }
        ],
        '요가': [
            { name: '서울요가', dist: 0.01, dir: 'n', hours: '06:00 ~ 21:00', rating: 4.8, tel: '02-987-6543' },
            { name: '요가라이프', dist: 0.008, dir: 'se', hours: '09:00 ~ 21:30', rating: 4.9, tel: '02-876-5432' },
            { name: '마이요가', dist: 0.012, dir: 'w', hours: '08:00 ~ 20:00', rating: 4.7, tel: '02-765-4321' }
        ],
        '테니스': [
            { name: '그린테니스장', dist: 0.03, dir: 'ne', hours: '06:00 ~ 22:00', rating: 4.4, tel: '02-432-1098' },
            { name: '시민테니스코트', dist: 0.028, dir: 's', hours: '07:00 ~ 21:00', rating: 4.5, tel: '02-321-0987' }
        ],
        '축구장': [
            { name: '종합운동장 축구장', dist: 0.04, dir: 'sw', hours: '09:00 ~ 18:00', rating: 4.6, tel: '02-210-9876' },
            { name: '시민축구장', dist: 0.035, dir: 'ne', hours: '08:00 ~ 20:00', rating: 4.3, tel: '02-109-8765' }
        ],
        '농구장': [
            { name: '농구코트', dist: 0.015, dir: 'nw', hours: '24시간 개방', rating: 4.2, tel: '02-120' },
            { name: '시립농구장', dist: 0.02, dir: 'se', hours: '09:00 ~ 21:00', rating: 4.4, tel: '02-987-6789' }
        ]
    };
    
    // 다른 카테고리가 입력되면 기본 데이터 사용
    const defaultPlaces = [
        { name: `${category} 센터 1`, dist: 0.01, dir: 'n', hours: '08:00 ~ 20:00', rating: 4.5, tel: '02-123-4567' },
        { name: `${category} 클럽 2`, dist: 0.015, dir: 's', hours: '09:00 ~ 21:00', rating: 4.3, tel: '02-234-5678' },
        { name: `${category} 스포츠 3`, dist: 0.02, dir: 'e', hours: '06:00 ~ 22:00', rating: 4.7, tel: '02-345-6789' },
        { name: `${category} 시설 4`, dist: 0.025, dir: 'w', hours: '07:00 ~ 23:00', rating: 4.2, tel: '02-456-7890' }
    ];
    
    // 카테고리에 맞는 장소 데이터 선택
    let placesList = defaultPlaces;
    for (const key in categoryData) {
        if (category.includes(key)) {
            placesList = categoryData[key];
            break;
        }
    }
    
    // 방향에 따른 좌표 계산 함수
    function getCoordByDirection(center, dist, dir) {
        // 거리를 위도/경도 차이로 변환 (대략적인 변환, 정확하지 않음)
        // 위도 1도 = 약 111km, 경도 1도 = 약 111km * cos(latitude)
        const latDist = dist / 111; // km -> 도 단위로 변환
        const lngFactor = Math.cos(center.lat() * Math.PI / 180);
        const lngDist = dist / (111 * lngFactor);
        
        let lat = center.lat();
        let lng = center.lng();
        
        // 방향에 따라 좌표 조정
        if (dir.includes('n')) lat += latDist;
        if (dir.includes('s')) lat -= latDist;
        if (dir.includes('e')) lng += lngDist;
        if (dir.includes('w')) lng -= lngDist;
        
        return { lat, lng };
    }
    
    // 지정된 위치에 장소 데이터 생성
    const places = [];
    placesList.forEach(place => {
        const coords = getCoordByDirection(center, place.dist, place.dir);
        places.push({
            name: place.name,
            lat: coords.lat,
            lng: coords.lng,
            address: `서울시 중구 을지로 ${Math.floor(Math.random() * 100) + 1}길 ${Math.floor(Math.random() * 30) + 1}`,
            category: category,
            hours: place.hours,
            rating: place.rating,
            tel: place.tel
        });
    });
    
    // 약간의 랜덤 장소 추가 (2~5개)
    const randomCount = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < randomCount; i++) {
        const randomDist = Math.random() * 0.03 + 0.005; // 500m ~ 3.5km
        const directions = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
        const randomDir = directions[Math.floor(Math.random() * directions.length)];
        const coords = getCoordByDirection(center, randomDist, randomDir);
        
        // 랜덤 장소 이름 생성
        const namePrefix = ['뉴', '더', '그랜드', '로얄', '스마트', '블루', '그린', '레드', '골드', '실버'];
        const nameSuffix = ['센터', '클럽', '짐', '스튜디오', '아카데미', '플레이스', '존', '스테이션'];
        
        places.push({
            name: `${namePrefix[Math.floor(Math.random() * namePrefix.length)]} ${category} ${nameSuffix[Math.floor(Math.random() * nameSuffix.length)]}`,
            lat: coords.lat,
            lng: coords.lng,
            address: `서울시 ${['종로구', '중구', '용산구', '성동구', '광진구'][Math.floor(Math.random() * 5)]} ${['을지로', '종로', '대학로', '강남대로', '테헤란로'][Math.floor(Math.random() * 5)]} ${Math.floor(Math.random() * 100) + 1}길 ${Math.floor(Math.random() * 30) + 1}`,
            category: category,
            hours: `${Math.floor(Math.random() * 4) + 6}:00 ~ ${Math.floor(Math.random() * 4) + 20}:00`,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            tel: `02-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        });
    }
    
    return places;
}

// 검색 결과를 지도에 표시하는 함수
function displayPlacesOnMap(places, category) {
    // 지도 범위 설정을 위한 경계 객체
    const bounds = new naver.maps.LatLngBounds();
    
    // 각 장소에 마커 생성
    places.forEach((place, index) => {
        const position = new naver.maps.LatLng(place.lat, place.lng);
        
        // 마커 추가
        const marker = addCategoryMarker(place.lat, place.lng, place.name, category);
        
        // 정보창 내용 생성
        let infoContent = `
            <div class="place-info">
                <h3>${place.name}</h3>
                <p><strong>카테고리:</strong> ${category}</p>
                <p><strong>주소:</strong> ${place.address || '정보 없음'}</p>
                ${place.hours ? `<p><strong>운영시간:</strong> ${place.hours}</p>` : ''}
                ${place.rating ? `<p><strong>평점:</strong> ${place.rating}/5.0</p>` : ''}
                ${place.tel ? `<p><strong>전화:</strong> ${place.tel}</p>` : ''}
                <div class="info-buttons">
                    <button onclick="findPathTo(${place.lat}, ${place.lng}, '${place.name.replace(/'/g, "\\'")}')" class="info-button">길찾기</button>
                    ${place.link ? `<button onclick="window.open('${place.link}', '_blank')" class="info-button">상세정보</button>` : ''}
                </div>
            </div>
        `;
        
        // 마커 클릭 시 정보창 표시
        naver.maps.Event.addListener(marker, 'click', function() {
            if (window.infoWindow) {
                window.infoWindow.close();
            }
            
            window.infoWindow = new naver.maps.InfoWindow({
                content: infoContent,
                maxWidth: 300,
                backgroundColor: "#fff",
                borderColor: "#ddd",
                borderWidth: 2,
                anchorSkew: true,
                anchorSize: new naver.maps.Size(10, 10),
                pixelOffset: new naver.maps.Point(10, -10)
            });
            
            window.infoWindow.open(map, marker);
        });
        
        // 경계에 위치 추가
        bounds.extend(position);
    });
    
    // 결과가 있으면 모든 결과가 보이도록 지도 조정
    if (places.length > 0) {
        map.fitBounds(bounds);
        
        // 결과가 하나만 있을 경우 적절한 줌 레벨 설정
        if (places.length === 1) {
            map.setZoom(15);
        }
    }
}

// 길찾기 함수
function findPathTo(lat, lng, name) {
    // 네이버 지도 길찾기 URL 생성
    const naverMapUrl = `https://map.naver.com/v5/directions/-/-/${lng},${lat},${encodeURIComponent(name)}/-/walk?c=14,0,0,0,dh`;
    
    // 새 창에서 네이버 지도 길찾기 열기
    window.open(naverMapUrl, '_blank');
}

// 카테고리 마커를 모두 제거하는 함수
function clearCategoryMarkers() {
    if (window.categoryMarkers && window.categoryMarkers.length) {
        for (let i = 0; i < window.categoryMarkers.length; i++) {
            if (window.categoryMarkers[i]) {
                window.categoryMarkers[i].setMap(null);
            }
        }
    }
    window.categoryMarkers = [];
}

// 연관된 카테고리 추천 함수
function getRelatedCategories(category) {
    const categoryGroups = {
        '헬스장': ['피트니스', '체육시설', '요가', '필라테스'],
        '피트니스': ['헬스장', '체육시설', '요가', '필라테스'],
        '공원': ['산책로', '둘레길', '근린공원'],
        '산책로': ['공원', '둘레길', '등산로'],
        '체육시설': ['헬스장', '피트니스', '수영장', '스포츠'],
        '수영장': ['체육시설', '스포츠', '헬스장'],
        '요가': ['필라테스', '헬스장', '피트니스'],
        '필라테스': ['요가', '헬스장', '피트니스'],
        '태권도': ['유도', '복싱', '무술'],
        '배드민턴': ['테니스', '스포츠', '체육시설'],
        '테니스': ['배드민턴', '스포츠', '체육시설'],
        '축구장': ['농구장', '야구장', '운동장'],
        '농구장': ['축구장', '야구장', '운동장'],
        '야구장': ['축구장', '농구장', '운동장'],
        '골프': ['스포츠', '체육시설'],
        '클라이밍': ['체육시설', '스포츠'],
        '볼링장': ['당구장', '스포츠', '체육시설'],
        '당구장': ['볼링장', '스포츠', '체육시설']
    };
    
    // 기본 추천 카테고리
    const defaultCategories = ['헬스장', '공원', '체육시설', '수영장'];
    
    // 입력한 카테고리에 대한 추천 카테고리 반환
    return categoryGroups[category] || defaultCategories;
}
