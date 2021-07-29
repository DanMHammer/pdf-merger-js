const pdf = require('pdfjs')
const fs = require('fs').promises

class PDFMerger {
  constructor () {
    this._resetDoc()
  }

  add (inputFile, pages) {
    if (typeof pages === 'undefined' || pages === null) {
      return this._addEntireDocument(inputFile, pages)
    } else if (Array.isArray(pages)) {
      return this._addGivenPages(inputFile, pages)
    } else if (pages.indexOf(',') > 0) {
      return this._addGivenPages(inputFile, pages.replace(/ /g, '').split(','))
    } else if (pages.toLowerCase().indexOf('to') >= 0) {
      const span = pages.replace(/ /g, '').split('to')
      return this._addFromToPage(
        inputFile,
        parseInt(span[0]),
        parseInt(span[1])
      )
    } else if (pages.indexOf('-') >= 0) {
      const span = pages.replace(/ /g, '').split('-')
      return this._addFromToPage(
        inputFile,
        parseInt(span[0]),
        parseInt(span[1])
      )
    } else {
      console.error('invalid parameter "pages"')
    }
  }

  _resetDoc () {
    if (this.doc) {
      delete this.doc
    }
    this.doc = new pdf.Document()
  }

  async _getInputFile (inputFile) {
    return new Promise((resolve) => {
      if (inputFile instanceof Buffer) {
        resolve(inputFile)
      } else {
        resolve(fs.readFile(inputFile))
      }
    })
  }

  async _addEntireDocument (inputFile) {
    const src = await this._getInputFile(inputFile)
    const ext = new pdf.ExternalDocument(src)

    return this.doc.addPagesOf(ext)
  }

  async _addFromToPage (inputFile, from, to) {
    if (
      typeof from === 'number' &&
      typeof to === 'number' &&
      from > 0 &&
      to > from
    ) {
      const pages = []

      for (let i = from; i <= to; i++) {
        pages.push(i)
      }

      const src = await this._getInputFile(inputFile)
      const ext = new pdf.ExternalDocument(src)
      this.doc.setTemplate(ext)

      return Promise.all(
        pages.map(async (page) => this.doc.addPageOf(page, ext))
      )
    } else {
      console.log('invalid function parameter')
    }
  }

  async _addGivenPages (inputFile, pages) {
    if (pages.length > 0) {
      const src = await this._getInputFile(inputFile)
      const ext = new pdf.ExternalDocument(src)
      this.doc.setTemplate(ext)

      return Promise.all(
        pages.map(async (page) => {
          this.doc.addPageOf(page, ext)
        })
      )
    }
  }

  async saveAsBuffer () {
    return this.doc.asBuffer()
  }

  async save (fileName) {
    try {
      const buffer = await this.saveAsBuffer()
      await fs.writeFile(fileName, buffer)
      this._resetDoc()
      return;
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = PDFMerger
