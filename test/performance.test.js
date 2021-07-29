const path = require('path')
const fs = require('fs-extra')

const PDFMergerOld = require('../index')
const PDFMerger = require(`../promises`)

const PDFMergerBrowser = require('../browser')

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
    })

    test(`original: Merging several PDFs takes a long time/Uses a lot of memory (#27)`, async () => {
      const merger = new PDFMergerOld()
      
      merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
      merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
      merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")
      merger.add(path.join(FIXTURES_DIR, 'long_wikipedia_page.pdf'), "1 to 100")

      await merger.save(path.join(TMP_DIR, 'output1.pdf'))
    })

    test(`Merging several PDFs takes a long time/Uses a lot of memory (#27)`, async () => {
      const merger = new PDFMerger()

      await merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
      await merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
      await merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")
      await merger.add(path.join(FIXTURES_DIR, 'long_wikipedia_page.pdf'), "1 to 100")

      await merger.save(path.join(TMP_DIR, 'output2.pdf'))
    })

    test(`browser: Merging several PDFs takes a long time/Uses a lot of memory (#27)`, async () => {
      const merger = new PDFMerger()

      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'apollo_17.pdf')), Array.from(Array(20), (_, index) => index + 1))
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf')), "1 - 254")
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf')), "1 to 264")
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'long_wikipedia_page.pdf')), "1 to 100")
      
      const buffer = await merger.saveAsBuffer()

      // Write the buffer as a file
      await fs.writeFile(path.join(TMP_DIR, "outputx.pdf"), buffer)
    })

  })

  describe(`file size issues`, () => {
    test(`original: Merged result PDF file is 3x bigger than expected (#31)`, async () => {
      const merger = new PDFMergerOld()

      merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
      merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
      merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

      await merger.save(path.join(TMP_DIR, 'output3.pdf'))
      
      const input1Size = (await fs.stat(path.join(FIXTURES_DIR, 'apollo_17.pdf'))).size
      const input2Size = (await fs.stat(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'))).size
      const input3Size = (await fs.stat(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'))).size
      const outputSize = (await fs.stat(path.join(TMP_DIR, 'output3.pdf'))).size

      output.push({
        name: expect.getState().currentTestName, 
        fileSize: {
          input1: `${input1Size / (1024 * 1024)} MB`, 
          input2: `${input2Size / (1024 * 1024)} MB`, 
          input3: `${input3Size / (1024 * 1024)} MB`, 
          output: `${outputSize / (1024 * 1024)} MB`, 
          sumOfInput: `${(input1Size + input2Size + input3Size) / (1024 * 1024)} MB`, 
          difference: `${(outputSize - (input1Size + input2Size + input3Size)) / (1024 * 1024)} MB`, 
        }
      })
    })

    test(`Merged result PDF file is 3x bigger than expected (#31)`, async () => {
      const merger = new PDFMerger()

      await merger.add(path.join(FIXTURES_DIR, 'apollo_17.pdf'), Array.from(Array(20), (_, index) => index + 1))
      await merger.add(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'), "1 - 254")
      await merger.add(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'), "1 to 264")

      await merger.save(path.join(TMP_DIR, 'output4.pdf'))

      const input1Size = (await fs.stat(path.join(FIXTURES_DIR, 'apollo_17.pdf'))).size
      const input2Size = (await fs.stat(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'))).size
      const input3Size = (await fs.stat(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'))).size
      const outputSize = (await fs.stat(path.join(TMP_DIR, 'output4.pdf'))).size

      output.push({
        name: expect.getState().currentTestName, 
        fileSize: {
          input1: `${input1Size / (1024 * 1024)} MB`, 
          input2: `${input2Size / (1024 * 1024)} MB`, 
          input3: `${input3Size / (1024 * 1024)} MB`, 
          output: `${outputSize / (1024 * 1024)} MB`, 
          sumOfInput: `${(input1Size + input2Size + input3Size) / (1024 * 1024)} MB`, 
          difference: `${(outputSize - (input1Size + input2Size + input3Size)) / (1024 * 1024)} MB`, 
        }
      })
    })

    test(`browser: Merged result PDF file is 3x bigger than expected (#31)`, async () => {
      const merger = new PDFMergerBrowser()

      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'apollo_17.pdf')), Array.from(Array(20), (_, index) => index + 1))
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf')), "1 - 254")
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf')), "1 to 264")

      const buffer = await merger.saveAsBuffer()
      // Write the buffer as a file
      await fs.writeFile(path.join(TMP_DIR, "output5.pdf"), buffer)

      const input1Size = (await fs.stat(path.join(FIXTURES_DIR, 'apollo_17.pdf'))).size
      const input2Size = (await fs.stat(path.join(FIXTURES_DIR, 'sense_and_sensibility.pdf'))).size
      const input3Size = (await fs.stat(path.join(FIXTURES_DIR, 'pride_and_prejudice.pdf'))).size
      const outputSize = (await fs.stat(path.join(TMP_DIR, 'output5.pdf'))).size

      output.push({
        name: expect.getState().currentTestName, 
        fileSize: {
          input1: `${input1Size / (1024 * 1024)} MB`, 
          input2: `${input2Size / (1024 * 1024)} MB`, 
          input3: `${input3Size / (1024 * 1024)} MB`, 
          output: `${outputSize / (1024 * 1024)} MB`, 
          sumOfInput: `${(input1Size + input2Size + input3Size) / (1024 * 1024)} MB`, 
          difference: `${(outputSize - (input1Size + input2Size + input3Size)) / (1024 * 1024)} MB`, 
        }
      })
    })

    test(`original: files from issue - Merged result PDF file is 3x bigger than expected (#31)`, async () => {
      const merger = new PDFMergerOld()

      merger.add(path.join(FIXTURES_DIR, 'cover.pdf'))
      merger.add(path.join(FIXTURES_DIR, 'diary.pdf'))
      await merger.save(path.join(TMP_DIR, 'output6.pdf'))

      const input1Size = (await fs.stat(path.join(FIXTURES_DIR, 'cover.pdf'))).size
      const input2Size = (await fs.stat(path.join(FIXTURES_DIR, 'diary.pdf'))).size
      const outputSize = (await fs.stat(path.join(TMP_DIR, 'output6.pdf'))).size

      output.push({
        name: expect.getState().currentTestName, 
        fileSize: {
          input1: `${input1Size / (1024 * 1024)} MB`, 
          input2: `${input2Size / (1024 * 1024)} MB`, 
          output: `${outputSize / (1024 * 1024)} MB`,
          sumOfInput: `${(input1Size + input2Size) / (1024 * 1024)} MB`, 
          difference: `${(outputSize - (input1Size + input2Size)) / (1024 * 1024)} MB`, 
        }
      })
    })

    test(`files from issue - Merged result PDF file is 3x bigger than expected (#31)`, async () => {
      const merger = new PDFMerger()

      await merger.add(path.join(FIXTURES_DIR, 'cover.pdf'))
      await merger.add(path.join(FIXTURES_DIR, 'diary.pdf'))

      await merger.save(path.join(TMP_DIR, 'output7.pdf'))

      const input1Size = (await fs.stat(path.join(FIXTURES_DIR, 'cover.pdf'))).size
      const input2Size = (await fs.stat(path.join(FIXTURES_DIR, 'diary.pdf'))).size
      const outputSize = (await fs.stat(path.join(TMP_DIR, 'output7.pdf'))).size

      output.push({
        name: expect.getState().currentTestName, 
        fileSize: {
          input1: `${input1Size / (1024 * 1024)} MB`, 
          input2: `${input2Size / (1024 * 1024)} MB`, 
          sumOfInput: `${(input1Size + input2Size) / (1024 * 1024)} MB`, 
          output: `${outputSize / (1024 * 1024)} MB`,
          difference: `${(outputSize - (input1Size + input2Size)) / (1024 * 1024)} MB`, 
        }
      })
    })

    test(`browser: files from issue - Merged result PDF file is 3x bigger than expected (#31)`, async () => {
      const merger = new PDFMergerBrowser()

      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'cover.pdf')))
      await merger.add(await fs.readFile(path.join(FIXTURES_DIR, 'diary.pdf')))

      const buffer = await merger.saveAsBuffer()
      // Write the buffer as a file
      await fs.writeFile(path.join(TMP_DIR, "output8.pdf"), buffer)


      const input1Size = (await fs.stat(path.join(FIXTURES_DIR, 'cover.pdf'))).size
      const input2Size = (await fs.stat(path.join(FIXTURES_DIR, 'diary.pdf'))).size
      const outputSize = (await fs.stat(path.join(TMP_DIR, 'output8.pdf'))).size

      output.push({
        name: expect.getState().currentTestName, 
        fileSize: {
          input1: `${input1Size / (1024 * 1024)} MB`, 
          input2: `${input2Size / (1024 * 1024)} MB`, 
          sumOfInput: `${(input1Size + input2Size) / (1024 * 1024)} MB`, 
          output: `${outputSize / (1024 * 1024)} MB`,
          difference: `${(outputSize - (input1Size + input2Size)) / (1024 * 1024)} MB`, 
        }
      })
    })

  })

  afterAll(async () => {
    await fs.remove(TMP_DIR)
    console.log(output)
    global.gc()
  })
})