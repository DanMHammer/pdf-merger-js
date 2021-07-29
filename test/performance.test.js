const path = require('path')
const fs = require('fs-extra')

const PDFMerger = require('../index')
const PDFMergerOld = require(`../index.old`)
const PDFMergerBrowser = require(`../browser`)

const FIXTURES_DIR = path.join(__dirname, 'fixtures')
const TMP_DIR = path.join(__dirname, 'tmp')

jest.setTimeout(100000)

const output = [];

describe(`performance issues`, () => {
  describe(`memory and time issues`, () => {
    let startTime = process.hrtime()
    let maxMemoryConsumption = 0

    beforeAll(async () => {
      await fs.ensureDir(TMP_DIR)
      global.gc()
      await new Promise(resolve => setTimeout(resolve, 1000))
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

    afterEach(async () => {
      const time = process.hrtime(startTime)
      output.push({name: expect.getState().currentTestName, time: `${time[0]}.${time[1]} s`, memory: `${maxMemoryConsumption / (1024 * 1024)} MB`})
      maxMemoryConsumption = 0
      global.gc()
      await new Promise(resolve => setTimeout(resolve, 1000))
    })

    test(`original: Merging several PDFs takes a long time/Uses a lot of memory (#27)`, async () => {
      const merger = new PDFMergerOld()
      
      merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), Array.from(Array(200), (_, index) => index + 1))
      merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")
      merger.add(path.join(FIXTURES_DIR, 'long_wikipedia_page.pdf'), "1 to 100")

      await merger.save(path.join(TMP_DIR, 'output1.pdf'))
    })

    test(`original: Merging several PDFs takes a long time/Uses a lot of memory (#27)`, async () => {
      const merger = new PDFMerger()
      
      merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), Array.from(Array(200), (_, index) => index + 1))
      merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")
      merger.add(path.join(FIXTURES_DIR, 'long_wikipedia_page.pdf'), "1 to 100")

      await merger.save(path.join(TMP_DIR, 'output2.pdf'))
    })


    test(`browser: Merging several PDFs takes a long time/Uses a lot of memory (#27)`, async () => {
      const merger = new PDFMergerBrowser()

      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf')), Array.from(Array(200), (_, index) => index + 1))
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf')), "1 to 264")
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'long_wikipedia_page.pdf')), "1 to 100")
      
      const buffer = await merger.saveAsBuffer()

      // Write the buffer as a file
      await fs.writeFile(path.join(TMP_DIR, "output3.pdf"), buffer)
    })

  })

  afterAll(async () => {
    await fs.remove(TMP_DIR)
    console.log(output)
    global.gc()
  })
})