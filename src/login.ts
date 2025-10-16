import { setAccessToken, removeAccessToken, getAccessToken } from './tokenService.js'; 
interface LoginResponse {
    email: string;
    access_token: string;
}

async function loginAndStoreToken(email: string, password: string): Promise<void> {
    const loginUrl = 'http://203.159.93.114:3100/auth/login';
    try{
        const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    if (!response.ok) {
        throw new Error('Login failed');
    }
    const responseData: LoginResponse = await response.json();
    const token = responseData.access_token;

    if(token){
        setAccessToken(token);
        console.log('Access token stored successfully');
        window.location.href = 'invoice.html';
    } else {
        throw new Error('No access token received');
    }
}  catch (error: any) {
    console.error('Authen error:', error.message);
    alert('Login failed: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const signInBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    if(form && emailInput && passwordInput && signInBtn){
        form.addEventListener('submit',async (event) =>{
            event.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            await loginAndStoreToken(email, password);
        });
    }
});