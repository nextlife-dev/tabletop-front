import axios from "axios";

const getTokenHeaders = () => {
    const TOKEN_TYPE = localStorage.getItem("tokenType");
    const ACCESS_TOKEN = localStorage.getItem("accessToken");
    let REFRESH_TOKEN = localStorage.getItem("refreshToken");

    return {
        'Authorization': `${TOKEN_TYPE} ${ACCESS_TOKEN}`,
        'REFRESH_TOKEN': REFRESH_TOKEN
    };
};

export const SellerApi = axios.create({
    baseURL: `http://localhost:8080`,
    headers: {
        'Content-Type' : 'application/json'
    }
});

const refreshAccessToken = async () => {
    try {
        const response = await SellerApi.post(`/api/auth/token/refresh`, null, {
            headers: getTokenHeaders()
        });
        const ACCESS_TOKEN = response.data;
        localStorage.setItem('accessToken', ACCESS_TOKEN);
    } catch (err) {
        if (err.response && err.response.status === 401) {
            // 리프레시 토큰이 만료된 경우 로그인 페이지로 이동
            alert(err.response.data.message);
            localStorage.clear();
            window.location.href = '/signin'; // 로그인 페이지로 리디렉션
        }
    }
};

SellerApi.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        await refreshAccessToken();
         // 새로운 토큰으로 Authorization 헤더를 업데이트한 후 다시 요청
        originalRequest.headers['Authorization'] = `${localStorage.getItem("tokenType")} ${localStorage.getItem('accessToken')}`;
        return SellerApi(originalRequest);
    }

    return Promise.reject(error);
});

// 회원가입
export const signUp = async ({ loginId, email, password, username, mobile }) => {
    const data = { loginId, email, password, username, mobile };
    const response = await SellerApi.post(`/api/sellers/signup`, data);
    return response.data;
};

// 판매자 정보 조회
export const getSellerInfo = async (loginId) => {
    const response = await SellerApi.get(`/api/sellers/${loginId}`, {
        headers: getTokenHeaders()
    });
    return response.data;
};

// 판매자 정보 수정
export const updateSellerInfo = async (loginId, sellerDto) => {
    const response = await SellerApi.put(`/api/sellers/${loginId}`, sellerDto, {
        headers: getTokenHeaders()
    });
    return response.data;
};

// 판매자 탈퇴
export const deleteSeller = async (loginId) => {
    const response = await SellerApi.delete(`/api/sellers/${loginId}`, {
        headers: getTokenHeaders()
    });
    return response;
};