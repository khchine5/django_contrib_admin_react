//import Request from 'request';
//import cookie from 'react-cookie';
import Cookies from 'universal-cookie';
const cookies = new Cookies();

const authProvider = {
    login: ({ username, password }) =>  {
        let loginUrl = "/en/api/v1/user/rest-auth/login/";
        let email = username;
        let csrftoken = cookies.get('csrftoken');
        // console.log('csrfmiddlewaretoken',csrfmiddlewaretoken);
        const request = new Request(loginUrl, {
            method: 'POST',
            // mode: 'no-cors',
            credentials: 'include',
            mode: 'same-origin',
            body: JSON.stringify({ 'email':email, 'password':password}),
            //headers: new Headers({ 'Content-Type': 'multipart/form-data',
            //                        'Accept': 'text/html,application/xhtml+xml'})
            //headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded'}),
            headers: new Headers({ 'content-type': 'application/json',
                                    'Accept': 'application/json',
                                    'X-CSRFToken': csrftoken}),
        });
        return fetch(request).then(response => {
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(response.statusText);
                }
                return response.json();
            })
            .then(({ token }) => {
                localStorage.setItem('token', token);
            });
    },
    logout: () => {
        localStorage.removeItem('token');
        return Promise.resolve();
    },
    checkError: (error) => {
        const status = error.status;
        if (status === 401 || status === 403) {
            localStorage.removeItem('token');
            return Promise.reject();
        }
        return Promise.resolve();
    },
    checkAuth: () =>
        localStorage.getItem('token') ? Promise.resolve() : Promise.reject(),
    getPermissions: () => Promise.reject('Unknown method'),

};

export default authProvider;
