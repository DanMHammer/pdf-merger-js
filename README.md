## Setup

Clone https://github.com/DanMHammer/pdfjs/tree/addPageRangeOf

In pdfjs, run `yarn link` (might need to elevate)

In pdf-merger-js run `yarn link "pdfjs"`

## Performance Testing

`npm run test:performance`

This will test a few things:

Non Browser: 
  - Original
  - Simple optimization moving this code block outside of the for loops:
   ```javascript
      const src = (inputFile instanceof Buffer) ? inputFile : fs.readFileSync(inputFile)
      const ext = new pdf.ExternalDocument(src)
      this.doc.setTemplate(ext)
   ```
  - Promises implementation
  - Implementation of the new addPageRangeOf and addSpecificPagesOf functions from pdfjs
  - Async Implementation of the new functions from pdfjs

Browser:
The browser version already contains the for loop optimization and Promise.all, so that is not tested
  - Original
  - Implementation of the new addPageRangeOf and addSpecificPagesOf functions from this PR against pdfjs: https://github.com/rkusa/pdfjs/pull/263

For both, the test evaluates:
1. The memory used by adding a range of pages or specific page numbers is reduced by the newFns 
2. The execution time
3. The extra memory used by adding specific pages vs the entire document is also reduced.

## Results (reformatted)

```
PASS  test/performance.test.js (36.354 s)
  PDFMerger
    ✓ main-old: merge two files with many pages with page range (21027 ms)
    ✓ main-simple_changes: merge two files with many pages with page range (2354 ms)
    ✓ main-promises: merge two files with many pages with page range using Promises (1340 ms)
    ✓ main-async: merge two files with many pages with page range using async (1265 ms)
    ✓ main-async-newFns: merge two files with many pages with page range using async and new functions (1371 ms)
    ✓ main: merge two files with many pages with page range using new pdfjs functions (1506 ms)
    ✓ main: merge two files with many pages (1904 ms)
    ✓ main: compare memory usage (55 ms)
    ✓ browser-old: merge two files with many pages with page range (1247 ms)
    ✓ browser: merge two files with many pages with page range using new pdfjs functions (1080 ms)
    ✓ browser: merge two files with many pages (1594 ms)
    ✓ browser: compare memory usage (44 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        37.554 s

Non Browser:
  {
    consumption: {
      old: 1445.703125,
      simpleChages: 217.11328125,
      promises: 186.7578125,
      async: 185.08984375,
      asyncNewFns: 235.6171875,
      newFns: 238.4375,
      entireDoc: 210.81640625
    },
    time: {
      oldTime: [ 20, 996347817 ],
      simpleChagesTime: [ 2, 320817410 ],
      promisesTime: [ 1, 288916547 ],
      asyncTime: [ 1, 237489280 ],
      asyncNewFnsTime: [ 1, 332431017 ],
      newFnsTime: [ 1, 468168805 ],
      entireDocTime: [ 1, 862276504 ]
    },
    percentDiffs: {
      old: 585.7640497322537,
      simpleChages: 2.9868998869721506,
      promises: -11.412106950286276,
      async: -12.20330189553262,
      newFns: 13.101965943411958
    }
  }

Browser:
  {
    consumption: { 
      old: 188.22265625, 
      newFns: 239.73046875, 
      entireDoc: 240.6484375 
    },
    time: {
      oldTime: [ 1, 185444559 ],
      newFnsTime: [ 1, 4546227 ],
      entireDocTime: [ 1, 554343781 ]
    },
    percentDiffs: { 
      old: -21.785215725741, 
      newFns: -0.38145635165405967 
    }
  }

```

### Takeaway

It appears from my performance testing that these new functions I submitted to pdfjs reduce the overall execution time but use slightly more memory than just wrapping in Promises/using async.

I recommend converting index.js to use async functions for adding Pages and cleaning them up by only setting the template once. This also will make it simpler to mostly unify the two versions.