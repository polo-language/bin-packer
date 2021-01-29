const fs = require('fs')
    , readline = require('readline')
    , path = require('path')
    , solutionsFile = path.join(__dirname, 'bpplib/Falkenauer_solutions.txt')
    , inDir = path.join(__dirname, 'bpplib/Falkenauer')
    , outFile = 'spec/data/Falkenauer.json'

main()

async function main() {
  const solutions = await solutionsFileToObject(solutionsFile)

  listFiles(inDir)
      .then(filesToObject.bind(null, solutions))
      .then(data => fs.promises.appendFile(outFile, JSON.stringify(data)))
      .catch(console.error)
}

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

async function filesToObject(solutions, files) {
  const obj = {}
  for (const file of files) {
    const data = await fileToObject(file)
    shuffleArrayInPlace(data.data)
    data.solution = solutions[data.name]
    obj[data.name] = data
  }
  return Promise.resolve(obj)
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
    return Promise.resolve({
      'name': path.basename(inFile, path.extname(inFile)),
      'capacity': capacity,
      'data': data,
    })
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

async function solutionsFileToObject(inFile) {
  const rl = readline.createInterface({
    input: fs.createReadStream(inFile),
    crlfDelay: Infinity,
  })
  var data = {}
  for await (const line of rl) {
    const split = line.split(' ')
    data[path.basename(split[0], path.extname(split[0]))] = split[1]
  }
  return Promise.resolve(data)
}
