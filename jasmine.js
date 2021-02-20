'use strict'

import glob from 'glob'
import Jasmine from 'jasmine'

// See https://github.com/jasmine/jasmine-npm/issues/170#issuecomment-719420650

glob('./spec/**/*spec.js', async (err, files) => {
  if (err) {
    throw err
  }
  const jasmine = new Jasmine()
  await Promise.all(files.map(f => import(f)))
  jasmine.execute()
})
