const express = require('express')
require('dotenv').config()

const path = require('path')
const errorHandler = require('errorhandler')
const logger = require('morgan')
const methodOverride = require('method-override')

const port = 3000

const app = express()

app.use(logger('dev'))
app.use(errorHandler())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride())

const Prismic = require('@prismicio/client');
const PrismicDOM = require('prismic-dom');

const initApi = req => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req
  });
}

const handleLinkResolver = doc => {
  console.log('doc', doc);
  if (doc.type === 'product') {
    return `/detail/${doc.slug}`
  }
  if (doc.type === 'collections') {
    return '/collections'
  }
  if (doc.type === 'about') {
    return '/about'
  }

  return '/';

  // return doc.type === 'product'
  //   ? `/detail/${doc.slug}`
  //   : doc.type === 'about' ? '/about' : doc.type === 'collections' ? '/collections' : '/'
}



app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use((req, res, next) => {

  res.locals.Link = handleLinkResolver

  res.locals.Numbers = index => {
    return index == 0 ? 'One' : index == 1 ? 'Two' : index == 2 ? 'Three' : index == 3 ? 'Four' : ''
  }

  res.locals.PrismicDOM = PrismicDOM;

  next()
})

const handleRequest = async api => {
  const meta = await api.getSingle('meta')
  const navigation = await api.getSingle('navigation')
  const preloader = await api.getSingle('preloader')
  return {
    meta,
    navigation,
    preloader
  }
}

app.get('/', async (req, res) => {
  const api = await initApi(req)
  const home = await api.getSingle('home')
  const defaults = await handleRequest(api)

  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })

  console.log('home', home);
  res.render('pages/home', {
    ...defaults,
    collections,
    home,
  });
})

app.get('/about', async (req, res) => {
  const api = await initApi(req)
  const about = await api.getSingle('about')
  const defaults = await handleRequest(api)
  res.render('pages/about', {
    ...defaults,
    about,
  });
})


app.get('/detail/:uid', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title'
  })
  res.render('pages/detail', {
    ...defaults,
    product,
  });
})


app.get('/collections', async (req, res) => {
  const api = await initApi(req)
  const home = await api.getSingle('home')
  const defaults = await handleRequest(api)
  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.image'
  })
  res.render('pages/collections', {
    ...defaults,
    home,
    collections,
  });
})


app.listen(port, () => console.log(`Server listening on port : ${port}`))
