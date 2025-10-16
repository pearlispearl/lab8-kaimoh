var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { setAccessToken } from './tokenService.js';
function loginAndStoreToken(email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const loginUrl = 'http://203.159.93.114:3100/auth/login';
        try {
            const response = yield fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                throw new Error('Login failed');
            }
            const responseData = yield response.json();
            const token = responseData.access_token;
            if (token) {
                setAccessToken(token);
                console.log('Access token stored successfully');
                window.location.href = 'invoice.html';
            }
            else {
                throw new Error('No access token received');
            }
        }
        catch (error) {
            console.error('Authen error:', error.message);
            alert('Login failed: ' + error.message);
        }
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const signInBtn = document.querySelector('button[type="submit"]');
    if (form && emailInput && passwordInput && signInBtn) {
        form.addEventListener('submit', (event) => __awaiter(void 0, void 0, void 0, function* () {
            event.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            yield loginAndStoreToken(email, password);
        }));
    }
});
