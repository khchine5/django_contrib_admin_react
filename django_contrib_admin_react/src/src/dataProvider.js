import { stringify } from 'query-string'
import { fetchUtils } from 'react-admin'
import Cookies from 'universal-cookie'

// import { store } from 'index'
// https://gist.github.com/thclark/722ea2bae42db05c38a5c583ba976c52

const camelCaseKeys = require('camelcase-keys')

const snakeCaseKeys = require('snakecase-keys')

const cookies = new Cookies()


const fetchJson = (url, options = {}) => {
  const fullUrl = `${window.baseUrl}/api/${url}`
  // const { access } = store.getState().auth
  const cookie = cookies.get('csrftoken')

  // Convert keys to snake case (to comply with backend spec) and serialize body to json
  if (options.body) {
    // eslint-disable-next-line no-param-reassign
    options.body = JSON.stringify(snakeCaseKeys(options.body, { deep: true }))
  }

  if (!options.headers) {
    // eslint-disable-next-line no-param-reassign
    options.headers = new Headers({ Accept: 'application/json' })
  }

  // Inject the Authorization header from the redux store, if there is one
  //if (access) {
  //  options.headers.set('Authorization', `JWT ${access.token}`)
  //}

  // Inject the CSRF token, if there is one
  if (cookie) {
    options.headers.set('X-CSRFToken', `${cookie}`)
  }

  // add your own headers here
  // options.headers.set('X-Custom-Header', 'foobar')
  return fetchUtils.fetchJson(fullUrl, options)
}


const getListFromResponse = response => {
  const { headers, json } = response
  if ('count' in json) {
    return { data: camelCaseKeys(json.results, { deep: true }), total: json.count }
  }
  if (headers.has('content-range')) {
    return {
      data: json,
      total: parseInt(
        headers
          .get('content-range')
          .split('/')
          .pop(),
        10,
      ),
    }
  }
  if ('detail' in json && json.detail === 'Invalid page.') {
    return { data: [], total: 0 }
  }
  throw new Error('The total number of results is unknown. The DRF data provider expects responses for lists of resources to contain this information to build the pagination. If you\'re not using the default PageNumberPagination class, please include this information using the Content-Range header OR a "count" key inside the response.')
}


/**
 * Maps react-admin queries to the default format of Django REST Framework
 */
export default {
  getList: (resource, params) => {
    const options = {}
    const { page, perPage } = params.pagination
    const { field, order } = params.sort
    const { filter } = params
    const query = {
      page,
      page_size: perPage,
      ordering: `${order === 'ASC' ? '' : '-'}${field}`,
      ...filter,
    }
    const url = `${resource}/?${stringify(query)}`
    return fetchJson(url, options).then(response => getListFromResponse(response))
  },
  getOne: (resource, params) => {
    const options = {}
    const url = `${resource}/${params.id}/`
    return fetchJson(url, options).then(response => {
      return { data: camelCaseKeys(response.json, { deep: true }) }
    })
  },
  getMany: (resource, params) => {
    const options = { method: 'GET' }
    return Promise.all(
      params.ids.map(id => fetchJson(`${resource}/${id}/`, options)),
    ).then(responses => ({
      data: responses.map(response => camelCaseKeys(response.json, { deep: true })),
    }))
  },
  getManyReference: (resource, params) => {
    const { page, perPage } = params.pagination
    const { field, order } = params.sort
    const { filter, target, id } = params
    const query = {
      page,
      page_size: perPage,
      ordering: `${order === 'ASC' ? '' : '-'}${field}`,
      ...filter,
      [target]: id,
    }
    const url = `${resource}/?${stringify(query)}`
    const options = {}
    return fetchJson(url, options).then(response => getListFromResponse(response))
  },
  create: (resource, params) => {
    const url = `${resource}/`
    const options = {
      method: 'POST',
      body: params.data,
    }
    return fetchJson(url, options).then(response => {
      // TODO review whether we need to update all data or just the ID
      //  return { data: camelCaseKeys(response.json, { deep: true }) }
      return { data: { ...params.data, id: response.json.id } }
    })
  },
  update: (resource, params) => {
    const url = `${resource}/${params.id}/`
    const options = {
      method: 'PUT',
      body: params.data,
    }
    return fetchJson(url, options).then(response => {
      return { data: camelCaseKeys(response.json, { deep: true }) }
    })
  },
  updateMany: (resource, params) => {
    return Promise.all(
      params.ids.map(id => fetchJson(`${resource}/${id}`, {
        method: 'PUT',
        body: params.data,
      })),
    ).then(responses => ({
      data: responses.map(response => camelCaseKeys(response.json, { deep: true })),
    }))
  },
  delete: (resource, params) => {
    const url = `${resource}/${params.id}/`
    const options = {
      method: 'DELETE',
    }
    return fetchJson(url, options).then(() => {
      // todo should this really be like this? or like the default
      //  return { data: response.json }
      return { data: params.previousData }
    })
  },
  deleteMany: (resource, params) => {
    // TODO can we check whether the viewsets need this customisation?
    //  Perhaps we can make a single query like the example in
    //  https://github.com/marmelab/react-admin/blob/v3.0.0-beta.0/docs/DataProviders.md
    return Promise.all(
      params.ids.map(id => fetchJson(`${resource}/${id}`, { method: 'DELETE' })),
    ).then(responses => ({
      data: responses.map(response => camelCaseKeys(response.json, { deep: true })),
    }))
  },
}