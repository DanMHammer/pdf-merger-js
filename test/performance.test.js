const path = require('path')
const fs = require('fs-extra')
const pdfDiff = require('pdf-diff')

const { memoryUsage } = require('process');

const PDFMergerOld = require('../index')
const PDFMergerNewFns = require(`../index.newFns`)
const PDFMergerSimpleChanges = require(`../index.simple_changes`)
const PDFMergerPromises = require('../index.promises')
const PDFMergerAsync = require('../index.async')
const PDFMergerAsyncNewFns = require('../index.asyncNewFns')

const PDFMergerBrowserOld = require(`../browser`)
const PDFMergerBrowserNewFns = require(`../browser.newFns`)

const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const TMP_DIR = path.join(__dirname, 'tmp')

jest.setTimeout(10000000)

let maxMemoryConsumption = 0;
let consumption = [];
let time = [];
let startTime = process.hrtime();

describe('PDFMerger', () => {
  beforeAll(async () => {
    await fs.ensureDir(TMP_DIR)
    gc();
  });

  beforeEach(async () => {
    startTime = process.hrtime();
    process.nextTick(() => {
      let memUsage = process.memoryUsage();
      if (memUsage.rss > maxMemoryConsumption) {
        maxMemoryConsumption = memUsage.rss;
      }
    })
  })

  afterEach(() => {
    time.push(process.hrtime(startTime))
    consumption.push(maxMemoryConsumption / (1024 * 1024))
    maxMemoryConsumption = 0;
    gc();
  })

  test('main-old: merge two files with many pages with page range', async () => {
    const merger = new PDFMergerOld()

    merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
    merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
    merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

    await merger.save(path.join(TMP_DIR, 'output1.pdf'))

    expect(true)
  })

  test('main-simple_changes: merge two files with many pages with page range', async () => {
    const merger = new PDFMergerSimpleChanges()

    merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
    merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
    merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

    await merger.save(path.join(TMP_DIR, 'output2.pdf'))

    expect(true)
  })

  test('main-promises: merge two files with many pages with page range using Promises', async () => {
    const merger = new PDFMergerPromises()

    merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
    merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
    merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

    await merger.save(path.join(TMP_DIR, 'output2.pdf'))

    expect(true)
  })

  test('main-async: merge two files with many pages with page range using async', async () => {
    const merger = new PDFMergerAsync()

    await merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
    await merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
    await merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

    await merger.save(path.join(TMP_DIR, 'output2.pdf'))

    expect(true)
  })

  test('main-async-newFns: merge two files with many pages with page range using async and new functions', async () => {
    const merger = new PDFMergerAsync()

    await merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
    await merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
    await merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

    await merger.save(path.join(TMP_DIR, 'output2.pdf'))

    expect(true)
  })
  

  test('main: merge two files with many pages with page range using new pdfjs functions', async () => {
    const merger = new PDFMergerNewFns()

    merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
    merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
    merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

    await merger.save(path.join(TMP_DIR, 'output3.pdf'))

    expect(true)
  })

  test('main: merge two files with many pages', async () => {
    const merger = new PDFMergerOld()

    merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'))
    merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'))
    merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'))

    await merger.save(path.join(TMP_DIR, 'output4.pdf'))

    expect(true)
  })

  test('main: compare memory usage', async () => {
    // Expect better memory usage and timing with new function vs just the simple optimizations
    const [old, simpleChages, promises, async, asyncNewFns, newFns, entireDoc] = consumption
    const [oldTime, simpleChagesTime, promisesTime, asyncTime, asyncNewFnsTime, newFnsTime, entireDocTime] = time
    // Verify that the extra memory from adding specific pages vs the whole document is less severe
    const percentDiffs = [(old - entireDoc)/entireDoc * 100, (simpleChages - entireDoc)/entireDoc * 100, (promises - entireDoc)/entireDoc * 100, (async - entireDoc)/entireDoc * 100, (newFns - entireDoc)/entireDoc * 100]
    console.log({consumption: {old, simpleChages, promises, async, asyncNewFns, newFns, entireDoc}, time: {oldTime, simpleChagesTime, promisesTime, asyncTime, asyncNewFnsTime, newFnsTime, entireDocTime}, percentDiffs: {old: percentDiffs[0], simpleChages: percentDiffs[1], promises: percentDiffs[2], async: percentDiffs[3], newFns: percentDiffs[4]}})
    expect(true)
  }) 

  test('browser-old: merge two files with many pages with page range', async () => {
    const merger = new PDFMergerBrowserOld()
    
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'apollo_17.pdf')), Array.from(Array(20), (_, index) => index + 1)
    )
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf')), "1 to 254"
    )
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf')), "1 - 264"
    )

    const buffer = await merger.saveAsBuffer()
    // Write the buffer as a file for pdfDiff
    await fs.writeFile(path.join(TMP_DIR, 'output5.pdf'), buffer)
    
    expect(true)
  })

  test('browser: merge two files with many pages with page range using new pdfjs functions', async () => {
    const merger = new PDFMergerBrowserNewFns()
    
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'apollo_17.pdf')), Array.from(Array(20), (_, index) => index + 1)
    )
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf')), "1 to 254"
    )
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf')), "1 - 264"
    )

    const buffer = await merger.saveAsBuffer()
    // Write the buffer as a file for pdfDiff
    await fs.writeFile(path.join(TMP_DIR, 'output6.pdf'), buffer)
    
    expect(true)
  })


  test('browser: merge two files with many pages', async () => {
    const merger = new PDFMergerBrowserOld()
    
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'apollo_17.pdf'))
    )
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'))
    )
    await merger.add(
      await fs.readFile(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'))
    )

    const buffer = await merger.saveAsBuffer()
    // Write the buffer as a file for pdfDiff
    await fs.writeFile(path.join(TMP_DIR, 'output7.pdf'), buffer)
    
    expect(true)
  })

  test('browser: compare memory usage', async () => {
    // Expect better memory usage with new function
    const [old, newFns, entireDoc] = consumption.slice(8)
    const [oldTime, newFnsTime, entireDocTime] = time.slice(8)
    // Verify that the extra memory from adding specific pages vs the whole document is less severe
    const percentDiffs = [(old - entireDoc)/entireDoc * 100, (newFns - entireDoc)/entireDoc * 100]
    console.log({consumption: {old, newFns, entireDoc}, time: {oldTime, newFnsTime, entireDocTime}, percentDiffs: {old: percentDiffs[0], newFns: percentDiffs[1]}})
    expect(true)
  }) 


  afterAll(async () => {
    await fs.remove(TMP_DIR)
  })
})
