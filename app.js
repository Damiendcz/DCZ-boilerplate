const express = require('express')
require('dotenv').config()
const path = require('path')
const port = 3000

const Prismic = require('@prismicio/client');
const PrismicDOM = require('prismic-dom');

const initApi = req => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req
  });
}

const handleLinkResolver = doc => {

  // Define the url depending on the document type
  // if (doc.type === 'page') {
  //   return '/page/' + doc.uid;
  // } else if (doc.type === 'blog_post') {
  //   return '/blog/' + doc.uid;
  // }

  // Default to homepage
  return '/';
}

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: handleLinkResolver,
  }
  res.locals.PrismicDOM = PrismicDOM;
  next()
})

app.get('/', (req, res) => {
  res.render('pages/home')
})

app.get('/about', (req, res) => {
  initApi(req).then(api => {
    api.query(
      Prismic.Predicates.any('document.type', ['meta', 'about']),
    ).then(response => {
      const { results } = response
      const [meta, about] = results
      console.log(meta.data);
      res.render('pages/about', {
        about,
        meta
      });
    })
  })
})

app.get('/detail/:id', (req, res) => {
  res.render('pages/detail')
})

app.get('/collections', (req, res) => {
  res.render('pages/collection')
})


app.listen(port, () => console.log(`Server listening on port : ${port}`))
