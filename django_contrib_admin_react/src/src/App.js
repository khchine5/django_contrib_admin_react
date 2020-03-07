import React, { Component } from "react";
import { Admin, Resource, ListGuesser, EditGuesser, ShowGuesser } from 'react-admin';
import drfProvider from 'ra-data-drf';
import { fetchUtils } from 'react-admin'
import Cookies from 'universal-cookie';


const apiUrl = "http://127.0.0.1:8000";
const cookies = new Cookies();
const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    let csrftoken = cookies.get('csrftoken');
    const token = localStorage.getItem('token');
    options.headers.set('Authorization', `Token ${token}`);
    options.headers.set('X-CSRFTOKEN', csrftoken);
    return fetchUtils.fetchJson(url, options);
};


const dataProvider =
  drfProvider(apiUrl,httpClient);

class App extends Component {
  render() {
    let res = this.state.resources.map((i) => {return <Resource name={i} list={ListGuesser} edit={EditGuesser} show={ShowGuesser} />;});

    return (
      <Admin dataProvider={dataProvider}>
        {res}
      </Admin>
    );
  }
  componentDidMount() {
    fetch(apiUrl+'/').then(response => response.json()).then(response => {
          console.log('response',response)
          let res = response.reduce((a, cur) => {
            console.log('a',a)
            console.log('cur',cur)
            let b=cur.models.map((m) => {return m.admin_url.replace(/\/$/, "");});
            return [...a, ...b];
            }
            ,[]);
            this.setState({'resources': res});
        }
    );
    document.title = "Django Admin";
  }
  constructor(props) {
    super(props);
    this.state = {
      resources: []
    };
  }

}

export default App;

