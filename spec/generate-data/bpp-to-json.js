const fs = require('fs')
    , readline = require('readline')
    , path = require('path')
    , inDir = path.join(__dirname, 'bpplib/Falkenauer')
    , outDir = path.join(__dirname, 'bpplib/Falkenauer_out')
    , util = require('util')

listFiles(inDir)
    .then(files => {
      for (const file of files) {
        processFile(file, path.join(outDir, path.basename(file, path.extname(file)) +'.json'))
      }
    })

async function listFiles(inDir) {
  const files = []
  const dir = await fs.promises.opendir(inDir);
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      files.push(path.join(inDir, dirent.name))
    }
  }
  return Promise.resolve(files)
}

function processFile(inFile, outFile) {
  fileToObject(inFile)
      .then(data => {
        shuffleArrayInPlace(data.data)
        return Promise.resolve(data)
      })
      .then(data => {
        fs.promises.appendFile(outFile, JSON.stringify(data))
      })
      .then(() => console.info(`Success: ${inFile}`))
      .catch(err => console.error(err))
}

async function fileToObject(inFile) {
  const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
    crlfDelay: Infinity,
  })
  var index = 0
  var expectedCount = undefined
  var capacity = undefined
  var data = []
  for await (const line of rl) {
    if (index === 0) {
      expectedCount = stringToInt(line)
    } else if (index === 1) {
      capacity = stringToInt(line)
    } else {
      data.push(stringToInt(line))
    }
    ++index
  }
  if (expectedCount !== data.length) {
    return Promise.reject(Error(`Expected ${expectedCount} data values, found ${data.length}`))
  } else {
    return Promise.resolve({'capacity': capacity, 'data': data})
  }
}

function stringToInt(s) {
  return parseInt(s)
}

function shuffleArrayInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
