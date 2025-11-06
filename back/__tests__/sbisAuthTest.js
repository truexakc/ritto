const axios = require('axios');

const login = process.env.SBIS_LOGIN || '594811838994';
const password = process.env.SBIS_PASSWORD || 'Pass32154';

async function testAuth() {
    try {
        const response = await axios.post(
            'https://online.sbis.ru/auth/service/',
            {
                jsonrpc: '2.0',
                method: 'СБИС.Аутентификация.Вход', // <-- заменили здесь
                params: {
                    login,
                    password,
                },
                id: 1,
            },
            {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
            }
        );

        console.log('✅ Авторизация успешна!');
        console.dir(response.data, { depth: null });
    } catch (error) {
        console.error('❌ Ошибка авторизации:');
        if (error.response) {
            console.dir(error.response.data, { depth: null });
        } else {
            console.error(error.message);
        }
    }
}

testAuth();
